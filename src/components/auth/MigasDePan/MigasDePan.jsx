import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { ROL_INICIO } from '../../../utils/access.js';

import './MigasDePan.css';

// "Inicio › Página actual"; Inicio lleva a la vista principal del rol.
export default function MigasDePan({ actual }) {
  const { currentRole } = useAuth();
  return (
    <nav className="migas" aria-label="Migas de pan">
      <Link to={ROL_INICIO[currentRole] ?? '/'}>Inicio</Link>
      <span aria-hidden="true">›</span>
      <strong>{actual}</strong>
    </nav>
  );
}
