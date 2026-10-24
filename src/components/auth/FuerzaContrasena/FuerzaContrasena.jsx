import { passwordStrength } from '../../../utils/validators.js';

import './FuerzaContrasena.css';

const COLORES = ['var(--color-danger)', 'var(--color-warning)', 'var(--color-success)'];

// Barra Débil / Media / Segura; no aparece mientras la contraseña está vacía.
export default function FuerzaContrasena({ value }) {
  const { level, label, percent } = passwordStrength(value);
  if (level < 0) return null;
  return (
    <div className="fuerza" aria-live="polite">
      <div className="fuerza__barra">
        <div className="fuerza__relleno" style={{ width: `${percent}%`, background: COLORES[level] }} />
      </div>
      <span className="fuerza__texto" style={{ color: COLORES[level] }}>{label}</span>
    </div>
  );
}
