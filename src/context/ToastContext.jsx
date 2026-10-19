import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { NotificationToast } from '../components/common';

const ToastContext = createContext(null);

/**
 * Notificaciones flotantes para cualquier pantalla ("toda operación de escritura notifica su resultado").
 * Reutiliza el NotificationToast común; uso: const toast = useToast(); toast.success('Título', 'Mensaje');
 */
export function ToastProvider({ children }) {
  const [notificacion, setNotificacion] = useState(null);
  const temporizador = useRef(null);

  const cerrar = useCallback(() => {
    clearTimeout(temporizador.current);
    setNotificacion(null);
  }, []);

  const notify = useCallback((datos) => {
    clearTimeout(temporizador.current);
    setNotificacion(datos);
    temporizador.current = setTimeout(() => setNotificacion(null), 4500);
  }, []);

  const api = useMemo(
    () => ({
      notify,
      success: (title, message) => notify({ type: 'success', title, message }),
      error: (title, message) => notify({ type: 'error', title, message }),
      info: (title, message) => notify({ type: 'info', title, message })
    }),
    [notify]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <NotificationToast notification={notificacion} onClose={cerrar} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe ser usado dentro de un ToastProvider');
  }
  return context;
}
