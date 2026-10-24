import { useAuth } from '../../../context/AuthContext';
import { usePageTitle } from '../../../hooks/usePageTitle';
import { ROL_INICIO } from '../../../utils/access.js';
import Boton from '../Boton/Boton.jsx';
import PantallaEstado from '../PantallaEstado/PantallaEstado.jsx';

// 404: la ruta no existe (enlace caducado, producto retirado de la carta...).
export default function NoEncontrada() {
  usePageTitle('Página no encontrada');
  const { currentRole } = useAuth();

  return (
    <div className="centrado">
      <PantallaEstado
        icono="?"
        etiqueta="Error 404 · Página no encontrada"
        titulo="No encontramos esta página"
        acciones={
          <>
            <Boton to={ROL_INICIO[currentRole] ?? '/'}>Ir al inicio</Boton>
            {(currentRole === 'visitante' || currentRole === 'comensal') && <Boton to="/locales" variante="tertiary">Buscar un local</Boton>}
          </>
        }
      >
        El enlace pudo cambiar o el producto ya no está en la carta del local. Busca en el directorio o vuelve al inicio.
      </PantallaEstado>
    </div>
  );
}
