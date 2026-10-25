/* HU-3 · 3.3 Detalle del producto: grupos de opciones, cantidad y nota
   (opción obligatoria sin elegir y producto agotado como estados). */
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Clock, HelpCircle, Star } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { catalogoService } from '../../../services/catalogoService';
import { EmptyState, StatusBadge } from '../../common';
import { useAgregarAlCarrito } from '../compartido/useAgregarAlCarrito';
import { MAX_NOTA, precioUnitario, resolverSeleccion, seleccionInicial, soles } from '../compartido/reglas';
import Migas from '../Migas/Migas';
import SelectorCantidad from '../SelectorCantidad/SelectorCantidad';
import '../compartido/carrito.css';
import './DetalleProducto.css';

function GrupoOpciones({ grupo, seleccion, onCambiar, deshabilitado, error }) {
  const unica = grupo.tipo === 'unica';
  const elegidas = seleccion.filter((s) => s.grupoId === grupo.id).map((s) => s.opcionId);
  const limite = unica ? 1 : grupo.maxSeleccion || grupo.opciones.length;

  const elegir = (opcionId) => {
    const otros = seleccion.filter((s) => s.grupoId !== grupo.id);
    if (unica) return onCambiar([...otros, { grupoId: grupo.id, opcionId }]);
    const nuevas = elegidas.includes(opcionId) ? elegidas.filter((x) => x !== opcionId) : [...elegidas, opcionId];
    onCambiar([...otros, ...nuevas.map((id) => ({ grupoId: grupo.id, opcionId: id }))]);
  };

  return (
    <fieldset className={`hu3-grupo ${error ? 'hu3-grupo--error' : ''}`} disabled={deshabilitado}>
      <legend className="form-label">
        {grupo.nombre} · {grupo.obligatorio ? 'Obligatorio' : 'Opcional'}
        {!unica && limite < grupo.opciones.length && ` · hasta ${limite}`}
      </legend>
      {grupo.opciones.map((o) => {
        const marcada = elegidas.includes(o.id);
        return (
          <label key={o.id} className="hu3-alternativa">
            <input type={unica ? 'radio' : 'checkbox'} name={grupo.id} checked={marcada}
              disabled={!unica && !marcada && elegidas.length >= limite} onChange={() => elegir(o.id)} />
            <span>{o.nombre}</span>
            {o.precioAdicional > 0 ? <b>+ {soles(o.precioAdicional)}</b> : <small>Sin costo</small>}
          </label>
        );
      })}
    </fieldset>
  );
}

// Se reinicia la selección al pasar de un producto a otro.
export default function DetalleProducto() {
  const { productoId } = useParams();
  return <DetalleContenido key={productoId} />;
}

