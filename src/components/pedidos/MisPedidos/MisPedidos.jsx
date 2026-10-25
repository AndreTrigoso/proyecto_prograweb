/* HU-4 · 4.3 Mis pedidos: en curso e históricos con badge de estado y acción de repetir · vacío como pieza suelta. */
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { StatusBadge } from '../../common';
import { misPedidosService } from '../../../services/misPedidosService';
import Paginacion from '../../carrito/Paginacion/Paginacion';
import { soles } from '../../carrito/compartido/reglas';
import { enCurso, textoProductos } from '../compartido/reglasPedido';
import { usePedidosEnVivo } from '../compartido/usePedidosEnVivo';
import { useRepetirPedido } from '../compartido/useRepetirPedido';
import '../../carrito/compartido/carrito.css';
import '../compartido/pedidos.css';
import './MisPedidos.css';

const POR_PAGINA = 5;

function FilaPedido({ pedido, onRepetir }) {
  const navigate = useNavigate();
  const activo = enCurso(pedido);
  const listo = pedido.estado === 'listo';
  const detalle = `/mis-pedidos/${pedido.id}`;

  return (
    <article className={`hu4-fila ${listo ? 'hu4-fila--listo' : ''}`}>
      <div className="hu4-fila__local">
        <Link to={detalle}><strong>{pedido.nombreLocal}</strong></Link>
        <small>{pedido.codigoPedido}</small>
      </div>
      <dl className="hu4-fila__datos">
        <div><dt>Recojo</dt><dd className={activo ? 'hu4-fuerte' : ''}>{pedido.horaRecojo}</dd></div>
        <div><dt>Fecha</dt><dd>{pedido.fechaPedido}</dd></div>
        <div><dt>Ítems</dt><dd>{textoProductos(pedido.items)}</dd></div>
        <div><dt>Total</dt><dd className="hu4-fuerte">{soles(pedido.total)}</dd></div>
      </dl>
      <StatusBadge status={pedido.estado} type="pedido" size="sm" solid={listo} />
      <div className="hu4-fila__acciones">
        {activo ? (
          <button type="button" className={`btn btn-sm ${listo ? 'btn-primary' : 'btn-secondary'}`} onClick={() => navigate(detalle)}>
            {listo ? 'Ver código' : 'Ver avance'}
          </button>
        ) : (
          <>
            <button type="button" className="btn btn-sm btn-tertiary" onClick={() => onRepetir(pedido)}>Repetir</button>
            {pedido.estado === 'entregado' && !pedido.calificado && (
              <button type="button" className="btn btn-sm hu4-btn-verde" onClick={() => navigate('/mis-calificaciones', { state: { pedidoId: pedido.id } })}>
                Calificar
              </button>
            )}
          </>
        )}
      </div>
    </article>
  );
}

export default function MisPedidos() {
  const { currentUser } = useAuth();
  const pedidos = usePedidosEnVivo(); // los cambios de estado que hace el local se ven sin recargar
  const navigate = useNavigate();
  const { repetir, modal } = useRepetirPedido();
  const [localFiltro, setLocalFiltro] = useState('');
  const [pagina, setPagina] = useState(1);

  const todos = useMemo(() => misPedidosService.listar(currentUser?.id), [currentUser, pedidos]);
  const localesConPedidos = useMemo(
    () => [...new Map(todos.map((p) => [p.localId, p.nombreLocal])).entries()].sort((a, b) => a[1].localeCompare(b[1])),
    [todos],
  );

  if (!todos.length) {
    return (
      <section className="pagina hu3 hu4">
        <div className="hu3-vacio">
          <div className="hu3-vacio__icono hu3-vacio__icono--rojo"><ClipboardList size={24} /></div>
          <h2>Aún no tienes pedidos</h2>
          <p>Cuando pidas en un local del campus verás aquí su avance y su código de recojo.</p>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/locales')}>Ver locales abiertos</button>
        </div>
      </section>
    );
  }

  const filtrados = localFiltro ? todos.filter((p) => p.localId === localFiltro) : todos;
  const activos = filtrados.filter(enCurso);
  const historicos = filtrados.filter((p) => !enCurso(p));
  // Se pagina la lista completa (en curso primero) y cada página se separa en sus dos grupos.
  const lista = [...activos, ...historicos];
  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  const actual = Math.min(pagina, paginas);
  const desde = (actual - 1) * POR_PAGINA;
  const enPagina = lista.slice(desde, desde + POR_PAGINA);
  const activosPagina = enPagina.filter(enCurso);
  const historicosPagina = enPagina.filter((p) => !enCurso(p));

  return (
    <section className="pagina hu3 hu4">
      <div className="hu3-cabecera">
        <div>
          <h1 className="hu3-titulo">Mis pedidos</h1>
          <p className="hu3-subtitulo">
            {activos.length} {activos.length === 1 ? 'pedido en curso' : 'pedidos en curso'} · {historicos.length} en el histórico
          </p>
        </div>
        <select className="form-select hu3-select" aria-label="Filtrar por local" value={localFiltro}
          onChange={(e) => { setLocalFiltro(e.target.value); setPagina(1); }}>
          <option value="">Local: todos</option>
          {localesConPedidos.map(([id, nombre]) => <option key={id} value={id}>{nombre}</option>)}
        </select>
      </div>

      {!filtrados.length && <p className="hu3-aviso">No tienes pedidos en este local.</p>}

      {activosPagina.length > 0 && (
        <>
          <p className="hu3-rotulo hu4-rotulo--rojo">En curso · {activos.length}</p>
          <div className="hu4-filas">
            {activosPagina.map((p) => <FilaPedido key={p.id} pedido={p} onRepetir={repetir} />)}
          </div>
        </>
      )}
      {historicosPagina.length > 0 && (
        <>
          <p className="hu3-rotulo">Históricos</p>
          <div className="hu4-filas">
            {historicosPagina.map((p) => <FilaPedido key={p.id} pedido={p} onRepetir={repetir} />)}
          </div>
        </>
      )}

      <Paginacion pagina={actual} paginas={paginas} desde={lista.length ? desde + 1 : 0} hasta={desde + enPagina.length}
        total={lista.length} nombre={lista.length === 1 ? 'pedido' : 'pedidos'}
        onCambiar={(n) => { setPagina(n); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
      {modal}
    </section>
  );
}
