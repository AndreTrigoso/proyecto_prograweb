/* HU-3 · Revisa el carrito contra la carta: al abrir la vista, cada 15 s, al volver a la pestaña
   y cuando cambian los datos (en esta pestaña o en otra). Avisa si un producto se agota antes de confirmar. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useCart } from '../../../context/CartContext';
import { useToast } from '../../../context/ToastContext';
import { catalogoService } from '../../../services/catalogoService';

const INTERVALO_MS = 15000;

export function useVerificacionCarrito() {
  const { items, localId, sincronizarItems } = useCart();
  const toast = useToast();
  const [resultado, setResultado] = useState(null);
  const previos = useRef({});
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // Solo se vuelve a verificar si cambian los productos u opciones (no la cantidad ni la nota).
  const firma = items.map((i) => `${i.itemCarritoId}:${i.productoId}`).join('|');

  const verificar = useCallback(() => {
    if (!localId) return setResultado(null);
    const r = catalogoService.verificarCarrito(localId, itemsRef.current);
    for (const it of r.items) {
      if (previos.current[it.itemCarritoId] === null && it.problema)
        toast.error(`«${it.nombre}» ya no está disponible`, `${it.mensaje} Quítalo o reemplázalo para continuar.`);
      previos.current[it.itemCarritoId] = it.problema;
    }
    sincronizarItems(r.items);
    setResultado(r);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firma, localId]);

  useEffect(() => {
    verificar();
    const t = setInterval(verificar, INTERVALO_MS);
    const alCambiar = () => verificar();
    window.addEventListener('focus', alCambiar);
    window.addEventListener('storage', alCambiar);           // cambios hechos en otra pestaña
    window.addEventListener('pw_storage_updated', alCambiar); // cambios hechos en esta pestaña
    return () => {
      clearInterval(t);
      window.removeEventListener('focus', alCambiar);
      window.removeEventListener('storage', alCambiar);
      window.removeEventListener('pw_storage_updated', alCambiar);
    };
  }, [verificar]);

  const porItem = Object.fromEntries((resultado?.items ?? []).map((i) => [i.itemCarritoId, i]));
  const problemas = (resultado?.items ?? []).filter((i) => i.problema && items.some((x) => x.itemCarritoId === i.itemCarritoId));
  const local = resultado?.local ?? null;

  return {
    verificado: !!resultado,
    porItem,
    problemas,
    local,
    localRecibe: !!local?.recibePedidos,
    verificar,
  };
}
