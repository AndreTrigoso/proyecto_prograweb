/* HU-3 · Migas de pan de las pantallas del catálogo y del carrito. */
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import './Migas.css';

export default function Migas({ items }) {
  return (
    <nav className="hu3-migas" aria-label="Migas de pan">
      {items.map((it, i) => (
        <span key={it.label} className="hu3-migas__item">
          {i > 0 && <ChevronRight size={12} aria-hidden />}
          {it.to ? <Link to={it.to}>{it.label}</Link> : <strong>{it.label}</strong>}
        </span>
      ))}
    </nav>
  );
}
