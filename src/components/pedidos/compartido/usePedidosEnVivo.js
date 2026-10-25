/* HU-4 · Mantiene al día los pedidos cuando el local los cambia (otra pestaña o la bandeja de HU-5)
   y da una hora «ahora» que avanza sola para los minutos que faltan. */
import { useEffect, useRef, useState } from 'react';
import { useData } from '../../../context/DataContext';

export function useAhora(cadaMs = 30000) {
  const [ahora, setAhora] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setAhora(new Date()), cadaMs);
    return () => clearInterval(t);
  }, [cadaMs]);
  return ahora;
}

export function usePedidosEnVivo(cadaMs = 15000) {
  const { pedidos, refreshAll } = useData();
  const refrescar = useRef(refreshAll);
  refrescar.current = refreshAll;

  useEffect(() => {
    const actualizar = () => refrescar.current();
    // «storage» llega cuando otra pestaña (p. ej. el local) escribe en localStorage.
    const alCambiar = (e) => { if (!e.key || e.key.startsWith('pw_cafeterias')) actualizar(); };
    window.addEventListener('storage', alCambiar);
    window.addEventListener('focus', actualizar);
    const t = setInterval(actualizar, cadaMs);
    return () => {
      window.removeEventListener('storage', alCambiar);
      window.removeEventListener('focus', actualizar);
      clearInterval(t);
    };
  }, [cadaMs]);

  return pedidos;
}
