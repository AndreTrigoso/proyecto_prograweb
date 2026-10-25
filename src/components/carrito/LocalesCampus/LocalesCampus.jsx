/* HU-3 · 3.1 Locales del campus (y el estado «todos cerrados»).
   También muestra los productos que coinciden cuando se llega desde el buscador de la portada (?q=). */
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Clock, MapPin, Search, Star } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { catalogoService } from '../../../services/catalogoService';
import { EmptyState, ProductCard, StatusBadge } from '../../common';
import { useAgregarAlCarrito } from '../compartido/useAgregarAlCarrito';
import '../compartido/carrito.css';
import './LocalesCampus.css';

export function TarjetaLocal({ local }) {
  const navigate = useNavigate();
  const abierto = local.recibePedidos;
  return (
    <article className={`hu3-local ${abierto ? '' : 'hu3-local--cerrado'}`}>
      <div className="hu3-local__foto">
        {local.fotografias?.[0] ? <img src={local.fotografias[0]} alt={local.nombreComercial} loading="lazy" /> : <span>foto local</span>}
      </div>
      <div className="hu3-local__cuerpo">
        <div className="hu3-local__nombre">
          <h3>{local.nombreComercial}</h3>
          <StatusBadge status={local.estado} type="local" size="sm" />
        </div>
        <p><MapPin size={13} /> {local.ubicacionCampus} · {local.textoHorario}</p>
        <p>
          <Clock size={13} /> {local.tiempoEstimadoMin} min de preparación
          {local.calificacionPromedio != null && <> · {local.calificacionPromedio} <Star size={12} className="hu3-estrella" /></>}
        </p>
        <button type="button" className={`btn ${abierto ? 'btn-primary' : 'btn-tertiary'}`} onClick={() => navigate(`/locales/${local.id}`)}>
          Ver carta
        </button>
      </div>
    </article>
  );
}

