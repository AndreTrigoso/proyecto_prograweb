/* HU-4 · 4.1 Confirmación del pedido: resumen, selector de hora de recojo y total.
   Piezas sueltas del mockup: franja fuera del horario y local con recepción suspendida. */
import { useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useCart } from '../../../context/CartContext';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { misPedidosService } from '../../../services/misPedidosService';
import Migas from '../../carrito/Migas/Migas';
import { soles } from '../../carrito/compartido/reglas';
import { CANCELAR_ANTES_MIN, TOLERANCIA_RECOJO_MIN, aMinutos, validarFranja } from '../compartido/reglasPedido';
import { useAhora, usePedidosEnVivo } from '../compartido/usePedidosEnVivo';
import '../../carrito/compartido/carrito.css';
import '../compartido/pedidos.css';
import './ConfirmarPedido.css';

const detalleItem = (item) =>
  [...(item.opcionesSeleccionadas ?? []).map((o) => o.nombre), item.nota].filter(Boolean).join(' · ');

export default function ConfirmarPedido() {
  const { currentUser } = useAuth();
  const { items, localId, subtotalTotal, clearCart } = useCart();
  const { locales, productos } = useData();
  const pedidos = usePedidosEnVivo(); // si el local suspende o agota algo en otra pestaña, esta vista se entera
  const ahora = useAhora();
  const toast = useToast();
  const [hora, setHora] = useState(null);
  const [error, setError] = useState(null);
  const [confirmado, setConfirmado] = useState(null);

  const datos = useMemo(() => {
    if (!items.length) return null;
    try {
      return misPedidosService.prepararConfirmacion(localId, items, ahora);
    } catch (e) {
      return { error: e.message };
    }
  }, [localId, items, ahora, locales, productos, pedidos]);

  if (confirmado) return <Navigate to={`/mis-pedidos/${confirmado}/confirmado`} replace />;
  if (!datos) return <Navigate to="/carrito" replace />;
  // Un producto se agotó o salió de la carta: el carrito (3.4) lo marca y abre el aviso 3.5.
  if (datos.error || datos.problemas.length) return <Navigate to="/carrito" replace />;

  const { local, franjas, horario, ultima, fecha, minutosPrep, ocupacion } = datos;
  const recibe = local.recibePedidos;
  const ahoraMin = ahora.getHours() * 60 + ahora.getMinutes();
  // Se muestran las franjas desde una hora antes de ahora: las anteriores ya no aportan nada.
  const visibles = franjas.filter((f) => aMinutos(f.hora) >= ahoraMin - 60);
  // Si la franja elegida quedó fuera del horario (el local cambió su cierre), se sigue mostrando, tachada.
  if (hora && !visibles.some((f) => f.hora === hora)) {
    visibles.push({ hora, disponible: false, motivo: 'fuera' });
    visibles.sort((x, y) => aMinutos(x.hora) - aMinutos(y.hora));
  }
  const hayDisponibles = recibe && visibles.some((f) => f.disponible);
  const avisoFranja = recibe && hora ? validarFranja(local, minutosPrep, hora, ocupacion, ahora) : null;
  const puedeConfirmar = recibe && hora && !avisoFranja;

  const confirmar = () => {
    setError(null);
    try {
      const pedido = misPedidosService.confirmar({ usuario: currentUser, localId, items, horaRecojo: hora });
      setConfirmado(pedido.id);
      clearCart();
    } catch (e) {
      if (e.code === 'PRODUCTO_NO_DISPONIBLE') toast.error('Un producto ya no está disponible', e.message);
      setError({ mensaje: e.message, detalle: e.detalle });
    }
  };

  let sinFranjas = null;
  if (recibe && !horario) sinFranjas = `${local.nombreComercial} no atiende hoy. Puedes pedir en otro local abierto.`;
  else if (recibe && !hayDisponibles) {
    sinFranjas = `Ya no quedan franjas de recojo para hoy en ${local.nombreComercial}.`
      + (ultima ? ` El local cierra a las ${horario.horaCierre}. La última franja de recojo es ${ultima}.` : '');
  }

  return (
    <section className="pagina hu3 hu4">
      <Migas items={[{ label: 'Carrito', to: '/carrito' }, { label: 'Hora de recojo y confirmación' }]} />
      <h1 className="hu3-titulo">Confirma tu pedido</h1>
      <p className="hu3-subtitulo hu4-separado">{local.nombreComercial} · {local.ubicacionCampus} · hoy {fecha}</p>

      <div className="hu4-confirmar">
        <div className="hu3-panel">
          <h2 className="hu4-panel__titulo">Resumen del pedido</h2>
          <ul className="hu4-items">
            {items.map((i) => (
              <li key={i.itemCarritoId}>
                <div>
                  <span>{i.cantidad} × {i.nombre}</span>
                  {detalleItem(i) && <small>{detalleItem(i)}</small>}
                </div>
                <b>{soles(i.subtotal)}</b>
              </li>
            ))}
          </ul>
          <div className="hu4-total">
            <span>Total a pagar en el mostrador</span>
            <strong>{soles(subtotalTotal)}</strong>
          </div>
          <p className="hu3-aviso hu3-aviso--info hu4-sin-margen">
            El pago es en el punto de recojo. Tienes {TOLERANCIA_RECOJO_MIN} minutos de tolerancia desde el inicio de tu franja.
          </p>
        </div>

        <div className="hu3-panel">
          <h2 className="hu4-panel__titulo">Elige tu hora de recojo</h2>
          <p className="hu3-subtitulo hu4-separado">
            Franjas de 30 minutos · las tachadas están completas o no alcanzan el tiempo de preparación ({minutosPrep} min)
          </p>

          {!recibe && (
            <p className="hu3-aviso hu3-aviso--error" role="alert">
              {local.estado === 'suspendido'
                ? `${local.nombreComercial} suspendió la recepción de pedidos. Guardamos tu carrito para cuando reabra.`
                : `${local.nombreComercial} está cerrado. Guardamos tu carrito para cuando abra.`}
            </p>
          )}
          {sinFranjas && <p className="hu3-aviso hu3-aviso--advertencia" role="status">{sinFranjas}</p>}
          {avisoFranja && <p className="hu3-aviso hu3-aviso--advertencia" role="alert">{avisoFranja.mensaje}</p>}
          {error && !avisoFranja && <p className="hu3-aviso hu3-aviso--error" role="alert">{error.mensaje}</p>}

          {recibe ? (
            visibles.length > 0 && (
              <div className="hu4-franjas" role="radiogroup" aria-label="Hora de recojo">
                {visibles.map((f) => {
                  const elegida = f.hora === hora;
                  return (
                    <button type="button" key={f.hora} role="radio" aria-checked={elegida}
                      className={`hu4-franja ${elegida ? 'hu4-franja--elegida' : ''} ${!f.disponible ? 'hu4-franja--tachada' : ''} ${elegida && !f.disponible ? 'hu4-franja--invalida' : ''}`}
                      disabled={!f.disponible && !elegida}
                      title={{ completa: 'Franja completa', preparacion: 'No alcanza el tiempo de preparación', pasada: 'Ya pasó', fuera: 'Fuera del horario del local' }[f.motivo]}
                      onClick={() => { setHora(f.hora); setError(null); }}>
                      {f.hora}
                    </button>
                  );
                })}
              </div>
            )
          ) : (
            <div className="hu4-franjas" aria-hidden="true">
              {[0, 1, 2].map((n) => <span key={n} className="hu4-franja hu4-franja--vacia" />)}
            </div>
          )}

          {recibe && (
            <div className="hu4-elegida">
              <span>Franja elegida</span>
              <strong>{hora ? `${hora} · ${fecha}` : 'Elige una hora'}</strong>
            </div>
          )}

          <button type="button" className="btn btn-primary hu3-bloque" disabled={!puedeConfirmar} onClick={confirmar}>
            {recibe ? `Confirmar pedido · ${soles(subtotalTotal)}` : 'Confirmar pedido'}
          </button>
          {!recibe ? (
            <Link className="btn btn-secondary hu3-bloque hu4-arriba" to="/locales">Ver otros locales abiertos</Link>
          ) : avisoFranja?.detalle || error?.detalle ? (
            <p className="hu3-ayuda">{avisoFranja?.detalle ?? error.detalle}</p>
          ) : (
            <p className="hu3-ayuda hu4-centro">Podrás cancelar hasta {CANCELAR_ANTES_MIN} minutos antes de tu franja.</p>
          )}
        </div>
      </div>
    </section>
  );
}
