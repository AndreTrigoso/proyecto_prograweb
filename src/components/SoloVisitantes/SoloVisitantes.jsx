import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROL_INICIO, puedeEntrar } from '../../utils/access.js';

/** Rutas de invitado (login, registro, recuperar): con sesión activa llevan a donde ibas o a la vista principal del rol. */
const SoloVisitantes = () => {
  const { isAuthenticated, currentRole } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Outlet />;
  const desde = location.state?.from;
  return <Navigate to={puedeEntrar(currentRole, desde) ? desde : ROL_INICIO[currentRole]} replace />;
};

export default SoloVisitantes;
