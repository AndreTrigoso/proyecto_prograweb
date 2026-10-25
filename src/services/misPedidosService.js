/* HU-4 · Pedidos del comensal.
   Crea pedidos con la forma del contrato (CONTRATO_DATOS · Pedido) para que la bandeja del local (HU-5) los vea,
   y solo deja ver o cancelar los pedidos del propio comensal.
   En la Entrega 2 estas funciones pasan a ser llamadas a la API REST sin que cambien las pantallas. */
import { localesService, pedidosService, productosService } from './storageService';
import { catalogoService } from './catalogoService';
import { ApiError } from './ApiError';
import { normalizar, precioUnitario, recibePedidos, resolverSeleccion } from '../components/carrito/compartido/reglas';
import {
  ESTADOS_EN_CURSO, aMinutos, fechaCorta, franjasDelDia, minutosPreparacion, validarFranja, ventanaCancelacion,
} from '../components/pedidos/compartido/reglasPedido';

const redondear = (n) => Math.round(n * 100) / 100;

// Pedidos activos por franja de hoy en un local: { '11:30': 2, ... }
function ocupacionDe(localId, ahora) {
  const fecha = fechaCorta(ahora);
  return pedidosService.getByLocal(localId)
    .filter((p) => p.fechaPedido === fecha && ESTADOS_EN_CURSO.includes(p.estado))
    .reduce((acc, p) => ({ ...acc, [p.horaRecojo]: (acc[p.horaRecojo] ?? 0) + 1 }), {});
}

const conLocal = (pedido) => {
  const local = localesService.getById(pedido.localId);
  return { ...pedido, local, nombreLocal: local?.nombreComercial ?? 'Local' };
};

const masReciente = (a, b) => String(b.fechaHoraCreacion ?? '').localeCompare(String(a.fechaHoraCreacion ?? ''));

