import { useState } from 'react';
import { cx } from '../../../utils/format.js';

import './ImagenProvisional.css';

// Marcador de foto de los mockups. Si hay `src` muestra la imagen; si no carga, vuelve al marcador.
export default function ImagenProvisional({ label, src, alt = '', className }) {
  const [fallo, setFallo] = useState(false);
  return (
    <div className={cx('imagen-provisional', className)}>
      {src && !fallo ? <img src={src} alt={alt} onError={() => setFallo(true)} /> : <span>{label}</span>}
    </div>
  );
}
