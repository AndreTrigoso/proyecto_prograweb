import initialSeeds from '../data/seeds.json';

const STORAGE_KEYS = {
  USUARIOS: 'pw_cafeterias_usuarios',
  LOCALES: 'pw_cafeterias_locales',
  CATEGORIAS: 'pw_cafeterias_categorias',
  PRODUCTOS: 'pw_cafeterias_productos',
  PEDIDOS: 'pw_cafeterias_pedidos',
  VALORACIONES: 'pw_cafeterias_valoraciones',
  SESSION: 'pw_cafeterias_session',
  INIT_FLAG: 'pw_cafeterias_initialized_v2'
};

/**
 * Inicializa el almacenamiento local con los datos semilla si es la primera vez.
 */
export function initializeStorage(forceReset = false) {
  const isInitialized = localStorage.getItem(STORAGE_KEYS.INIT_FLAG);

  if (!isInitialized || forceReset) {
    localStorage.setItem(STORAGE_KEYS.USUARIOS, JSON.stringify(initialSeeds.usuarios || []));
    localStorage.setItem(STORAGE_KEYS.LOCALES, JSON.stringify(initialSeeds.locales || []));
    localStorage.setItem(STORAGE_KEYS.CATEGORIAS, JSON.stringify(initialSeeds.categorias || []));
    localStorage.setItem(STORAGE_KEYS.PRODUCTOS, JSON.stringify(initialSeeds.productos || []));
    localStorage.setItem(STORAGE_KEYS.PEDIDOS, JSON.stringify(initialSeeds.pedidos || []));
    localStorage.setItem(STORAGE_KEYS.VALORACIONES, JSON.stringify(initialSeeds.valoraciones || []));
    localStorage.setItem(STORAGE_KEYS.INIT_FLAG, 'true');

    // Por defecto iniciar en el rol Local (Cafetería Central) para evaluar HU-5 directamente
    const defaultLocalUser = (initialSeeds.usuarios || []).find(u => u.id === 'usr-local-central') || initialSeeds.usuarios[0];
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(defaultLocalUser));
  }
}

