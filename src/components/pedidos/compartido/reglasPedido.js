/* HU-4 · Reglas puras de pedidos: franjas de recojo, ventana de cancelación y fechas.
   No usan React ni almacenamiento, así que se reutilizan tal cual en Express (Entrega 2). */
import { horarioDelDia } from '../../carrito/compartido/reglas';

export const MINUTOS_FRANJA = 30;        // franjas de 30 minutos (mockup 4.1)
export const CAPACIDAD_FRANJA = 6;       // pedidos activos por franja y por local; con más, la franja sale tachada
export const TOLERANCIA_RECOJO_MIN = 15; // el local guarda el pedido 15 min desde el inicio de la franja
export const CANCELAR_ANTES_MIN = 20;    // se puede cancelar hasta 20 min antes de la franja (mockup 4.5)

export const ESTADOS_EN_CURSO = ['recibido', 'en_preparacion', 'listo'];
export const enCurso = (pedido) => ESTADOS_EN_CURSO.includes(pedido.estado);

const pad = (n) => String(n).padStart(2, '0');
export const aMinutos = (hhmm) => {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + m;
};
export const aHHMM = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
export const horaDe = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
// Mismo formato que usan los pedidos del grupo (datos-semilla): «15/09/2026».
export const fechaCorta = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;

// Fecha y hora de la franja de un pedido. Acepta «dd/mm/aaaa» (semilla) y «aaaa-mm-dd» (contrato).
export function momentoRecojo(pedido) {
  const f = String(pedido.fechaPedido ?? '');
  const [a, b, c] = f.includes('/') ? f.split('/').map(Number).reverse() : f.split('-').map(Number);
  const d = new Date(a, (b || 1) - 1, c || 1);
  d.setMinutes(aMinutos(pedido.horaRecojo || '00:00'));
  return d;
}

// Hasta qué hora guarda el local un pedido listo: «16:15» para una franja de las 16:00.
export const guardadoHasta = (pedido) => aHHMM(aMinutos(pedido.horaRecojo) + TOLERANCIA_RECOJO_MIN);

// Tiempo de preparación del pedido: el producto más lento (si no hay dato, el estimado del local).
export function minutosPreparacion(productos, local) {
  const tiempos = productos.map((p) => Number(p?.tiempoPreparacionMin) || 0).filter(Boolean);
  return tiempos.length ? Math.max(...tiempos) : Number(local?.tiempoEstimadoMin) || 15;
}

/**
 * Franjas de hoy del local. Una franja se ofrece si:
 *  - no pasó y alcanza el tiempo de preparación desde ahora,
 *  - no es posterior al cierre menos el tiempo de preparación (CONTRATO_DATOS, caso límite 1),
 *  - no tiene ya CAPACIDAD_FRANJA pedidos activos.
 * ocupacion: { 'HH:mm': cantidad de pedidos activos }
 * Devuelve { franjas: [{ hora, disponible, motivo }], horario, ultima }.
 */
export function franjasDelDia(local, minutosPrep, ocupacion = {}, ahora = new Date()) {
  const horario = horarioDelDia(local, ahora);
  if (!horario?.abierto) return { franjas: [], horario: null, ultima: null };

  const apertura = aMinutos(horario.horaApertura);
  const cierre = aMinutos(horario.horaCierre);
  const ahoraMin = ahora.getHours() * 60 + ahora.getMinutes();
  const listoDesde = Math.max(ahoraMin, apertura) + minutosPrep;
  const primera = Math.ceil((apertura + minutosPrep) / MINUTOS_FRANJA) * MINUTOS_FRANJA; // nada sale listo al abrir
  const ultima = Math.floor((cierre - minutosPrep) / MINUTOS_FRANJA) * MINUTOS_FRANJA;

  const franjas = [];
  for (let t = primera; t <= ultima; t += MINUTOS_FRANJA) {
    const hora = aHHMM(t);
    let motivo = null;
    if (t < ahoraMin) motivo = 'pasada';
    else if (t < listoDesde) motivo = 'preparacion';
    else if ((ocupacion[hora] ?? 0) >= CAPACIDAD_FRANJA) motivo = 'completa';
    franjas.push({ hora, disponible: !motivo, motivo });
  }
  return { franjas, horario, ultima: ultima >= primera ? aHHMM(ultima) : null };
}

