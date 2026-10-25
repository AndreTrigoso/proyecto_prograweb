/* HU-3 · 3.5 Aviso de producto agotado.
   Modal que aparece al continuar cuando un ítem del carrito dejó de estar disponible:
   permite quitarlo o reemplazarlo por un producto parecido del mismo local. */
import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useCart } from '../../../context/CartContext';
import { useToast } from '../../../context/ToastContext';
import { catalogoService } from '../../../services/catalogoService';
import { StatusBadge } from '../../common';
import { useAgregarAlCarrito } from '../compartido/useAgregarAlCarrito';
import { soles } from '../compartido/reglas';
import '../compartido/carrito.css';
import './ModalProductoAgotado.css';

export default function ModalProductoAgotado({ item, problema, local, onCerrar, onResuelto }) {
  const { removeItem } = useCart();
  const toast = useToast();
  const { agregarProducto } = useAgregarAlCarrito();
  const [similares, setSimilares] = useState([]);
  const [elegido, setElegido] = useState(null);

  useEffect(() => {
    setElegido(null);
    setSimilares(item ? catalogoService.productosSimilares(item.productoId) : []);
  }, [item]);

  if (!item) return null;
  const agotado = problema?.problema === 'agotado';
  const titulo = agotado ? 'Un producto de tu carrito se agotó' : 'Un producto de tu carrito ya no está disponible';

  const quitar = () => {
    removeItem(item.itemCarritoId);
    toast.success('Producto quitado', `Quitaste «${item.nombre}» del carrito.`);
    onResuelto(item.itemCarritoId, { quitado: true });
  };

  const reemplazar = () => {
    removeItem(item.itemCarritoId);
    const ok = agregarProducto(elegido, local, { cantidad: item.cantidad, abrirCarrito: false });
    if (ok) onResuelto(item.itemCarritoId, { quitado: false });
    else onCerrar(); // p. ej. el reemplazo tiene opciones obligatorias: se abre su detalle
  };

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-content hu3-modal" role="dialog" aria-modal="true" aria-labelledby="hu3-modal-titulo" onClick={(e) => e.stopPropagation()}>
        <div className="hu3-modal__cabecera">
          <span className="hu3-modal__icono"><AlertTriangle size={20} /></span>
          <div>
            <h2 id="hu3-modal-titulo">{titulo}</h2>
            <p>
              {agotado ? `${local?.nombreComercial ?? 'El local'} marcó «${item.nombre}» como agotado.` : `«${item.nombre}»: ${problema?.mensaje}`}{' '}
              Quítalo o reemplázalo para continuar con tu pedido.
            </p>
          </div>
        </div>

        <div className="hu3-modal__item">
          {item.fotografia ? <img src={item.fotografia} alt="" /> : <span className="hu3-modal__miniatura" />}
          <div className="hu3-crece">
            <strong>{item.nombre}</strong>
            <small>{item.cantidad} {item.cantidad === 1 ? 'unidad' : 'unidades'} · {soles(item.subtotal)}</small>
          </div>
          <StatusBadge status={agotado ? 'agotado_dia' : 'retirado'} type="producto" size="sm" />
        </div>

        {similares.length > 0 && (
          <>
            <p className="form-label">Reemplazar por</p>
            <div className="hu3-reemplazos" role="radiogroup" aria-label="Reemplazar por">
              {similares.map((p) => (
                <button type="button" key={p.id} role="radio" aria-checked={elegido?.id === p.id}
                  className={`hu3-reemplazo ${elegido?.id === p.id ? 'hu3-reemplazo--activo' : ''}`} onClick={() => setElegido(p)}>
                  {p.fotografia ? <img src={p.fotografia} alt="" /> : <span className="hu3-modal__miniatura" />}
                  <span><b>{p.nombre}</b><em>{soles(p.precio)}</em></span>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="hu3-modal__acciones">
          <button type="button" className="btn btn-tertiary" onClick={quitar}>Quitar del carrito</button>
          {similares.length > 0 && (
            <button type="button" className="btn btn-primary" disabled={!elegido} onClick={reemplazar}>Reemplazar y continuar</button>
          )}
        </div>
      </div>
    </div>
  );
}
