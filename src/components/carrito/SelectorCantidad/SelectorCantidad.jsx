/* HU-3 · Selector de cantidad (detalle del producto y líneas del carrito). */
import { Minus, Plus } from 'lucide-react';
import { MAX_CANTIDAD } from '../compartido/reglas';
import './SelectorCantidad.css';

export default function SelectorCantidad({ valor, onCambiar, chico = false, etiqueta = 'Cantidad' }) {
  return (
    <div className={`hu3-cantidad ${chico ? 'hu3-cantidad--chica' : ''}`} role="group" aria-label={etiqueta}>
      <button type="button" aria-label="Quitar uno" disabled={valor <= 1} onClick={() => onCambiar(valor - 1)}><Minus size={chico ? 14 : 16} /></button>
      <span aria-live="polite">{valor}</span>
      <button type="button" aria-label="Agregar uno" disabled={valor >= MAX_CANTIDAD} onClick={() => onCambiar(valor + 1)}><Plus size={chico ? 14 : 16} /></button>
    </div>
  );
}
