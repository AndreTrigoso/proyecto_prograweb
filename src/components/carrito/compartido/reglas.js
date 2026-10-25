/* HU-3 · Reglas puras del catálogo y del carrito (sin React ni almacenamiento).
   Se reutilizan tal cual en el servidor Express de la Entrega 2. */

export const MAX_CANTIDAD = 20;        // unidades por ítem del carrito
export const MAX_NOTA = 120;           // caracteres de la nota por producto (mockup 3.3)
export const PRODUCTOS_POR_PAGINA = 8; // retícula de la carta (mockup 3.2)

const DIAS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
const NOMBRE_DIA = { lunes: 'lunes', martes: 'martes', miercoles: 'miércoles', jueves: 'jueves', viernes: 'viernes', sabado: 'sábado', domingo: 'domingo' };

export const normalizar = (texto = '') =>
  String(texto).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export const soles = (monto) => `S/ ${Number(monto || 0).toFixed(2)}`;

/* ---------- Horario del local (contrato: horarioAtencion = HorarioDia[]) ---------- */

export function horarioDelDia(local, fecha = new Date()) {
  const dia = DIAS[fecha.getDay()];
  return (local.horarioAtencion ?? []).find((h) => h.dia === dia) ?? null;
}

// Próxima apertura dentro de la semana: «hoy a las 11:30», «mañana a las 07:30», «el lunes a las 08:00».
export function proximaApertura(local, ahora = new Date()) {
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
  for (let i = 0; i < 7; i++) {
    const fecha = new Date(ahora);
    fecha.setDate(ahora.getDate() + i);
    const h = horarioDelDia(local, fecha);
    if (!h?.abierto) continue;
    const [hh, mm] = h.horaApertura.split(':').map(Number);
    if (i === 0 && hh * 60 + mm <= minutosAhora) continue;
    const cuando = i === 0 ? 'hoy' : i === 1 ? 'mañana' : `el ${NOMBRE_DIA[DIAS[fecha.getDay()]]}`;
    return `${cuando} a las ${h.horaApertura}`;
  }
  return null;
}

// El local recibe pedidos cuando su estado (que controla el propio local en HU-2) es «abierto».
export const recibePedidos = (local) => local?.estado === 'abierto';

// Texto que acompaña al nombre en las tarjetas: «07:30 a 19:00» o «abre mañana a las 07:30».
export function textoHorario(local, ahora = new Date()) {
  if (local.estado === 'suspendido') return 'No recibe pedidos por ahora';
  const h = horarioDelDia(local, ahora);
  if (recibePedidos(local) && h?.abierto) return `${h.horaApertura} a ${h.horaCierre}`;
  if (recibePedidos(local)) return 'hoy fuera de su horario';
  const prox = proximaApertura(local, ahora);
  return prox ? `abre ${prox}` : 'Cerrado por ahora';
}

/* ---------- Grupos de opciones (contrato: GrupoOpcion { tipo, obligatorio, maxSeleccion }) ---------- */

// Los grupos opcionales de selección única arrancan con su primera alternativa («En el local»);
// los obligatorios arrancan vacíos para que el comensal elija (mockup 3.3).
export function seleccionInicial(producto) {
  return (producto.gruposOpciones ?? [])
    .filter((g) => g.tipo === 'unica' && !g.obligatorio && g.opciones?.length)
    .map((g) => ({ grupoId: g.id, opcionId: g.opciones[0].id }));
}

/**
 * Valida una selección contra los grupos actuales del producto.
 * seleccion: [{ grupoId, opcionId }]
 * Devuelve { opcionesSeleccionadas, faltan, invalida } con la forma del contrato (CarritoItem.opcionesSeleccionadas).
 */
export function resolverSeleccion(producto, seleccion = []) {
  const grupos = producto.gruposOpciones ?? [];
  const opcionesSeleccionadas = [];
  const faltan = [];
  let invalida = false;

  for (const g of grupos) {
    const elegidas = seleccion.filter((s) => s.grupoId === g.id);
    const opciones = elegidas.map((s) => g.opciones.find((o) => o.id === s.opcionId));
    if (opciones.some((o) => !o)) invalida = true; // la opción ya no existe
    const limite = g.tipo === 'unica' ? 1 : g.maxSeleccion || g.opciones.length;
    if (elegidas.length > limite) invalida = true;
    if (g.obligatorio && elegidas.length === 0) faltan.push(g.nombre);
    opciones.filter(Boolean).forEach((o) =>
      opcionesSeleccionadas.push({ grupoId: g.id, opcionId: o.id, nombre: o.nombre, precioAdicional: Number(o.precioAdicional) || 0 }),
    );
  }
  if (seleccion.some((s) => !grupos.some((g) => g.id === s.grupoId))) invalida = true; // grupo eliminado
  return { opcionesSeleccionadas, faltan, invalida };
}

export const tieneObligatorios = (producto) => (producto.gruposOpciones ?? []).some((g) => g.obligatorio);

export const precioUnitario = (precioBase, opciones = []) =>
  Number(precioBase) + opciones.reduce((s, o) => s + (Number(o.precioAdicional) || 0), 0);