// Helpers genéricos de lectura y escritura
function getCollection(key) {
  initializeStorage();
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error reading ${key} from storage:`, error);
    return [];
  }
}

function saveCollection(key, items) {
  try {
    localStorage.setItem(key, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('pw_storage_updated', { detail: { key, items } }));
  } catch (error) {
    console.error(`Error saving ${key} to storage:`, error);
  }
}

function getCurrentFormattedTime() {
  const now = new Date();
  return now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/* ==================== USUARIOS / AUTENTICACIÓN ==================== */
export const usuariosService = {
  getAll: () => getCollection(STORAGE_KEYS.USUARIOS),
  getById: (id) => getCollection(STORAGE_KEYS.USUARIOS).find(u => u.id === id) || null,
  getByEmail: (email) => getCollection(STORAGE_KEYS.USUARIOS).find(u => u.correo.toLowerCase() === email.toLowerCase()) || null,

  create: (nuevoUsuario) => {
    const usuarios = getCollection(STORAGE_KEYS.USUARIOS);
    const usuarioConId = {
      ...nuevoUsuario,
      id: nuevoUsuario.id || `usr-${Date.now()}`,
      fechaRegistro: new Date().toISOString(),
      estadoCuenta: 'activo',
      motivoBloqueo: null
    };
    usuarios.push(usuarioConId);
    saveCollection(STORAGE_KEYS.USUARIOS, usuarios);
    return usuarioConId;
  },

  update: (id, updates) => {
    const usuarios = getCollection(STORAGE_KEYS.USUARIOS);
    const index = usuarios.findIndex(u => u.id === id);
    if (index === -1) return null;
    usuarios[index] = { ...usuarios[index], ...updates };
    saveCollection(STORAGE_KEYS.USUARIOS, usuarios);
    return usuarios[index];
  },

  toggleBloqueo: (id, motivo) => {
    const usuarios = getCollection(STORAGE_KEYS.USUARIOS);
    const index = usuarios.findIndex(u => u.id === id);
    if (index === -1) return null;
    const actual = usuarios[index];
    const nuevoEstado = actual.estadoCuenta === 'activo' ? 'bloqueado' : 'activo';
    usuarios[index] = {
      ...actual,
      estadoCuenta: nuevoEstado,
      motivoBloqueo: nuevoEstado === 'bloqueado' ? motivo : null
    };
    saveCollection(STORAGE_KEYS.USUARIOS, usuarios);
    return usuarios[index];
  },

  getCurrentSession: () => {
    initializeStorage();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSION);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setCurrentSession: (usuario) => {
    if (usuario) {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(usuario));
    } else {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    }
    window.dispatchEvent(new CustomEvent('pw_session_changed', { detail: usuario }));
  }
};

/* ==================== LOCALES ==================== */
export const localesService = {
  getAll: () => getCollection(STORAGE_KEYS.LOCALES),
  getById: (id) => getCollection(STORAGE_KEYS.LOCALES).find(l => l.id === id) || null,

  update: (id, updates) => {
    const locales = getCollection(STORAGE_KEYS.LOCALES);
    const index = locales.findIndex(l => l.id === id);
    if (index === -1) return null;
    locales[index] = { ...locales[index], ...updates };
    saveCollection(STORAGE_KEYS.LOCALES, locales);
    return locales[index];
  },

  updateEstado: (id, nuevoEstado, motivo = null) => {
    return localesService.update(id, {
      estado: nuevoEstado,
      motivoSuspension: nuevoEstado === 'suspendido' ? motivo : null
    });
  }
};

/* ==================== CATEGORÍAS Y PRODUCTOS ==================== */
export const productosService = {
  getCategorias: (localId) => {
    const cats = getCollection(STORAGE_KEYS.CATEGORIAS);
    return localId ? cats.filter(c => c.localId === localId).sort((a, b) => a.orden - b.orden) : cats;
  },

  crearCategoria: (localId, nombre) => {
    const categorias = getCollection(STORAGE_KEYS.CATEGORIAS);

    const existentes = categorias.filter(
      categoria => categoria.localId === localId
    );

    const nombreNormalizado = nombre.trim();

    if (!nombreNormalizado) {
      throw new Error("El nombre de la categoría es obligatorio.");
    }

    const duplicada = existentes.some(
      categoria =>
        categoria.nombre.trim().toLowerCase() ===
        nombreNormalizado.toLowerCase()
    );

    if (duplicada) {
      throw new Error("Ya existe una categoría con ese nombre.");
    }

    const siguienteOrden =
      Math.max(0, ...existentes.map(c => Number(c.orden) || 0)) + 1;

    const nuevaCategoria = {
      id: `cat-${crypto.randomUUID()}`,
      localId,
      nombre: nombreNormalizado,
      orden: siguienteOrden
    };

    categorias.push(nuevaCategoria);

    saveCollection(STORAGE_KEYS.CATEGORIAS, categorias);

    return nuevaCategoria;
  },

  editarCategoria: (localId, categoriaId, nombre) => {
    const categorias = getCollection(STORAGE_KEYS.CATEGORIAS);

    const indice = categorias.findIndex(
      categoria =>
        categoria.id === categoriaId &&
        categoria.localId === localId
    );

    if (indice === -1) {
      throw new Error("Categoría no encontrada.");
    }

    const nombreNormalizado = nombre.trim();

    if (!nombreNormalizado) {
      throw new Error("El nombre de la categoría es obligatorio.");
    }

    const duplicada = categorias.some(
      categoria =>
        categoria.localId === localId &&
        categoria.id !== categoriaId &&
        categoria.nombre.trim().toLowerCase() ===
          nombreNormalizado.toLowerCase()
    );

    if (duplicada) {
      throw new Error("Ya existe una categoría con ese nombre.");
    }

    categorias[indice] = {
      ...categorias[indice],
      nombre: nombreNormalizado
    };

    saveCollection(STORAGE_KEYS.CATEGORIAS, categorias);

    return categorias[indice];
  },

  eliminarCategoria: (localId, categoriaId) => {
    const categorias = getCollection(STORAGE_KEYS.CATEGORIAS);

    const existe = categorias.some(
      categoria =>
        categoria.id === categoriaId &&
        categoria.localId === localId
    );

    if (!existe) {
      throw new Error("Categoría no encontrada.");
    }

    const tieneProductos = getCollection(
      STORAGE_KEYS.PRODUCTOS
    ).some(
      producto =>
        producto.localId === localId &&
        producto.categoriaId === categoriaId
    );

    if (tieneProductos) {
      throw new Error(
        "No puedes eliminar una categoría que contiene productos."
      );
    }

    const restantes = categorias.filter(
      categoria => categoria.id !== categoriaId
    );

    saveCollection(STORAGE_KEYS.CATEGORIAS, restantes);

    return true;
  },

  getAll: () => getCollection(STORAGE_KEYS.PRODUCTOS),

  getByLocal: (localId) => {
    return getCollection(STORAGE_KEYS.PRODUCTOS).filter(p => p.localId === localId);
  },

  getById: (id) => {
    return getCollection(STORAGE_KEYS.PRODUCTOS).find(p => p.id === id) || null;
  },

  save: (producto) => {
    const prods = getCollection(STORAGE_KEYS.PRODUCTOS);
    if (producto.id) {
      const index = prods.findIndex(p => p.id === producto.id);
      if (index !== -1) {
        prods[index] = { ...prods[index], ...producto };
        saveCollection(STORAGE_KEYS.PRODUCTOS, prods);
        return prods[index];
      }
    }
    const nuevo = {
      ...producto,
      id: producto.id || `prod-${Date.now()}`
    };
    prods.push(nuevo);
    saveCollection(STORAGE_KEYS.PRODUCTOS, prods);
    return nuevo;
  },

  updateDisponibilidad: (id, disponibilidad) => {
    return productosService.save({ id, disponibilidad });
  },

  delete: (id) => {
    const prods = getCollection(STORAGE_KEYS.PRODUCTOS).filter(p => p.id !== id);
    saveCollection(STORAGE_KEYS.PRODUCTOS, prods);
    return true;
  }
};

/* ==================== PEDIDOS (HU-4 y HU-5) ==================== */
export const pedidosService = {
  getAll: () => getCollection(STORAGE_KEYS.PEDIDOS),

  getByComensal: (comensalId) => {
    return getCollection(STORAGE_KEYS.PEDIDOS).filter(p => p.comensalId === comensalId);
  },

  getByLocal: (localId) => {
    return getCollection(STORAGE_KEYS.PEDIDOS).filter(p => p.localId === localId);
  },

  getById: (id) => {
    return getCollection(STORAGE_KEYS.PEDIDOS).find(p => p.id === id) || null;
  },

  getByCodigo: (codigo, localId = null) => {
    const raw = codigo.trim().toUpperCase();
    const normalized = raw.startsWith('PED-') ? raw : `PED-${raw}`;
    return getCollection(STORAGE_KEYS.PEDIDOS).find(p => {
      const matchesCode = p.codigoPedido.toUpperCase() === normalized || p.codigoPedido.toUpperCase() === raw;
      const matchesLocal = localId ? p.localId === localId : true;
      return matchesCode && matchesLocal;
    }) || null;
  },

  create: (pedidoData) => {
    const pedidos = getCollection(STORAGE_KEYS.PEDIDOS);
    const codigoAleatorio = `PED-${Math.floor(1000 + Math.random() * 9000)}`;
    const horaActual = getCurrentFormattedTime();
    const nuevoPedido = {
      ...pedidoData,
      id: `ped-${Date.now()}`,
      codigoPedido: codigoAleatorio,
      horaRecibido: horaActual,
      horaPreparacion: null,
      horaListo: null,
      horaEntrega: null,
      fechaPedido: '15/09/2026',
      fechaHoraCreacion: new Date().toISOString(),
      estado: 'recibido',
      minutosRestantes: 20,
      vencido: false,
      vencidoMinutos: 0,
      categoriaRechazo: null,
      motivoRechazo: null,
      motivoCancelacion: null,
      calificado: false
    };
    pedidos.unshift(nuevoPedido);
    saveCollection(STORAGE_KEYS.PEDIDOS, pedidos);
    return nuevoPedido;
  },

  updateEstado: (id, nuevoEstado, extra = {}) => {
    const pedidos = getCollection(STORAGE_KEYS.PEDIDOS);
    const index = pedidos.findIndex(p => p.id === id);
    if (index === -1) return null;
    pedidos[index] = {
      ...pedidos[index],
      estado: nuevoEstado,
      ...extra
    };
    saveCollection(STORAGE_KEYS.PEDIDOS, pedidos);
    return pedidos[index];
  },

  pasarAPreparacion: (id) => {
    return pedidosService.updateEstado(id, 'en_preparacion', {
      horaPreparacion: getCurrentFormattedTime()
    });
  },

  marcarComoListo: (id) => {
    return pedidosService.updateEstado(id, 'listo', {
      horaListo: getCurrentFormattedTime(),
      minutosRestantes: 0
    });
  },

  volverARecibido: (id) => {
    return pedidosService.updateEstado(id, 'recibido', {
      horaPreparacion: null,
      horaListo: null
    });
  },

  volverAPreparacion: (id) => {
    return pedidosService.updateEstado(id, 'en_preparacion', {
      horaListo: null
    });
  },

  rechazar: (id, categoriaRechazo, motivoRechazo) => {
    return pedidosService.updateEstado(id, 'rechazado', {
      categoriaRechazo,
      motivoRechazo,
      vencido: false
    });
  },

  cancelar: (id, motivo) => {
    return pedidosService.updateEstado(id, 'cancelado', {
      motivoCancelacion: motivo,
      vencido: false
    });
  },

  marcarNoRecogido: (id) => {
    return pedidosService.updateEstado(id, 'no_recogido', {
      vencido: false
    });
  },

  entregar: (id, horaEntrega = null) => {
    const hora = horaEntrega || getCurrentFormattedTime();
    return pedidosService.updateEstado(id, 'entregado', {
      horaEntrega: hora,
      vencido: false,
      minutosRestantes: 0
    });
  }
};

/* ==================== VALORACIONES ==================== */
export const valoracionesService = {
  getAll: () => getCollection(STORAGE_KEYS.VALORACIONES),
  getByLocal: (localId) => getCollection(STORAGE_KEYS.VALORACIONES).filter(v => v.localId === localId),

  create: (nuevaValoracion) => {
    const vals = getCollection(STORAGE_KEYS.VALORACIONES);
    const id = `val-${Date.now()}`;
    const valoracion = {
      ...nuevaValoracion,
      id,
      fechaCalificacion: new Date().toISOString()
    };
    vals.unshift(valoracion);
    saveCollection(STORAGE_KEYS.VALORACIONES, vals);

    if (nuevaValoracion.pedidoId) {
      pedidosService.updateEstado(nuevaValoracion.pedidoId, 'entregado', { calificado: true });
    }
    return valoracion;
  }
};
