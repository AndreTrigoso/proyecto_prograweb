import './PantallaEstado.css';

// Estado de página completo: icono, título, texto y acciones (403, 404, éxitos, enlaces vencidos).
export default function PantallaEstado({ icono, ok, etiqueta, titulo, children, acciones }) {
  return (
    <div className="estado">
      <div className={`estado__icono ${ok ? 'estado__icono--ok' : ''}`} aria-hidden="true">{icono}</div>
      {etiqueta && <p className="estado__etiqueta">{etiqueta}</p>}
      <h1 className="estado__titulo">{titulo}</h1>
      {children && <p className="estado__texto">{children}</p>}
      {acciones && <div className="estado__acciones">{acciones}</div>}
    </div>
  );
}
