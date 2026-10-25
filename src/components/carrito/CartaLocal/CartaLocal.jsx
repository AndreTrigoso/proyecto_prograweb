/* HU-3 · 3.2 Carta del local: cabecera del local, categorías, buscador, filtros y retícula paginada. */
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { HelpCircle, Star } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { catalogoService } from '../../../services/catalogoService';
import { EmptyState, ProductCard, StatusBadge } from '../../common';
import { useAgregarAlCarrito } from '../compartido/useAgregarAlCarrito';
import Paginacion from '../Paginacion/Paginacion';
import Migas from '../Migas/Migas';
import '../compartido/carrito.css';
import './CartaLocal.css';

// Rangos de precio (mockup: «Hasta S/ 10»)
export const RANGOS_PRECIO = {
  '': { etiqueta: 'Cualquier precio' },
  h5: { max: 5, etiqueta: 'Hasta S/ 5' },
  h10: { max: 10, etiqueta: 'Hasta S/ 10' },
  h15: { max: 15, etiqueta: 'Hasta S/ 15' },
  '10a20': { min: 10, max: 20, etiqueta: 'S/ 10 a S/ 20' },
  m15: { min: 15, etiqueta: 'Más de S/ 15' },
};
const INICIALES = { categoriaId: '', q: '', rango: '', soloDisponibles: false, pagina: 1 };

