/* HU-4 · 4.4 Detalle con avance: línea de cuatro pasos, código destacado, ítems y acción de cancelar.
   Estado «listo» con énfasis en verde · rechazado (y cancelado) como pieza suelta. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, HelpCircle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { EmptyState, StatusBadge } from '../../common';
import { misPedidosService } from '../../../services/misPedidosService';
import Migas from '../../carrito/Migas/Migas';
import { soles } from '../../carrito/compartido/reglas';
import { CANCELAR_ANTES_MIN, TOLERANCIA_RECOJO_MIN, guardadoHasta, pasosAvance, ventanaCancelacion } from '../compartido/reglasPedido';
import { useAhora, usePedidosEnVivo } from '../compartido/usePedidosEnVivo';
import { useRepetirPedido } from '../compartido/useRepetirPedido';
import ModalCancelarPedido from '../ModalCancelarPedido/ModalCancelarPedido';
import '../../carrito/compartido/carrito.css';
import '../compartido/pedidos.css';
import './DetallePedido.css';

const AVISOS_ESTADO = {
  en_preparacion: ['Tu pedido está en preparación', 'El local empezó a preparar tu pedido.'],
  listo: ['Tu pedido está listo', 'Acércate al mostrador y dicta tu código.'],
  entregado: ['Pedido entregado', '¡Buen provecho!'],
  rechazado: ['El local rechazó tu pedido', 'Revisa el motivo en el detalle.'],
};

function ListaItems({ pedido }) {
  return (
    <ul className="hu4-items hu4-items--linea">
      {pedido.items.map((i) => {
        const extra = [...(i.opcionesSeleccionadas ?? []).map((o) => o.nombre), i.nota].filter(Boolean).join(', ');
        return (
          <li key={i.itemCarritoId}>
            <span>{i.cantidad} × {i.nombre}{extra && <em> · {extra}</em>}</span>
            <b>{soles(i.subtotal)}</b>
          </li>
        );
      })}
    </ul>
  );
}

function LineaAvance({ pedido }) {
  return (
    <ol className={`hu4-avance ${pedido.estado === 'listo' ? 'hu4-avance--listo' : ''}`} aria-label="Avance del pedido">
      {pasosAvance(pedido).map((p, i) => (
        <li key={p.clave} className={`hu4-paso hu4-paso--${p.estado} hu4-paso--${p.clave}`} aria-current={p.estado === 'actual' ? 'step' : undefined}>
          <span className="hu4-paso__punto" aria-hidden="true">{p.estado === 'hecho' ? <Check size={13} /> : i + 1}</span>
          <strong>{p.titulo}</strong>
          <small>
            {p.estado === 'pendiente'
              ? p.pendiente ?? ''
              : [p.hora, p.estado === 'actual' ? p.ayuda : null].filter(Boolean).join(' · ')}
          </small>
        </li>
      ))}
    </ol>
  );
}

// Pieza suelta: pedido rechazado con motivo, cancelado o no recogido.
function PedidoCerrado({ pedido, onRepetir }) {
  const titulo = { rechazado: 'Motivo del local', cancelado: 'Pedido cancelado', no_recogido: 'Pedido no recogido' }[pedido.estado];
  const motivo = pedido.estado === 'rechazado'
    ? pedido.motivoRechazo || 'El local no indicó un motivo.'
    : pedido.estado === 'cancelado'
      ? pedido.motivoCancelacion || 'Cancelaste este pedido.'
      : `El local marcó el pedido como no recogido después de la tolerancia de ${TOLERANCIA_RECOJO_MIN} minutos.`;

  return (
    <div className="hu3-panel hu4-cerrado">
      <div className="hu4-motivo">
        <small>{titulo}</small>
        <p>{motivo}</p>
      </div>
      <ListaItems pedido={pedido} />
      <p className="hu3-ayuda">No se realizó ningún cobro. El pago siempre ocurre en el punto de recojo.</p>
      <div className="hu4-acciones">
        <Link className="btn btn-primary hu3-crece" to="/locales">Pedir en otro local</Link>
        {pedido.estado === 'rechazado'
          ? <Link className="btn btn-tertiary hu3-crece" to={`/locales/${pedido.localId}`}>Repetir con otros productos</Link>
          : <button type="button" className="btn btn-tertiary hu3-crece" onClick={() => onRepetir(pedido)}>Repetir pedido</button>}
      </div>
    </div>
  );
}

export default function DetallePedido() {
  const { pedidoId } = useParams();
  const { currentUser } = useAuth();
  const pedidos = usePedidosEnVivo(); // el avance cambia cuando el local actualiza el estado
  const ahora = useAhora();
  const toast = useToast();
  const navigate = useNavigate();
  const { repetir, modal } = useRepetirPedido();
  const [cancelando, setCancelando] = useState(false);

  const pedido = useMemo(() => {
    try { return misPedidosService.obtener(pedidoId, currentUser?.id); } catch { return null; }
  }, [pedidoId, currentUser, pedidos]);

  // Aviso cuando el local cambia el estado mientras el comensal mira el detalle.
  const estadoPrevio = useRef(pedido?.estado);
  useEffect(() => {
    const anterior = estadoPrevio.current;
    estadoPrevio.current = pedido?.estado;
    if (!pedido || !anterior || anterior === pedido.estado || !AVISOS_ESTADO[pedido.estado]) return;
    const [titulo, texto] = AVISOS_ESTADO[pedido.estado];
    if (pedido.estado === 'rechazado') toast.error(titulo, texto);
    else toast.success(titulo, texto);
  }, [pedido, toast]);

  const cerrarModal = useCallback(() => setCancelando(false), []);

  if (!pedido) {
    return (
      <section className="pagina hu4">
        <EmptyState icon={HelpCircle} title="No encontramos ese pedido" description="Puede que el enlace esté mal escrito o que el pedido sea de otra cuenta."
          actionText="Ir a mis pedidos" onAction={() => navigate('/mis-pedidos')} />
      </section>
    );
  }

  const listo = pedido.estado === 'listo';
  const cerrado = ['rechazado', 'cancelado', 'no_recogido'].includes(pedido.estado);
  const ventana = ventanaCancelacion(pedido, ahora);
  const ubicacion = pedido.local?.ubicacionCampus;

  const cancelar = () => {
    try {
      misPedidosService.cancelar(pedido.id, currentUser.id);
      toast.success('Pedido cancelado', `Cancelaste ${pedido.codigoPedido}. ${pedido.nombreLocal} ya no lo preparará.`);
    } catch (e) {
      toast.error('No se pudo cancelar', e.message);
    }
    setCancelando(false);
  };

  return (
    <section className="pagina hu3 hu4">
      <Migas items={[{ label: 'Mis pedidos', to: '/mis-pedidos' }, { label: pedido.codigoPedido }]} />

      {listo && (
        <p className="hu4-banner hu4-banner--exito" role="status">
          <Check size={16} /> Tu pedido está listo. {pedido.nombreLocal} lo guarda hasta las {guardadoHasta(pedido)}.
        </p>
      )}

      <div className="hu3-cabecera hu4-detalle__cabecera">
        <div>
          <h1 className="hu3-titulo">Pedido {pedido.codigoPedido}</h1>
          <p className="hu3-subtitulo">
            {[pedido.nombreLocal, listo ? ubicacion : null, `recojo ${pedido.horaRecojo} del ${pedido.fechaPedido}`,
              !listo && pedido.horaRecibido ? `recibido a las ${pedido.horaRecibido}` : null].filter(Boolean).join(' · ')}
          </p>
        </div>
        <StatusBadge status={pedido.estado} type="pedido" solid={listo} />
      </div>

      {cerrado ? (
        <PedidoCerrado pedido={pedido} onRepetir={repetir} />
      ) : (
        <>
          <LineaAvance pedido={pedido} />

          <div className={`hu4-detalle ${listo ? 'hu4-detalle--listo' : ''}`}>
            <div className="hu4-detalle__lado">
              <div className={`hu4-codigo ${listo ? 'hu4-codigo--listo' : ''}`}>
                <small>Código de pedido</small>
                <strong>{pedido.codigoPedido}</strong>
                <span>{listo ? 'Dicta este código en el mostrador y paga al recibirlo' : 'Dicta el código en el mostrador'}</span>
              </div>
              {!listo && (
                <p className="hu4-tarjeta">
                  Recojo en {ubicacion ?? 'el mostrador del local'}. Tolerancia de {TOLERANCIA_RECOJO_MIN} minutos desde tu franja.
                </p>
              )}
            </div>

            <div className="hu3-panel">
              <h2 className="hu4-panel__titulo">Ítems del pedido</h2>
              <ListaItems pedido={pedido} />
              <div className="hu4-total">
                <span>Total a pagar en el mostrador</span>
                <strong>{soles(pedido.total)}</strong>
              </div>

              {pedido.estado === 'entregado' ? (
                <div className="hu4-acciones">
                  <p className="hu3-ayuda hu3-crece">Entregado{pedido.horaEntrega ? ` a las ${pedido.horaEntrega}` : ''}. ¡Buen provecho!</p>
                  <button type="button" className="btn btn-tertiary" onClick={() => repetir(pedido)}>Repetir</button>
                </div>
              ) : ventana.puede ? (
                <div className="hu4-acciones">
                  <button type="button" className="btn btn-secondary" onClick={() => setCancelando(true)}>Cancelar pedido</button>
                  <p className="hu3-ayuda hu3-crece hu4-sin-margen">
                    Puedes cancelar hasta {CANCELAR_ANTES_MIN} minutos antes de tu franja. Faltan {ventana.faltan} minutos.
                  </p>
                </div>
              ) : (
                <p className="hu3-aviso hu3-aviso--advertencia hu4-sin-margen">
                  {ventana.motivo === 'listo'
                    ? 'Ya no puedes cancelar: el pedido está preparado y esperando en el mostrador.'
                    : ventana.faltan < 0
                      ? 'Ya no puedes cancelar: tu franja de recojo ya empezó.'
                      : `Ya no puedes cancelar: faltan menos de ${CANCELAR_ANTES_MIN} minutos para tu franja.`}
                </p>
              )}
            </div>
          </div>
        </>
      )}

      <ModalCancelarPedido pedido={cancelando && ventana.puede ? pedido : null} faltan={ventana.faltan} onMantener={cerrarModal} onCancelar={cancelar} />
      {modal}
    </section>
  );
}
