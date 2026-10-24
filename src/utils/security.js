export const CONTRASENA_DEMO = 'Ulima2026';

function resumen(texto) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < texto.length; i++) {
    const c = texto.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

export const generarToken = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');

export function hashContrasena(contrasena) {
  const sal = generarToken().slice(0, 8);
  return `sim$${sal}$${resumen(sal + contrasena)}`;
}

export function verificarContrasena(hash, contrasena) {
  if (!hash) return false;
  if (hash.startsWith('sim$')) {
    const [, sal, esperado] = hash.split('$');
    return resumen(sal + contrasena) === esperado;
  }
  return contrasena === CONTRASENA_DEMO;
}