// Valida la franja elegida justo antes de confirmar. Devuelve null o { tipo, mensaje }.
export function validarFranja(local, minutosPrep, hora, ocupacion = {}, ahora = new Date()) {
  if (!hora) return { tipo: 'vacia', mensaje: 'Elige una hora de recojo.' };
  const { franjas, horario, ultima } = franjasDelDia(local, minutosPrep, ocupacion, ahora);
  if (!horario) return { tipo: 'cerrado', mensaje: `${local.nombreComercial} no atiende hoy. Elige otro local.` };
  const franja = franjas.find((f) => f.hora === hora);
  if (!franja) {
    return {
      tipo: 'fuera',
      mensaje: `La franja ${hora} quedó fuera del horario del local. Elige otra hora para continuar.`,
      detalle: ultima ? `El local cierra a las ${horario.horaCierre}. La última franja de recojo es ${ultima}.` : `El local cierra a las ${horario.horaCierre}.`,
    };
  }
  if (franja.motivo === 'pasada') return { tipo: 'pasada', mensaje: `La franja ${hora} ya pasó. Elige otra hora para continuar.` };
  if (franja.motivo === 'preparacion') return { tipo: 'preparacion', mensaje: `La franja ${hora} ya no alcanza los ${minutosPrep} min de preparación. Elige una más tarde.` };
  if (franja.motivo === 'completa') return { tipo: 'completa', mensaje: `La franja ${hora} se llenó. Elige otra hora para continuar.` };
  return null;
}

/**
 * Ventana de cancelación (mockup 4.4/4.5): solo pedidos recibidos o en preparación
 * y hasta CANCELAR_ANTES_MIN minutos antes de la franja.
 * Devuelve { puede, faltan, motivo } donde faltan = minutos que quedan para la franja.
 */
export function ventanaCancelacion(pedido, ahora = new Date()) {
  const faltan = Math.floor((momentoRecojo(pedido) - ahora) / 60000);
  if (pedido.estado === 'listo') return { puede: false, faltan, motivo: 'listo' };
  if (!['recibido', 'en_preparacion'].includes(pedido.estado)) return { puede: false, faltan, motivo: 'estado' };
  if (faltan < CANCELAR_ANTES_MIN) return { puede: false, faltan, motivo: 'tiempo' };
  return { puede: true, faltan, motivo: null };
}

// Pasos de la línea de avance (mockup 4.4).
export function pasosAvance(pedido) {
  const orden = ['recibido', 'en_preparacion', 'listo', 'entregado'];
  // Entregado cierra la línea: los cuatro pasos quedan hechos.
  const actual = pedido.estado === 'entregado' ? orden.length : orden.indexOf(pedido.estado);
  const pasos = [
    { clave: 'recibido', titulo: 'Recibido', hora: pedido.horaRecibido, ayuda: 'el local vio tu pedido' },
    { clave: 'en_preparacion', titulo: 'En preparación', hora: pedido.horaPreparacion, ayuda: 'lo están preparando' },
    { clave: 'listo', titulo: 'Listo', hora: pedido.horaListo, ayuda: 'te espera en el mostrador', pendiente: 'Te avisaremos' },
    { clave: 'entregado', titulo: 'Entregado', hora: pedido.horaEntrega, ayuda: 'recogido', pendiente: 'Al dictar tu código' },
  ];
  return pasos.map((p, i) => ({ ...p, estado: i < actual ? 'hecho' : i === actual ? 'actual' : 'pendiente' }));
}

// Como en el mockup: «3 productos» = tres líneas distintas (2 × sándwich cuenta como una).
export const textoProductos = (items = []) => `${items.length} ${items.length === 1 ? 'producto' : 'productos'}`;
