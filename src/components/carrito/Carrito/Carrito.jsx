/* HU-3 · 3.4 Carrito (y carrito vacío) · 3.5 aviso de producto agotado al continuar. */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Info, ShoppingBag } from 'lucide-react';
import { useCart } from '../../../context/CartContext';
import { useToast } from '../../../context/ToastContext';
import { ConfirmModal, StatusBadge } from '../../common';
import { useVerificacionCarrito } from '../compartido/useVerificacionCarrito';
import ModalProductoAgotado from '../ModalProductoAgotado/ModalProductoAgotado';
import SelectorCantidad from '../SelectorCantidad/SelectorCantidad';
import Migas from '../Migas/Migas';
import { MAX_NOTA, soles } from '../compartido/reglas';
import '../compartido/carrito.css';
import './Carrito.css';

function LineaCarrito({ item, problema, onQuitar }) {
  const { updateQuantity, updateItemNote } = useCart();
  const [editando, setEditando] = useState(false);
  const [nota, setNota] = useState(item.nota ?? '');
  const larga = nota.length > MAX_NOTA;

  const guardarNota = () => {
    if (larga) return;
    updateItemNote(item.itemCarritoId, nota.trim());
    setEditando(false);
  };

  return (
    <li className={`hu3-linea ${problema ? 'hu3-linea--problema' : ''}`}>
      {item.fotografia ? <img className="hu3-linea__foto" src={item.fotografia} alt="" /> : <span className="hu3-linea__foto" />}
      <div className="hu3-linea__info">
        <h3>
          {item.nombre}{' '}
          {problema && <StatusBadge status={problema.problema === 'agotado' ? 'agotado_dia' : 'retirado'} type="producto" size="sm" />}
        </h3>
        {item.opcionesSeleccionadas?.length > 0 && <p>{item.opcionesSeleccionadas.map((o) => o.nombre).join(' · ')}</p>}
        {!editando ? (
          <p>
            {item.nota && <em>Nota: {item.nota} · </em>}
            <button type="button" className="hu3-enlace" onClick={() => setEditando(true)}>{item.nota ? 'Editar nota' : 'Agregar nota'}</button>
          </p>
        ) : (
          <div className="hu3-linea__nota">
            <input className={`form-input ${larga ? 'is-invalid' : ''}`} aria-label={`Nota para ${item.nombre}`} autoFocus value={nota}
              placeholder="Ej.: sin azúcar" onChange={(e) => setNota(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && guardarNota()} />
            <button type="button" className="btn btn-tertiary btn-sm" disabled={larga} onClick={guardarNota}>Guardar</button>
          </div>
        )}
        {larga && <span className="form-error">Máximo {MAX_NOTA} caracteres.</span>}
        {problema && <p className="hu3-linea__alerta" role="alert">{problema.mensaje} Quítalo o reemplázalo para continuar.</p>}
      </div>
      <SelectorCantidad chico valor={item.cantidad} onCambiar={(n) => updateQuantity(item.itemCarritoId, n)} etiqueta={`Cantidad de ${item.nombre}`} />
      <span className="hu3-precio">{soles(item.subtotal)}</span>
      <button type="button" className="hu3-enlace hu3-enlace--rojo" onClick={() => onQuitar(item)}>Quitar</button>
    </li>
  );
}

function CarritoVacio() {
  const navigate = useNavigate();
  return (
    <section className="pagina hu3">
      <div className="hu3-vacio">
        <div className="hu3-vacio__icono hu3-vacio__icono--rojo"><ShoppingBag size={26} /></div>
        <h2>Tu carrito está vacío</h2>
        <p>Elige un local abierto y agrega tu primer producto para pedir con anticipación y recogerlo sin hacer cola.</p>
        <button type="button" className="btn btn-primary" onClick={() => navigate('/locales')}>Ver locales abiertos</button>
      </div>
    </section>
  );
}

export default function Carrito() {
  const { items, activeLocal, totalItemsCount, totalBase, subtotalTotal, removeItem, clearCart } = useCart();
  const { porItem, problemas, local, localRecibe, verificado } = useVerificacionCarrito();
  const toast = useToast();
  const navigate = useNavigate();
  const [porQuitar, setPorQuitar] = useState(null);
  const [vaciando, setVaciando] = useState(false);
  const [modal, setModal] = useState(null); // problema del ítem que se muestra en 3.5

  if (!items.length) return <CarritoVacio />;
  const nombreLocal = activeLocal?.nombreComercial ?? 'el local';
  const extras = Math.round((subtotalTotal - totalBase) * 100) / 100;

  // Al continuar, cada ítem que dejó de estar disponible se resuelve en el modal 3.5 antes de elegir la hora (HU-4).
  const continuar = (resueltos = [], { quitado = false } = {}) => {
    if (quitado && items.length <= 1) return setModal(null); // el carrito quedó vacío
    const pendientes = problemas.filter((p) => !resueltos.includes(p.itemCarritoId));
    if (pendientes.length) return setModal(pendientes[0]);
    setModal(null);
    navigate('/pedido/confirmar');
  };

  return (
    <section className="pagina hu3">
      <Migas items={[{ label: nombreLocal, to: `/locales/${activeLocal?.id}` }, { label: 'Tu carrito' }]} />
      <div className="hu3-carrito">
        <div className="hu3-panel">
          <h1 className="hu3-titulo">Tu carrito</h1>
          <p className="hu3-subtitulo">{items.length} {items.length === 1 ? 'ítem' : 'ítems'} de {nombreLocal}</p>

          <p className="hu3-aviso hu3-aviso--info"><Info size={15} /> Todos los ítems deben ser del mismo local. Para pedir en otro local, confirma o vacía este carrito.</p>
          {verificado && !localRecibe && (
            <p className="hu3-aviso hu3-aviso--error">
              {local ? `${local.nombreComercial} no está recibiendo pedidos (${local.textoHorario}).` : 'El local ya no existe.'} Guardamos tu carrito para cuando abra.
            </p>
          )}

          <ul className="hu3-lineas">
            {items.map((i) => (
              <LineaCarrito key={i.itemCarritoId} item={i} problema={porItem[i.itemCarritoId]?.problema ? porItem[i.itemCarritoId] : null} onQuitar={setPorQuitar} />
            ))}
          </ul>
          <div className="hu3-controles">
            <Link className="btn btn-tertiary" to={`/locales/${activeLocal?.id}`}>Seguir agregando</Link>
            <button type="button" className="hu3-enlace hu3-enlace--rojo" onClick={() => setVaciando(true)}>Vaciar carrito</button>
          </div>
        </div>

        <aside className="hu3-panel hu3-resumen">
          <h2>Resumen</h2>
          <dl>
            <div><dt>Productos ({totalItemsCount})</dt><dd>{soles(totalBase)}</dd></div>
            {extras > 0 && <div><dt>Opciones y agregados</dt><dd>{soles(extras)}</dd></div>}
            <div className="hu3-resumen__total"><dt>Subtotal</dt><dd>{soles(subtotalTotal)}</dd></div>
          </dl>
          <p className="hu3-ayuda">El pago se realiza en el punto de recojo. En el siguiente paso eliges la hora.</p>
          <button type="button" className="btn btn-primary hu3-bloque" disabled={!verificado || !localRecibe} onClick={() => continuar()}>
            {verificado ? 'Elegir hora de recojo' : 'Verificando…'}
          </button>
        </aside>
      </div>

      <ModalProductoAgotado
        item={modal && items.find((i) => i.itemCarritoId === modal.itemCarritoId)}
        problema={modal}
        local={local}
        onCerrar={() => setModal(null)}
        onResuelto={(id, opciones) => continuar([id], opciones)}
      />
      <ConfirmModal isOpen={!!porQuitar} title="Quitar producto" isDestructive confirmText="Quitar"
        message={`¿Quitar «${porQuitar?.nombre}» del carrito?`}
        onConfirm={() => { removeItem(porQuitar.itemCarritoId); toast.success('Producto quitado', `Quitaste «${porQuitar.nombre}» del carrito.`); setPorQuitar(null); }}
        onCancel={() => setPorQuitar(null)} />
      <ConfirmModal isOpen={vaciando} title="Vaciar carrito" isDestructive confirmText="Vaciar"
        message="Se quitarán todos los productos del carrito. Esta acción no se puede deshacer."
        onConfirm={() => { clearCart(); toast.success('Carrito vacío', 'Quitaste todos los productos.'); setVaciando(false); }}
        onCancel={() => setVaciando(false)} />
    </section>
  );
}
