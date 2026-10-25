/* HU-4 · 4.2 Pedido confirmado: código en tamaño grande, hora de recojo, ubicación y recordatorio de pago. */
import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, HelpCircle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { EmptyState } from '../../common';
import { misPedidosService } from '../../../services/misPedidosService';
import { soles } from '../../carrito/compartido/reglas';
import '../../carrito/compartido/carrito.css';
import '../compartido/pedidos.css';
import './PedidoConfirmado.css';

export default function PedidoConfirmado() {
  const { pedidoId } = useParams();
  const { currentUser } = useAuth();
  const { pedidos } = useData();
  const navigate = useNavigate();

  const pedido = useMemo(() => {
    try { return misPedidosService.obtener(pedidoId, currentUser?.id); } catch { return null; }
  }, [pedidoId, currentUser, pedidos]);

  if (!pedido) {
    return (
      <section className="pagina hu4">
        <EmptyState icon={HelpCircle} title="No encontramos ese pedido" description="Revisa tus pedidos para ver su avance y su código de recojo."
          actionText="Ir a mis pedidos" onAction={() => navigate('/mis-pedidos')} />
      </section>
    );
  }

  return (
    <section className="pagina hu4 hu4-confirmado">
      <p className="hu4-banner hu4-banner--exito" role="status">
        <Check size={16} /> Pedido confirmado. {pedido.nombreLocal} ya lo recibió en su bandeja del día.
      </p>

      <div className="hu4-confirmado__cabecera">
        <span className="hu4-confirmado__check" aria-hidden="true"><Check size={26} /></span>
        <h1>Pedido confirmado</h1>
        <p>Dicta este código en el mostrador de {pedido.nombreLocal} para recoger y pagar.</p>
      </div>

      <div className="hu4-codigo hu4-codigo--centrado">
        <small>Código de pedido</small>
        <strong>{pedido.codigoPedido}</strong>
      </div>

      <dl className="hu4-datos">
        <div><dt>Hora de recojo</dt><dd>{pedido.horaRecojo}</dd></div>
        <div><dt>Fecha</dt><dd>{pedido.fechaPedido}</dd></div>
        <div><dt>Local</dt><dd>{pedido.nombreLocal}</dd></div>
        <div><dt>Total a pagar</dt><dd>{soles(pedido.total)}</dd></div>
      </dl>

      <p className="hu4-nota">
        Ubicación de recojo: {pedido.local?.ubicacionCampus ?? 'mostrador del local'}. El pago se realiza en el punto de recojo; la plataforma no cobra en línea.
      </p>

      <div className="hu4-acciones hu4-acciones--centro">
        <Link className="btn btn-primary" to={`/mis-pedidos/${pedido.id}`}>Ver avance del pedido</Link>
        <Link className="btn btn-tertiary" to="/locales">Volver a los locales</Link>
      </div>
    </section>
  );
}