export default function CartaLocal() {
  const { localId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { locales, productos } = useData(); // para refrescar cuando el local cambia su carta
  const { agregarProducto } = useAgregarAlCarrito();
  // «Ver productos similares» (3.3 agotado) llega con la categoría del producto
  const [filtros, setFiltros] = useState({ ...INICIALES, categoriaId: location.state?.categoriaId ?? '' });

  useEffect(() => { setFiltros({ ...INICIALES, categoriaId: location.state?.categoriaId ?? '' }); }, [localId]); // eslint-disable-line react-hooks/exhaustive-deps

  const carta = useMemo(() => {
    try { return catalogoService.obtenerCarta(localId); } catch (e) { return { error: e.message }; }
  }, [localId, locales, productos]);

  const resultado = useMemo(() => {
    if (carta.error) return null;
    const r = RANGOS_PRECIO[filtros.rango];
    return catalogoService.productosDeCarta(localId, { ...filtros, min: r.min ?? null, max: r.max ?? null });
  }, [localId, filtros, carta]);

  if (carta.error) {
    return (
      <section className="pagina hu3">
        <EmptyState icon={HelpCircle} title="Este local no existe" description="Puede que el enlace esté mal escrito o que el local ya no esté en la plataforma."
          actionText="Ver locales" onAction={() => navigate('/locales')} />
      </section>
    );
  }

  const { local, categorias } = carta;
  const set = (cambio) => setFiltros((f) => ({ ...f, pagina: 1, ...cambio }));

  return (
    <section className="pagina hu3">
      <Migas items={[{ label: 'Locales', to: '/locales' }, { label: local.nombreComercial }]} />

      <div className="hu3-ficha">
        {local.logotipo ? <img className="hu3-ficha__logo" src={local.logotipo} alt="" /> : <span className="hu3-ficha__logo" />}
        <div className="hu3-crece">
          <h1 className="hu3-ficha__nombre">{local.nombreComercial} <StatusBadge status={local.estado} type="local" size="sm" /></h1>
          <p className="hu3-subtitulo">
            {local.ubicacionCampus} · {local.recibePedidos ? `hoy ${local.textoHorario}` : local.textoHorario} · {local.tiempoEstimadoMin} min de preparación
            {local.calificacionPromedio != null && <> · {local.calificacionPromedio} <Star size={12} className="hu3-estrella" /> ({local.totalCalificaciones})</>}
          </p>
        </div>
      </div>

      {!local.recibePedidos && (
        <p className="hu3-aviso hu3-aviso--advertencia">
          {local.estado === 'suspendido'
            ? `${local.nombreComercial} suspendió la recepción de pedidos${local.motivoSuspension ? `: ${local.motivoSuspension.replace(/\.+$/, '')}` : ''}. Puedes ver su carta.`
            : `${local.nombreComercial} está cerrado. Puedes ver su carta y pedir cuando abra.`}
        </p>
      )}

      {categorias.length === 0 ? (
        <EmptyState title="Carta en preparación" description="Este local todavía no publica productos." actionText="Ver otros locales" onAction={() => navigate('/locales')} />
      ) : (
        <>
          <nav className="hu3-chips" aria-label="Categorías">
            <button type="button" className={`hu3-chip ${!filtros.categoriaId ? 'hu3-chip--activo' : ''}`} aria-pressed={!filtros.categoriaId} onClick={() => set({ categoriaId: '' })}>Todo</button>
            {categorias.map((c) => (
              <button type="button" key={c.id} className={`hu3-chip ${filtros.categoriaId === c.id ? 'hu3-chip--activo' : ''}`}
                aria-pressed={filtros.categoriaId === c.id} onClick={() => set({ categoriaId: c.id })}>{c.nombre}</button>
            ))}
          </nav>

          <div className="hu3-filtros">
            <input className="form-input" type="search" placeholder="Buscar en esta carta…" aria-label="Buscar en esta carta"
              value={filtros.q} onChange={(e) => set({ q: e.target.value })} />
            <select className="form-select hu3-select" aria-label="Rango de precio" value={filtros.rango} onChange={(e) => set({ rango: e.target.value })}>
              {Object.entries(RANGOS_PRECIO).map(([k, r]) => <option key={k} value={k}>{r.etiqueta}</option>)}
            </select>
            <button type="button" className={`hu3-chip ${filtros.soloDisponibles ? 'hu3-chip--filtro' : ''}`} aria-pressed={filtros.soloDisponibles}
              onClick={() => set({ soloDisponibles: !filtros.soloDisponibles })}>
              Solo disponibles {filtros.soloDisponibles && '✕'}
            </button>
          </div>

          {resultado.total === 0 ? (
            <SinResultados filtros={filtros} categorias={categorias} set={set} limpiar={() => setFiltros(INICIALES)} />
          ) : (
            <>
              <div className="hu3-reticula hu3-reticula--productos">
                {resultado.productos.map((p) => (
                  <ProductCard key={p.id} producto={p}
                    onOpenDetails={() => navigate(`/locales/${local.id}/productos/${p.id}`)}
                    onAddToCart={(prod) => agregarProducto(prod, local)} />
                ))}
              </div>
              <Paginacion {...resultado} nombre={resultado.total === 1 ? 'producto' : 'productos'}
                onCambiar={(n) => { setFiltros((f) => ({ ...f, pagina: n })); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
            </>
          )}
        </>
      )}
    </section>
  );
}

// Pieza suelta · sin resultados de búsqueda (mockup 3.2)
function SinResultados({ filtros, categorias, set, limpiar }) {
  const chips = [];
  if (filtros.q) chips.push({ texto: `«${filtros.q}»`, quitar: () => set({ q: '' }) });
  if (filtros.categoriaId) chips.push({ texto: categorias.find((c) => c.id === filtros.categoriaId)?.nombre, quitar: () => set({ categoriaId: '' }) });
  if (filtros.rango) chips.push({ texto: RANGOS_PRECIO[filtros.rango].etiqueta, quitar: () => set({ rango: '' }) });
  if (filtros.soloDisponibles) chips.push({ texto: 'Solo disponibles', quitar: () => set({ soloDisponibles: false }) });

  return (
    <div className="hu3-vacio">
      <div className="hu3-sin-resultados__chips">
        {chips.map((c) => (
          <button type="button" key={c.texto} className="hu3-chip hu3-chip--filtro hu3-chip--chico" onClick={c.quitar} aria-label={`Quitar filtro ${c.texto}`}>{c.texto} ✕</button>
        ))}
        {chips.length > 1 && <button type="button" className="hu3-enlace" onClick={limpiar}>Limpiar todo</button>}
      </div>
      <div className="hu3-vacio__icono hu3-vacio__icono--rojo">?</div>
      <h2>Ningún producto coincide con tu búsqueda</h2>
      <p>Prueba con otro término, sube el límite de precio o revisa la carta completa del local.</p>
      <button type="button" className="btn btn-primary" onClick={limpiar}>Ver toda la carta</button>
    </div>
  );
}
