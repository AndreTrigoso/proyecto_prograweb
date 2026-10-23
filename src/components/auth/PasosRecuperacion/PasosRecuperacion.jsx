import './PasosRecuperacion.css';

// Indicador 1 - 2 - 3 de la recuperación de contraseña.
export default function PasosRecuperacion({ actual, total = 3 }) {
  return (
    <ol className="pasos" aria-label={`Paso ${actual} de ${total}`}>
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
        <li key={n} className={`pasos__item ${n === actual ? 'is-actual' : n < actual ? 'is-hecho' : ''}`}>
          <span className="pasos__punto">{n < actual ? '✓' : n}</span>
        </li>
      ))}
    </ol>
  );
}
