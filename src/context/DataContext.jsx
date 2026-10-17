import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  localesService,
  productosService,
  pedidosService,
  valoracionesService,
  usuariosService,
  initializeStorage
} from '../services/storageService';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [locales, setLocales] = useState(() => localesService.getAll());
  const [productos, setProductos] = useState(() => productosService.getAll());
  const [pedidos, setPedidos] = useState(() => pedidosService.getAll());
  const [valoraciones, setValoraciones] = useState(() => valoracionesService.getAll());
  const [usuarios, setUsuarios] = useState(() => usuariosService.getAll());

  const refreshAll = () => {
    setLocales(localesService.getAll());
    setProductos(productosService.getAll());
    setPedidos(pedidosService.getAll());
    setValoraciones(valoracionesService.getAll());
    setUsuarios(usuariosService.getAll());
  };

  useEffect(() => {
    const handleStorageUpdate = () => {
      refreshAll();
    };
    window.addEventListener('pw_storage_updated', handleStorageUpdate);
    return () => window.removeEventListener('pw_storage_updated', handleStorageUpdate);
  }, []);

  const resetToSeeds = () => {
    initializeStorage(true);
    refreshAll();
  };

  return (
    <DataContext.Provider value={{
      locales,
      productos,
      pedidos,
      valoraciones,
      usuarios,
      refreshAll,
      resetToSeeds
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData debe ser usado dentro de un DataProvider');
  }
  return context;
}
