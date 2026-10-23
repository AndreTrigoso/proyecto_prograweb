import { useAuth } from '../../../context/AuthContext';
import { usePageTitle } from '../../../hooks/usePageTitle';
import { ROL_INICIO } from '../../../utils/access.js';
import { SOPORTE_CORREO } from '../../../utils/constants.js';
import Boton from '../Boton/Boton.jsx';
import PantallaEstado from '../PantallaEstado/PantallaEstado.jsx';

const ZONAS = { local: 'al panel del local', administrador: 'al panel de administración', comensal: 'a la cuenta de un comensal' };

// 403: el usuario tiene sesión pero su rol no puede ver esta página.
export default function AccesoDenegado({ rolesRequeridos = [] }) {
  usePageTitle('Acceso denegado');
  const { currentRole } = useAuth();
  const zona = ZONAS[rolesRequeridos[0]] ?? 'a otro tipo de cuenta';

  return (
    <div className="centrado">
      <PantallaEstado
        icono="!"
        etiqueta="Error 403 · Acceso denegado"
        titulo="No tienes permiso para ver esta página"
        acciones={
          currentRole === 'comensal' ? (
            <>
              <Boton to="/locales">Ver locales abiertos</Boton>
              <Boton to="/mis-pedidos" variante="tertiary">Ir a mis pedidos</Boton>
            </>
          ) : (
            <Boton to={ROL_INICIO[currentRole] ?? '/'}>Ir a mi inicio</Boton>
          )
        }
      >
        Esta sección pertenece {zona}. Si crees que es un error, escribe a {SOPORTE_CORREO} indicando tu correo institucional.
      </PantallaEstado>
    </div>
  );
}
