import './Casilla.css';

// Casilla conectada a useFormulario. Su error aparece debajo, junto al campo.
export default function Casilla({ form, name, children }) {
  const error = form.errores[name];
  const id = `f-${name}`;
  return (
    <div className="casilla">
      <label className="casilla__etiqueta" htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          name={name}
          checked={Boolean(form.valores[name])}
          onChange={form.alCambiar}
          disabled={form.enviando}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <span>{children}</span>
      </label>
      {error && <p id={`${id}-error`} className="form-error" role="alert">{error}</p>}
    </div>
  );
}
