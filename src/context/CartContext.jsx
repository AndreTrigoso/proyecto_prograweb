/* HU-3 · Estado del carrito (contrato 2.4: Carrito / CarritoItem).
   Se conserva la misma API que ya usan Header, CartDrawer y CartSummary (addItem, updateQuantity, removeItem…).
   Mejoras de HU-3: carrito por usuario, fusión de ítems iguales, límites de cantidad y nota,
   y sincronización de precios con la carta vigente. */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { localesService, productosService } from '../services/storageService';
import { useAuth } from './AuthContext';
import { MAX_CANTIDAD, MAX_NOTA, precioUnitario } from '../components/carrito/compartido/reglas';

const CartContext = createContext();

const PREFIJO = 'pw_cafeterias_cart';
const VACIO = { items: [], localId: null };

const claveDe = (usuario) => (usuario?.rol === 'comensal' ? `${PREFIJO}_${usuario.id}` : null);
const nuevoId = () => `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

// Dos ítems se fusionan solo si son el mismo producto, con las mismas opciones y la misma nota.
const firma = (productoId, opciones, nota) =>
  [productoId, ...opciones.map((o) => o.opcionId ?? o.nombre).sort(), (nota ?? '').trim().toLowerCase()].join('|');

function leer(clave) {
  if (!clave) return VACIO;
  try {
    return JSON.parse(localStorage.getItem(clave)) ?? VACIO;
  } catch {
    return VACIO;
  }
}

function construirItem(producto, cantidad, opcionesSeleccionadas, nota) {
  const unitario = precioUnitario(producto.precio, opcionesSeleccionadas);
  const n = Math.min(MAX_CANTIDAD, Math.max(1, cantidad));
  return {
    itemCarritoId: nuevoId(),
    productoId: producto.id,
    nombre: producto.nombre,
    fotografia: producto.fotografia,
    localId: producto.localId,
    tiempoPreparacionMin: producto.tiempoPreparacionMin,
    precioBase: producto.precio,
    precioUnitario: unitario,
    cantidad: n,
    opcionesSeleccionadas,
    nota: (nota ?? '').trim().slice(0, MAX_NOTA),
    subtotal: unitario * n,
  };
}

export function CartProvider({ children }) {
  const { currentUser } = useAuth();
  const clave = claveDe(currentUser);
  const [estado, setEstado] = useState(() => ({ clave, ...leer(clave) }));

  // Al cambiar de usuario se carga su propio carrito (estado derivado durante el render).
  if (estado.clave !== clave) setEstado({ clave, ...leer(clave) });

  useEffect(() => {
    if (!estado.clave) return;
    localStorage.setItem(estado.clave, JSON.stringify({ items: estado.items, localId: estado.items.length ? estado.localId : null }));
  }, [estado]);

  const { items } = estado;
  const localId = items.length ? estado.localId : null;

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [conflictModal, setConflictModal] = useState({ isOpen: false, pendingItem: null });

  const setItems = useCallback((fn) => {
    setEstado((e) => ({ ...e, items: typeof fn === 'function' ? fn(e.items) : fn }));
  }, []);

  const agregar = useCallback((producto, cantidad, opcionesSeleccionadas, nota, { reemplazar = false } = {}) => {
    setEstado((e) => {
      const base = reemplazar || e.localId !== producto.localId ? [] : e.items;
      const f = firma(producto.id, opcionesSeleccionadas, nota);
      const igual = base.find((i) => firma(i.productoId, i.opcionesSeleccionadas, i.nota) === f);
      const items = igual
        ? base.map((i) => {
          if (i !== igual) return i;
          const n = Math.min(MAX_CANTIDAD, i.cantidad + cantidad);
          return { ...i, cantidad: n, subtotal: i.precioUnitario * n };
        })
        : [...base, construirItem(producto, cantidad, opcionesSeleccionadas, nota)];
      return { ...e, items, localId: producto.localId };
    });
  }, []);

  // Agregar ítem validando que sea del mismo local (si no, se abre el aviso de conflicto del CartDrawer).
  const addItem = (producto, cantidad = 1, opcionesSeleccionadas = [], nota = '', { abrirCarrito = true } = {}) => {
    if (items.length > 0 && localId && localId !== producto.localId) {
      setConflictModal({ isOpen: true, pendingItem: { producto, cantidad, opcionesSeleccionadas, nota, abrirCarrito } });
      return false;
    }
    agregar(producto, cantidad, opcionesSeleccionadas, nota);
    if (abrirCarrito) setIsDrawerOpen(true);
    return true;
  };

  const resolveConflictReplace = () => {
    const p = conflictModal.pendingItem;
    if (p) {
      agregar(p.producto, p.cantidad, p.opcionesSeleccionadas, p.nota, { reemplazar: true });
      if (p.abrirCarrito !== false) setIsDrawerOpen(true);
    }
    setConflictModal({ isOpen: false, pendingItem: null });
  };

  const cancelConflict = () => setConflictModal({ isOpen: false, pendingItem: null });

  const removeItem = useCallback((itemCarritoId) => {
    setItems((prev) => prev.filter((item) => item.itemCarritoId !== itemCarritoId));
  }, [setItems]);

  const updateQuantity = (itemCarritoId, newQty) => {
    if (newQty <= 0) return removeItem(itemCarritoId);
    const n = Math.min(MAX_CANTIDAD, newQty);
    setItems((prev) => prev.map((item) =>
      item.itemCarritoId === itemCarritoId ? { ...item, cantidad: n, subtotal: item.precioUnitario * n } : item));
  };

  const updateItemNote = (itemCarritoId, nota) => {
    setItems((prev) => prev.map((item) => (item.itemCarritoId === itemCarritoId ? { ...item, nota: String(nota).slice(0, MAX_NOTA) } : item)));
  };

  const clearCart = () => setEstado((e) => ({ ...e, items: [], localId: null }));

  // Aplica los precios, nombres y fotos vigentes que devuelve catalogoService.verificarCarrito.
  const sincronizarItems = useCallback((vigentes) => {
    setItems((prev) => {
      let cambio = false;
      const nuevos = prev.map((item) => {
        const v = vigentes.find((x) => x.itemCarritoId === item.itemCarritoId && !x.problema);
        if (!v) return item;
        const unitario = precioUnitario(v.precioBase, v.opcionesSeleccionadas);
        if (unitario === item.precioUnitario && v.nombre === item.nombre && v.fotografia === item.fotografia) return item;
        cambio = true;
        return { ...item, nombre: v.nombre, fotografia: v.fotografia, precioBase: v.precioBase, opcionesSeleccionadas: v.opcionesSeleccionadas, precioUnitario: unitario, subtotal: unitario * item.cantidad };
      });
      return cambio ? nuevos : prev;
    });
  }, [setItems]);

  // Productos del carrito que ya no están disponibles (lo usa CartSummary).
  const checkCartAvailability = () =>
    items.filter((item) => {
      const prod = productosService.getById(item.productoId);
      return !prod || prod.disponibilidad !== 'disponible';
    });

  const activeLocal = localId ? localesService.getById(localId) : null;
  const totals = useMemo(() => ({
    totalItemsCount: items.reduce((sum, item) => sum + item.cantidad, 0),
    subtotalTotal: Math.round(items.reduce((sum, item) => sum + item.subtotal, 0) * 100) / 100,
    totalBase: Math.round(items.reduce((sum, item) => sum + item.precioBase * item.cantidad, 0) * 100) / 100,
  }), [items]);

  return (
    <CartContext.Provider value={{
      items,
      localId,
      activeLocal,
      ...totals,
      isDrawerOpen,
      setIsDrawerOpen,
      conflictModal,
      addItem,
      updateQuantity,
      updateItemNote,
      removeItem,
      clearCart,
      resolveConflictReplace,
      cancelConflict,
      checkCartAvailability,
      sincronizarItems,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return context;
}
