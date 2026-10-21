import { Link } from 'react-router-dom';
import { cx } from '../../utils/format.js';

import './Boton.css';

/**
 * Botón del sistema de diseño (usa las clases .btn de global.css).
 * variante: primary | secondary | tertiary | verde | texto.
 * Con `to` se dibuja como enlace; con `cargando` muestra spinner y bloquea el clic.
 */
export default function Boton({ variante = 'primary', bloque, cargando, textoCargando, to, className, children, disabled, ...resto }) {
  const clases = cx('btn', `btn-${variante}`, bloque && 'btn--bloque', cargando && 'btn--cargando', className);
  if (to) return <Link to={to} className={clases} {...resto}>{children}</Link>;
  return (
    <button className={clases} disabled={disabled || cargando} aria-busy={cargando || undefined} {...resto}>
      {cargando && <span className="spinner" aria-hidden="true" />}
      {cargando ? textoCargando ?? children : children}
    </button>
  );
}
