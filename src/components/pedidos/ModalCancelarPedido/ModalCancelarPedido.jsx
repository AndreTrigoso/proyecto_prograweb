/* HU-4 · 4.5 Modal de cancelación: confirmación destructiva con la ventana permitida. */
import { useEffect, useRef } from 'react';
import { soles } from '../../carrito/compartido/reglas';
import { CANCELAR_ANTES_MIN } from '../compartido/reglasPedido';
import '../compartido/pedidos.css';
import './ModalCancelarPedido.css';

export default function ModalCancelarPedido({ pedido, faltan, onMantener, onCancelar }) {
  const mantenerRef = useRef(null);

  useEffect(() => {
    if (!pedido) return undefined;
    mantenerRef.current?.focus(); // la acción segura queda enfocada
    const alTeclear = (e) => { if (e.key === 'Escape') onMantener(); };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [pedido, onMantener]);

  if (!pedido) return null;
  const lineas = pedido.items.length; // «3 ítems» como en el mockup 4.5

  return (
    <div className="modal-overlay" onClick={onMantener}>
      <div className="modal-content hu4-modal" role="alertdialog" aria-modal="true" aria-labelledby="hu4-cancelar-titulo"
        aria-describedby="hu4-cancelar-texto" onClick={(e) => e.stopPropagation()}>
        <div className="hu4-modal__cabecera">
          <span className="hu4-modal__icono" aria-hidden="true">!</span>
          <div>
            <h2 id="hu4-cancelar-titulo">¿Cancelar el pedido {pedido.codigoPedido}?</h2>
            <p id="hu4-cancelar-texto">{pedido.nombreLocal} ya podría haber iniciado la preparación. Esta acción no se puede deshacer.</p>
          </div>
        </div>
        <p className="hu3-aviso hu3-aviso--advertencia">
          Puedes cancelar hasta {CANCELAR_ANTES_MIN} minutos antes de tu franja. Faltan {faltan} minutos para las {pedido.horaRecojo}.
        </p>
        <div className="hu4-modal__resumen">
          <span>{lineas} {lineas === 1 ? 'ítem' : 'ítems'} · recojo {pedido.horaRecojo} del {pedido.fechaPedido}</span>
          <b>{soles(pedido.total)}</b>
        </div>
        <div className="hu4-modal__acciones">
          <button ref={mantenerRef} type="button" className="btn btn-tertiary" onClick={onMantener}>Mantener pedido</button>
          <button type="button" className="btn btn-danger" onClick={onCancelar}>Sí, cancelar</button>
        </div>
      </div>
    </div>
  );
}
