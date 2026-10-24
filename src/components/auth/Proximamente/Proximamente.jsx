import { Construction } from 'lucide-react';
import { usePageTitle } from '../../../hooks/usePageTitle';
import { EmptyState } from '../../common';

// Vista provisional de una ruta que pertenece a otra historia de usuario.
// La ruta y su protección por rol ya existen: cada integrante reemplaza este componente en main.jsx.
export default function Proximamente({ titulo, historia }) {
  usePageTitle(titulo);
  return (
    <div className="pagina">
      <h1 className="pagina__titulo">{titulo}</h1>
      <EmptyState icon={Construction} title="Vista en construcción" description={`Esta pantalla corresponde a la ${historia}. La ruta ya está protegida por rol y lista para conectarla.`} />
    </div>
  );
}
