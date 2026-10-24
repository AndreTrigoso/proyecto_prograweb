import { readJSON, writeJSON } from './storage.js';

const CLAVE_INTENTOS = 'pw_hu1_intentos_login';
const CLAVE_TOKENS = 'pw_hu1_tokens_recuperacion';
const CLAVE_VERSIONES = 'pw_hu1_versiones_sesion';

// Intentos fallidos de inicio de sesión por correo.
export const intentosRepository = {
  get: (correo) => readJSON(localStorage, CLAVE_INTENTOS, {})[correo] ?? { cantidad: 0, bloqueadoHasta: 0 },
  set(correo, valor) {
    writeJSON(localStorage, CLAVE_INTENTOS, { ...readJSON(localStorage, CLAVE_INTENTOS, {}), [correo]: valor });
  },
  clear(correo) {
    const todos = readJSON(localStorage, CLAVE_INTENTOS, {});
    delete todos[correo];
    writeJSON(localStorage, CLAVE_INTENTOS, todos);
  }
};


export const tokensRepository = {
  all: () => readJSON(localStorage, CLAVE_TOKENS, []),
  create(token) {
    const otros = this.all().filter((t) => t.usuarioId !== token.usuarioId);
    writeJSON(localStorage, CLAVE_TOKENS, [...otros, token]);
  },
  find: (valor) => readJSON(localStorage, CLAVE_TOKENS, []).find((t) => t.valor === valor) ?? null,
  remove(valor) {
    writeJSON(localStorage, CLAVE_TOKENS, this.all().filter((t) => t.valor !== valor));
  }
};


export const versionesRepository = {
  get: (usuarioId) => readJSON(localStorage, CLAVE_VERSIONES, {})[usuarioId] ?? 1,
  bump(usuarioId) {
    const todas = readJSON(localStorage, CLAVE_VERSIONES, {});
    todas[usuarioId] = (todas[usuarioId] ?? 1) + 1;
    writeJSON(localStorage, CLAVE_VERSIONES, todas);
    return todas[usuarioId];
  }
};