export default function LocalesCampus() {
  const { locales: datos, productos: datosProductos } = useData(); // se recalcula cuando cambian los datos
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const [filtros, setFiltros] = useState({ sede: '', soloAbiertos: false, orden: 'espera' });
  const [verTodos, setVerTodos] = useState(false);
  const navigate = useNavigate();
  const { agregarProducto } = useAgregarAlCarrito();

  const resultado = useMemo(() => catalogoService.listarLocales({ ...filtros, q }), [filtros, q, datos]);
  const productos = useMemo(() => (q ? catalogoService.buscarProductos(q) : []), [q, datosProductos]);
  const set = (cambio) => setFiltros((f) => ({ ...f, ...cambio }));
  const ninguno = resultado.abiertos === 0 && !q;
  const sede = filtros.sede || resultado.sedes[0] || 'Monterrico';

  return (
    <section className="pagina hu3">
      <div className="hu3-cabecera">
        <div>
          <h1 className="pagina__titulo hu3-titulo">{q ? `Resultados para «${q}»` : 'Locales del campus'}</h1>
          <p className="hu3-subtitulo">
            {ninguno
              ? `Ningún local recibe pedidos en este momento · ${new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false })}`
              : `${resultado.abiertos} ${resultado.abiertos === 1 ? 'local abierto' : 'locales abiertos'} ahora · ${resultado.cerrados} ${resultado.cerrados === 1 ? 'cerrado' : 'cerrados'} · sede ${sede}`}
          </p>
        </div>
        {!ninguno && (
          <div className="hu3-controles">
            {q && (
              <button type="button" className="hu3-chip hu3-chip--filtro" onClick={() => setParams({})}>
                <Search size={13} /> «{q}» ✕
              </button>
            )}
            <select className="form-select hu3-select" aria-label="Sede" value={filtros.sede} onChange={(e) => set({ sede: e.target.value })}>
              <option value="">Sede: todas</option>
              {resultado.sedes.map((s) => <option key={s} value={s}>Sede: {s}</option>)}
            </select>
            <button type="button" className={`hu3-chip ${filtros.soloAbiertos ? 'hu3-chip--filtro' : ''}`} aria-pressed={filtros.soloAbiertos}
              onClick={() => set({ soloAbiertos: !filtros.soloAbiertos })}>
              Solo abiertos {filtros.soloAbiertos && '✕'}
            </button>
            <select className="form-select hu3-select" aria-label="Ordenar" value={filtros.orden} onChange={(e) => set({ orden: e.target.value })}>
              <option value="espera">Ordenar: menor espera</option>
              <option value="calificacion">Ordenar: mejor calificados</option>
              <option value="nombre">Ordenar: nombre</option>
            </select>
          </div>
        )}
      </div>

      {ninguno && !verTodos ? (
        <TodosCerrados locales={resultado.locales} onVerTodos={() => setVerTodos(true)} />
      ) : (
        <>
          {productos.length > 0 && (
            <>
              <p className="hu3-rotulo">Productos · {productos.length}</p>
              <div className="hu3-reticula hu3-reticula--productos">
                {productos.map((p) => (
                  <ProductCard key={p.id} producto={p}
                    onOpenDetails={() => navigate(`/locales/${p.localId}/productos/${p.id}`)}
                    onAddToCart={(prod) => agregarProducto(prod, p.local)} />
                ))}
              </div>
              <p className="hu3-rotulo">Locales · {resultado.locales.length}</p>
            </>
          )}
          {resultado.locales.length === 0 ? (
            <EmptyState icon={Search} title={q ? 'Ningún local coincide con tu búsqueda' : 'No hay locales para estos filtros'}
              description={q ? 'Prueba con otro nombre o revisa todos los locales del campus.' : 'Prueba con otra sede o quita «Solo abiertos».'}
              actionText="Ver todos los locales" onAction={() => { setParams({}); setFiltros({ sede: '', soloAbiertos: false, orden: 'espera' }); }} />
          ) : (
            <div className="hu3-reticula">
              {resultado.locales.map((l) => <TarjetaLocal key={l.id} local={l} />)}
              {resultado.locales.some((l) => !l.recibePedidos) && (
                <div className="hu3-nota-cerrados">Los locales cerrados se muestran atenuados al final de la lista, nunca ocultos.</div>
              )}
              {filtros.soloAbiertos && resultado.cerrados > 0 && (
                <button type="button" className="hu3-nota-cerrados" onClick={() => set({ soloAbiertos: false })}>
                  Hay {resultado.cerrados} {resultado.cerrados === 1 ? 'local cerrado' : 'locales cerrados'}. Quita «Solo abiertos» para ver sus cartas.
                </button>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

// 3.1 — Todos cerrados (fuera del horario de atención del campus)
function TodosCerrados({ locales, onVerTodos }) {
  const navigate = useNavigate();
  const proximos = locales.filter((l) => l.proximaApertura && l.estado !== 'suspendido').slice(0, 3);
  const primera = proximos.map((l) => l.proximaApertura.split(' a las ')[1]).filter(Boolean).sort()[0];
  return (
    <>
      <div className="hu3-vacio">
        <div className="hu3-vacio__icono"><Clock size={26} /></div>
        <h2>Ningún local está abierto ahora</h2>
        <p>{primera && `Los locales del campus reciben pedidos desde las ${primera}. `}Puedes revisar las cartas mientras tanto y pedir en cuanto abran.</p>
        <button type="button" className="btn btn-primary" onClick={onVerTodos}>Ver cartas de todos los locales</button>
      </div>
      {proximos.length > 0 && (
        <>
          <p className="hu3-rotulo">Próximas aperturas</p>
          <div className="hu3-aperturas">
            {proximos.map((l) => (
              <button type="button" key={l.id} className="hu3-apertura" onClick={() => navigate(`/locales/${l.id}`)}>
                {l.logotipo ? <img src={l.logotipo} alt="" /> : <span className="hu3-apertura__logo" />}
                <span>
                  <strong>{l.nombreComercial}</strong>
                  <small>Abre {l.proximaApertura}</small>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}
