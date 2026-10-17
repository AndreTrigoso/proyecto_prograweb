import React, { createContext, useContext, useState, useEffect } from 'react';
import { localesService, productosService } from '../services/storageService';

const CartContext = createContext();

const CART_STORAGE_KEY = 'pw_cafeterias_cart';

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [localId, setLocalId] = useState(() => {
    try {
      const saved = localStorage.getItem('pw_cafeterias_cart_local');
      return saved || null;
    } catch {
      return null;
    }
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [conflictModal, setConflictModal] = useState({ isOpen: false, pendingItem: null });

  // Guardar en storage cada vez que cambia
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    if (items.length === 0) {
      setLocalId(null);
      localStorage.removeItem('pw_cafeterias_cart_local');
    } else if (localId) {
      localStorage.setItem('pw_cafeterias_cart_local', localId);
    }
  }, [items, localId]);

  const activeLocal = localId ? localesService.getById(localId) : null;

  // Agregar ítem validando que sea del mismo local
  const addItem = (producto, cantidad = 1, opcionesSeleccionadas = [], nota = '') => {
    if (items.length > 0 && localId && localId !== producto.localId) {
      // Conflicto de local distinto
      setConflictModal({
        isOpen: true,
        pendingItem: { producto, cantidad, opcionesSeleccionadas, nota }
      });
      return false;
    }

    const extraTotal = opcionesSeleccionadas.reduce((sum, opt) => sum + (opt.precioAdicional || 0), 0);
    const precioBase = producto.precio;
    const precioUnitario = precioBase + extraTotal;
    const subtotal = precioUnitario * cantidad;

    const newItem = {
      itemCarritoId: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      productoId: producto.id,
      nombre: producto.nombre,
      fotografia: producto.fotografia,
      localId: producto.localId,
      precioBase,
      precioUnitario,
      cantidad,
      opcionesSeleccionadas,
      nota,
      subtotal
    };

    setItems(prev => [...prev, newItem]);
    setLocalId(producto.localId);
    setIsDrawerOpen(true);
    return true;
  };

  const resolveConflictReplace = () => {
    if (conflictModal.pendingItem) {
      const { producto, cantidad, opcionesSeleccionadas, nota } = conflictModal.pendingItem;
      const extraTotal = opcionesSeleccionadas.reduce((sum, opt) => sum + (opt.precioAdicional || 0), 0);
      const precioUnitario = producto.precio + extraTotal;
      const newItem = {
        itemCarritoId: `item-${Date.now()}`,
        productoId: producto.id,
        nombre: producto.nombre,
        fotografia: producto.fotografia,
        localId: producto.localId,
        precioBase: producto.precio,
        precioUnitario,
        cantidad,
        opcionesSeleccionadas,
        nota,
        subtotal: precioUnitario * cantidad
      };
      setItems([newItem]);
      setLocalId(producto.localId);
      setConflictModal({ isOpen: false, pendingItem: null });
      setIsDrawerOpen(true);
    }
  };

  const cancelConflict = () => {
    setConflictModal({ isOpen: false, pendingItem: null });
  };

  const updateQuantity = (itemCarritoId, newQty) => {
    if (newQty <= 0) {
      removeItem(itemCarritoId);
      return;
    }
    setItems(prev => prev.map(item => {
      if (item.itemCarritoId === itemCarritoId) {
        return {
          ...item,
          cantidad: newQty,
          subtotal: item.precioUnitario * newQty
        };
      }
      return item;
    }));
  };

  const updateItemNote = (itemCarritoId, nota) => {
    setItems(prev => prev.map(item => item.itemCarritoId === itemCarritoId ? { ...item, nota } : item));
  };

  const removeItem = (itemCarritoId) => {
    setItems(prev => prev.filter(item => item.itemCarritoId !== itemCarritoId));
  };

  const clearCart = () => {
    setItems([]);
    setLocalId(null);
  };

  // Validar si algún producto del carrito fue agotado
  const checkCartAvailability = () => {
    const unavailableItems = [];
    items.forEach(item => {
      const prod = productosService.getById(item.productoId);
      if (!prod || prod.disponibilidad !== 'disponible') {
        unavailableItems.push(item);
      }
    });
    return unavailableItems;
  };

  const totalItemsCount = items.reduce((sum, item) => sum + item.cantidad, 0);
  const subtotalTotal = items.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <CartContext.Provider value={{
      items,
      localId,
      activeLocal,
      totalItemsCount,
      subtotalTotal,
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
      checkCartAvailability
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
