export const ROL_INICIO = {
  comensal: '/locales',
  local: '/local/bandeja',
  administrador: '/admin/tablero'
};

const enZona = (ruta, zona) => ruta === zona || ruta.startsWith(`${zona}/`);

const REGLAS = [
  { coincide: (r) => r.startsWith('/mis-'), roles: ['comensal'] },
  { coincide: (r) => enZona(r, '/local'), roles: ['local'] },
  { coincide: (r) => enZona(r, '/admin'), roles: ['administrador'] }
];

export function puedeEntrar(rol, ruta = '') {
  const limpia = String(ruta).split(/[?#]/)[0];
  if (!limpia || limpia === '/') return false;
  const regla = REGLAS.find((r) => r.coincide(limpia));
  return regla ? regla.roles.includes(rol) : true;
}