function DetalleContenido() {
  const { localId, productoId } = useParams();
  const navigate = useNavigate();
  const { currentRole } = useAuth();
  const { productos, locales } = useData();
  const { agregarProducto } = useAgregarAlCarrito();

  const producto = useMemo(() => {
    try { return catalogoService.obtenerProducto(productoId); } catch { return null; }
  }, [productoId, productos, locales]);

  const [seleccion, setSeleccion] = useState(() => (producto ? seleccionInicial(producto) : []));
  const [cantidad, setCantidad] = useState(1);
  const [nota, setNota] = useState('');

  if (!producto) {
    return (
      <section className="pagina hu3">
        <EmptyState icon={HelpCircle} title="Este producto ya no está disponible"
          description="Puede que el local lo haya retirado de la carta o que el enlace haya caducado."
          actionText="Volver a la carta" onAction={() => navigate(`/locales/${localId}`)} />
      </section>
    );
  }

  const { local } = producto;
  const sel = resolverSeleccion(producto, seleccion);
  const unitario = precioUnitario(producto.precio, sel.opcionesSeleccionadas);
  const agotado = producto.disponibilidad === 'agotado_dia';
  const notaLarga = nota.length > MAX_NOTA;
  const esComensal = currentRole === 'comensal';
  const mostrarError = esComensal && local.recibePedidos && sel.faltan.length > 0;
  const puedeAgregar = esComensal && local.recibePedidos && !agotado && !sel.faltan.length && !notaLarga;

  const agregar = () => {
    const ok = agregarProducto(producto, local, { seleccion, cantidad, nota });
    if (ok) navigate(`/locales/${local.id}`);
  };

  return (
    <section className="pagina hu3">
      <Migas items={[{ label: 'Locales', to: '/locales' }, { label: local.nombreComercial, to: `/locales/${local.id}` }, { label: producto.nombre }]} />

      <div className="hu3-detalle">
        <div>
          <div className="hu3-detalle__foto">
            {producto.fotografia ? <img src={producto.fotografia} alt={producto.nombre} /> : <span>foto del producto 1:1</span>}
          </div>
          <p className="hu3-detalle__meta">
            <span>{local.nombreComercial}</span>
            <span><Clock size={13} /> {producto.tiempoPreparacionMin} min de preparación</span>
            {local.calificacionPromedio != null && <span>{local.calificacionPromedio} <Star size={12} className="hu3-estrella" /> ({local.totalCalificaciones})</span>}
          </p>
        </div>

        <div>
          <h1 className="hu3-detalle__nombre">{producto.nombre} {agotado && <StatusBadge status="agotado_dia" type="producto" size="sm" />}</h1>
          <p className="hu3-detalle__descripcion">
            {producto.descripcion}{agotado && ` Se agotó por hoy en ${local.nombreComercial}.`}
          </p>
          <p className="hu3-precio hu3-precio--grande">{soles(producto.precio)}</p>

          {agotado ? (
            <div className="hu3-detalle__pie">
              <button type="button" className="btn" disabled>Agotado por hoy</button>
              <button type="button" className="btn btn-secondary" onClick={() => navigate(`/locales/${local.id}`, { state: { categoriaId: producto.categoriaId } })}>
                Ver productos similares
              </button>
            </div>
          ) : (
            <>
              {mostrarError && (
                <p className="hu3-aviso hu3-aviso--error" role="status">Elige {sel.faltan.map((f) => f.toLowerCase()).join(' y ')} para continuar.</p>
              )}
              <div className="hu3-detalle__grupos">
                {(producto.gruposOpciones ?? []).map((g) => (
                  <GrupoOpciones key={g.id} grupo={g} seleccion={seleccion} onCambiar={setSeleccion}
                    deshabilitado={!esComensal || !local.recibePedidos} error={mostrarError && sel.faltan.includes(g.nombre)} />
                ))}
                {esComensal && (
                  <div className="form-group">
                    <label className="form-label" htmlFor="hu3-nota">Nota para el local</label>
                    <textarea id="hu3-nota" className={`form-textarea ${notaLarga ? 'is-invalid' : ''}`} rows={3} placeholder="Ej.: sin cebolla, por favor."
                      value={nota} aria-invalid={notaLarga} onChange={(e) => setNota(e.target.value)} />
                    {notaLarga
                      ? <span className="form-error" role="alert">Máximo {MAX_NOTA} caracteres ({nota.length}/{MAX_NOTA}).</span>
                      : <span className="hu3-ayuda">Máximo {MAX_NOTA} caracteres.</span>}
                  </div>
                )}
              </div>

              {currentRole === 'visitante' ? (
                <div className="hu3-detalle__pie">
                  <Link className="btn btn-primary hu3-crece" to="/login" state={{ from: `/locales/${local.id}/productos/${producto.id}` }}>Inicia sesión para pedir</Link>
                  <Link className="btn btn-tertiary" to={`/locales/${local.id}`}>Volver a la carta</Link>
                </div>
              ) : !esComensal ? (
                <p className="hu3-aviso">Solo los comensales pueden hacer pedidos.</p>
              ) : (
                <div className="hu3-detalle__pie">
                  <SelectorCantidad valor={cantidad} onCambiar={setCantidad} />
                  <button type="button" className="btn btn-primary hu3-crece" disabled={!puedeAgregar} onClick={agregar}>
                    Agregar al carrito · {soles(unitario * cantidad)}
                  </button>
                  <Link className="btn btn-tertiary" to={`/locales/${local.id}`}>Volver a la carta</Link>
                </div>
              )}
              {esComensal && !local.recibePedidos && (
                <p className="hu3-ayuda">{local.nombreComercial} no recibe pedidos ahora ({local.textoHorario}).</p>
              )}
              {mostrarError && <p className="hu3-ayuda">El botón queda deshabilitado hasta completar los grupos obligatorios.</p>}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
