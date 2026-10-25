/* HU-3 · Catálogo y carrito.
   Capa de servicios de solo LECTURA sobre locales y productos (entidades de HU-2): no escribe sobre ellas.
   En la Entrega 2 estas funciones pasan a ser llamadas a la API REST sin que cambien las pantallas. */
import { localesService, productosService } from './storageService';
import { ApiError } from './ApiError';
import {
  PRODUCTOS_POR_PAGINA, normalizar, recibePedidos, textoHorario, proximaApertura, resolverSeleccion, tieneObligatorios,
} from '../components/carrito/compartido/reglas';

const visibles = (localId) =>
  productosService.getByLocal(localId).filter((p) => p.disponibilidad !== 'retirado');

// Datos que muestran las tarjetas y la cabecera de la carta.
const resumenLocal = (local) => ({
  ...local,
  recibePedidos: recibePedidos(local),
  textoHorario: textoHorario(local),
  proximaApertura: proximaApertura(local),
});

const conProducto = (p) => ({ ...p, tieneObligatorios: tieneObligatorios(p) });

export const catalogoService = {
  /* 3.1 · Locales del campus: abiertos primero; los cerrados al final, atenuados (nunca ocultos). */
  listarLocales({ q = '', sede = '', soloAbiertos = false, orden = 'espera' } = {}) {
    const texto = normalizar(q);
    const todos = localesService.getAll().map(resumenLocal);
    const sedes = [...new Set(todos.map((l) => l.sede).filter(Boolean))].sort();

    let filas = todos.filter((l) =>
      (!sede || l.sede === sede) &&
      (!texto || normalizar(l.nombreComercial).includes(texto) || normalizar(l.ubicacionCampus).includes(texto)),
    );
    const abiertos = filas.filter((l) => l.recibePedidos).length;
    const cerrados = filas.length - abiertos;
    if (soloAbiertos) filas = filas.filter((l) => l.recibePedidos);

    const porOrden = orden === 'nombre'
      ? (a, b) => a.nombreComercial.localeCompare(b.nombreComercial)
      : orden === 'calificacion'
        ? (a, b) => (b.calificacionPromedio ?? 0) - (a.calificacionPromedio ?? 0)
        : (a, b) => (a.tiempoEstimadoMin ?? 99) - (b.tiempoEstimadoMin ?? 99);
    filas.sort((a, b) => Number(b.recibePedidos) - Number(a.recibePedidos) || porOrden(a, b));

    return { locales: filas, abiertos, cerrados, sedes };
  },

  /* Búsqueda de la portada («Busca sándwich o Cafetería Central»): productos que coinciden. */
  buscarProductos(q) {
    const texto = normalizar(q);
    if (texto.length < 2) return [];
    const locales = localesService.getAll();
    return productosService.getAll()
      .filter((p) => p.disponibilidad !== 'retirado' && (normalizar(p.nombre).includes(texto) || normalizar(p.descripcion).includes(texto)))
      .map((p) => ({ ...conProducto(p), local: resumenLocal(locales.find((l) => l.id === p.localId) ?? {}) }));
  },

  /* 3.2 · Cabecera de la carta y categorías con al menos un producto visible. */
  obtenerCarta(localId) {
    const local = localesService.getById(localId);
    if (!local) throw new ApiError('LOCAL_NO_ENCONTRADO', 'Este local no existe.', { status: 404 });
    const productos = visibles(localId);
    const categorias = productosService.getCategorias(localId).filter((c) => productos.some((p) => p.categoriaId === c.id));
    return { local: resumenLocal(local), categorias };
  },

  /* 3.2 · Retícula con búsqueda, categoría, rango de precio y disponibilidad; paginada de 8 en 8. */
  productosDeCarta(localId, { categoriaId = '', q = '', min = null, max = null, soloDisponibles = false, pagina = 1 } = {}) {
    if (min != null && max != null && min > max)
      throw new ApiError('RANGO_INVALIDO', 'El precio mínimo no puede ser mayor que el máximo.', { field: 'precio', status: 422 });
    const texto = normalizar(q);
    const orden = Object.fromEntries(productosService.getCategorias(localId).map((c) => [c.id, c.orden]));

    const filas = visibles(localId)
      .filter((p) =>
        (!categoriaId || p.categoriaId === categoriaId) &&
        (!soloDisponibles || p.disponibilidad === 'disponible') &&
        (min == null || p.precio >= min) &&
        (max == null || p.precio <= max) &&
        (!texto || normalizar(p.nombre).includes(texto) || normalizar(p.descripcion).includes(texto)),
      )
      .sort((a, b) => (orden[a.categoriaId] ?? 0) - (orden[b.categoriaId] ?? 0) || a.nombre.localeCompare(b.nombre));

    const paginas = Math.max(1, Math.ceil(filas.length / PRODUCTOS_POR_PAGINA));
    const actual = Math.min(Math.max(1, pagina), paginas);
    const desde = (actual - 1) * PRODUCTOS_POR_PAGINA;
    return {
      productos: filas.slice(desde, desde + PRODUCTOS_POR_PAGINA).map(conProducto),
      total: filas.length,
      pagina: actual,
      paginas,
      desde: filas.length ? desde + 1 : 0,
      hasta: Math.min(desde + PRODUCTOS_POR_PAGINA, filas.length),
    };
  },

  /* 3.3 · Detalle del producto (los retirados no se muestran al comensal). */
  obtenerProducto(productoId) {
    const p = productosService.getById(productoId);
    if (!p || p.disponibilidad === 'retirado')
      throw new ApiError('PRODUCTO_NO_DISPONIBLE', 'Este producto ya no está en la carta.', { status: 404 });
    const local = localesService.getById(p.localId);
    const categoria = productosService.getCategorias(p.localId).find((c) => c.id === p.categoriaId);
    return { ...conProducto(p), local: resumenLocal(local), categoria: categoria?.nombre ?? '' };
  },

  /* 3.3 / 3.5 · Productos disponibles parecidos: misma categoría primero y precio cercano. */
  productosSimilares(productoId, cantidad = 3) {
    const p = productosService.getById(productoId);
    if (!p) return [];
    return visibles(p.localId)
      .filter((x) => x.id !== p.id && x.disponibilidad === 'disponible')
      .sort((a, b) =>
        Number(b.categoriaId === p.categoriaId) - Number(a.categoriaId === p.categoriaId) ||
        Math.abs(a.precio - p.precio) - Math.abs(b.precio - p.precio))
      .slice(0, cantidad)
      .map(conProducto);
  },

  /* 3.4 / 3.5 · Revisa el carrito contra la carta actual: mismo local, productos y opciones vigentes, precios al día. */
  verificarCarrito(localId, items) {
    const local = localId ? localesService.getById(localId) : null;
    const resultado = items.map((item) => {
      const base = { itemCarritoId: item.itemCarritoId, productoId: item.productoId, nombre: item.nombre };
      const p = productosService.getById(item.productoId);
      if (!local) return { ...base, problema: 'local', mensaje: 'El local ya no existe.' };
      if (!p || p.disponibilidad === 'retirado') return { ...base, problema: 'retirado', mensaje: 'Ya no está en la carta.' };
      if (p.localId !== localId) return { ...base, problema: 'otro_local', mensaje: 'Pertenece a otro local.' };
      if (p.disponibilidad === 'agotado_dia') return { ...base, problema: 'agotado', mensaje: 'Se agotó por hoy.' };
      const sel = resolverSeleccion(p, (item.opcionesSeleccionadas ?? []).map((o) => ({ grupoId: o.grupoId, opcionId: o.opcionId })));
      if (sel.invalida || sel.faltan.length)
        return { ...base, problema: 'opciones', mensaje: sel.faltan.length ? `Ahora debes elegir: ${sel.faltan.join(', ')}.` : 'Una de las opciones elegidas ya no existe.' };
      return { ...base, problema: null, nombre: p.nombre, precioBase: p.precio, fotografia: p.fotografia, tiempoPreparacionMin: p.tiempoPreparacionMin, opcionesSeleccionadas: sel.opcionesSeleccionadas };
    });
    return { local: local ? resumenLocal(local) : null, items: resultado };
  },
};
