import { cx } from '../../utils/format.js';

import './CampoTexto.css';

/**
 * Campo conectado a useFormulario: etiqueta, control, ayuda y error junto al campo.
 * `as="select"` dibuja un <select> (las opciones van como children).
 */
export default function CampoTexto({ form, name, label, hint, as = 'input', children, className, ...resto }) {
  const id = `f-${name}`;
  const error = form.errores[name];
  const Control = as;
  return (
    <div className={cx('form-group', className)}>
      <label className="form-label" htmlFor={id}>{label}</label>
      <Control
        id={id}
        name={name}
        value={form.valores[name] ?? ''}
        onChange={form.alCambiar}
        onBlur={form.alSalir}
        disabled={form.enviando}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cx(as === 'select' ? 'form-select' : 'form-input', error && 'is-invalid')}
        {...resto}
      >
        {children}
      </Control>
      {error ? (
        <p id={`${id}-error`} className="form-error" role="alert">{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="campo__ayuda">{hint}</p>
      ) : null}
    </div>
  );
}