export const misPedidosService = {
  /* 4.1 · Datos para confirmar: verifica el carrito y calcula las franjas de hoy. */
  prepararConfirmacion(localId, items, ahora = new Date()) {
    const { local, items: verificados } = catalogoService.verificarCarrito(localId, items);
    if (!local) throw new ApiError('LOCAL_NO_EXISTE', 'El local de tu carrito ya no existe.', { status: 404 });
    const problemas = verificados.filter((v) => v.problema);
    const minutosPrep = minutosPreparacion(verificados.filter((v) => !v.problema), local);
    const ocupacion = ocupacionDe(localId, ahora);
    const { franjas, horario, ultima } = franjasDelDia(local, minutosPrep, ocupacion, ahora);
    return { local, verificados, problemas, minutosPrep, ocupacion, franjas, horario, ultima, fecha: fechaCorta(ahora) };
  },

  /* 4.1 → 4.2 · Valida todo otra vez (el local pudo cambiar mientras el comensal elegía) y crea el pedido. */
  confirmar({ usuario, localId, items, horaRecojo }, ahora = new Date()) {
    if (!usuario) throw new ApiError('NO_AUTENTICADO', 'Inicia sesión para confirmar tu pedido.', { status: 401 });
    if (!items?.length) throw new ApiError('CARRITO_VACIO', 'Tu carrito está vacío.', { status: 400 });

    const { local, verificados, problemas, minutosPrep } = this.prepararConfirmacion(localId, items, ahora);
    if (!recibePedidos(local)) {
      throw new ApiError('LOCAL_NO_RECIBE', local.estado === 'suspendido'
        ? `${local.nombreComercial} suspendió la recepción de pedidos. Guardamos tu carrito para cuando reabra.`
        : `${local.nombreComercial} está cerrado. Guardamos tu carrito para cuando abra.`, { status: 409 });
    }
    if (problemas.length) {
      throw new ApiError('PRODUCTO_NO_DISPONIBLE', `«${problemas[0].nombre}»: ${problemas[0].mensaje}`, { status: 409 });
    }
    const error = validarFranja(local, minutosPrep, horaRecojo, ocupacionDe(localId, ahora), ahora);
    if (error) {
      const e = new ApiError('FRANJA_INVALIDA', error.mensaje, { field: 'horaRecojo', status: 409 });
      e.detalle = error.detalle;
      throw e;
    }

    // Copia congelada de los ítems con los precios vigentes (CarritoItem del contrato).
    const congelados = items.map((item) => {
      const v = verificados.find((x) => x.itemCarritoId === item.itemCarritoId);
      const unitario = precioUnitario(v.precioBase, v.opcionesSeleccionadas);
      return {
        itemCarritoId: item.itemCarritoId,
        productoId: item.productoId,
        nombre: v.nombre,
        fotografia: v.fotografia,
        precioBase: v.precioBase,
        opcionesSeleccionadas: v.opcionesSeleccionadas,
        cantidad: item.cantidad,
        nota: item.nota ?? '',
        precioUnitario: unitario,
        subtotal: redondear(unitario * item.cantidad),
      };
    });

    const pedido = pedidosService.create({
      comensalId: usuario.id,
      comensalNombre: [usuario.nombres, usuario.apellidos?.split(' ')[0]].filter(Boolean).join(' '),
      comensalCorreo: usuario.correo,
      comensalTelefono: usuario.telefono,
      comensalHistorial: `${usuario.pedidosTotales ?? 0} pedidos · ${usuario.pedidosNoRecogidos ?? 0} no recogidos`,
      localId,
      items: congelados,
      total: redondear(congelados.reduce((s, i) => s + i.subtotal, 0)),
      horaRecojo,
      fechaPedido: fechaCorta(ahora),
      minutosRestantes: Math.max(0, aMinutos(horaRecojo) - (ahora.getHours() * 60 + ahora.getMinutes())),
    });
    return conLocal(pedido);
  },

  /* 4.3 · Pedidos del comensal, del más reciente al más antiguo. */
  listar(comensalId) {
    return pedidosService.getByComensal(comensalId).map(conLocal).sort(masReciente);
  },

  /* 4.2 / 4.4 · Un pedido del propio comensal (los de otros comensales no se muestran). */
  obtener(pedidoId, comensalId) {
    const pedido = pedidosService.getById(pedidoId);
    if (!pedido || pedido.comensalId !== comensalId) {
      throw new ApiError('PEDIDO_NO_EXISTE', 'No encontramos ese pedido entre los tuyos.', { status: 404 });
    }
    return conLocal(pedido);
  },

  /* 4.5 · Cancelar dentro de la ventana permitida. */
  cancelar(pedidoId, comensalId, ahora = new Date()) {
    const pedido = this.obtener(pedidoId, comensalId);
    const v = ventanaCancelacion(pedido, ahora);
    if (!v.puede) {
      const mensaje = v.motivo === 'listo'
        ? 'Ya no puedes cancelar: el pedido está preparado y esperando en el mostrador.'
        : v.motivo === 'tiempo'
          ? 'Ya no puedes cancelar: faltan menos de 20 minutos para tu franja.'
          : 'Este pedido ya no se puede cancelar.';
      throw new ApiError('CANCELACION_FUERA_DE_VENTANA', mensaje, { status: 409 });
    }
    return conLocal(pedidosService.cancelar(pedidoId, 'Cancelado por el comensal desde la aplicación.'));
  },

  /* 4.3 · «Repetir»: líneas para volver al carrito con los precios y opciones de hoy.
     Los productos agotados, retirados o cuyas opciones ya no existen se omiten. */
  lineasParaRepetir(pedido) {
    const lineas = [];
    const omitidos = [];
    pedido.items.forEach((item) => {
      const producto = productosService.getById(item.productoId);
      if (!producto || producto.localId !== pedido.localId || producto.disponibilidad !== 'disponible') {
        omitidos.push(item.nombre);
        return;
      }
      const grupos = producto.gruposOpciones ?? [];
      const seleccion = (item.opcionesSeleccionadas ?? []).map((o) => {
        const grupo = grupos.find((g) => g.id === o.grupoId) ?? grupos.find((g) => g.opciones.some((x) => normalizar(x.nombre) === normalizar(o.nombre)));
        const opcion = grupo?.opciones.find((x) => x.id === o.opcionId) ?? grupo?.opciones.find((x) => normalizar(x.nombre) === normalizar(o.nombre));
        return grupo && opcion ? { grupoId: grupo.id, opcionId: opcion.id } : null;
      });
      const sel = resolverSeleccion(producto, seleccion.filter(Boolean));
      if (seleccion.includes(null) || sel.invalida || sel.faltan.length) {
        omitidos.push(item.nombre);
        return;
      }
      lineas.push({ producto, cantidad: item.cantidad, opcionesSeleccionadas: sel.opcionesSeleccionadas, nota: item.nota ?? '' });
    });
    return { lineas, omitidos };
  },
};
