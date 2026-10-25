/* HU-3 · Paginación «Mostrando 1 a 8 de 18 productos» (mockup 3.2). */
import './Paginacion.css';
export default function Paginacion({ pagina, paginas, desde, hasta, total, nombre = 'productos', onCambiar }) {
  if (!total) return null;
  return (
    <div className="hu3-paginacion">
      <span>Mostrando {desde} a {hasta} de {total} {nombre}</span>
      {paginas > 1 && (
        <div className="hu3-paginacion__botones">
          <button type="button" aria-label="Página anterior" disabled={pagina <= 1} onClick={() => onCambiar(pagina - 1)}>‹</button>
          {Array.from({ length: paginas }, (_, i) => i + 1).map((n) => (
            <button type="button" key={n} className={n === pagina ? 'activa' : ''} aria-current={n === pagina ? 'page' : undefined} onClick={() => onCambiar(n)}>{n}</button>
          ))}
          <button type="button" aria-label="Página siguiente" disabled={pagina >= paginas} onClick={() => onCambiar(pagina + 1)}>›</button>
        </div>
      )}
    </div>
  );
}
