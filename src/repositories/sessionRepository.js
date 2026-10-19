import { usuariosService } from '../services/storageService';
import { readJSON, writeJSON, remove } from './storage.js';

const CLAVE_META = 'pw_hu1_sesion';
const CLAVE_PESTANA = 'pw_hu1_pestana';


export const sessionRepository = {
  start(usuario, version, recordar) {
    usuariosService.setCurrentSession(usuario);
    writeJSON(localStorage, CLAVE_META, { usuarioId: usuario.id, version, recordar });
    if (recordar) remove(sessionStorage, CLAVE_PESTANA);
    else writeJSON(sessionStorage, CLAVE_PESTANA, true);
  },


  current() {
    const usuario = usuariosService.getCurrentSession();
    const meta = readJSON(localStorage, CLAVE_META);
    return {
      usuario,
      meta: usuario && meta?.usuarioId === usuario.id ? meta : null,
      pestanaActiva: Boolean(readJSON(sessionStorage, CLAVE_PESTANA))
    };
  },

  updateUser(usuario) {
    if (usuariosService.getCurrentSession()?.id === usuario.id) usuariosService.setCurrentSession(usuario);
  },

  setVersion(version) {
    const meta = readJSON(localStorage, CLAVE_META);
    if (meta) writeJSON(localStorage, CLAVE_META, { ...meta, version });
  },

  clear() {
    usuariosService.setCurrentSession(null);
    remove(localStorage, CLAVE_META);
    remove(sessionStorage, CLAVE_PESTANA);
  }
};
