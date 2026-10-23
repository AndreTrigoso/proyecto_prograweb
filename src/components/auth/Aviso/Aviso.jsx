import { cx } from '../../../utils/format.js';

import './Aviso.css';

/** Aviso dentro de una pantalla. variante: danger | exito | info | blanco */
export default function Aviso({ variante = 'danger', className, children }) {
  return (
    <div className={cx('aviso', `aviso--${variante}`, className)} role={variante === 'danger' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}
