import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import AccesoDenegado from '../AccesoDenegado/AccesoDenegado.jsx';

/** Rutas privadas: sin sesión → /login (recordando adónde ibas); rol equivocado → 403 en la misma URL. */
const RutaProtegida = ({ roles }) => {
  const { isAuthenticated, currentRole } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (roles && !roles.includes(currentRole)) return <AccesoDenegado rolesRequeridos={roles} />;
  return <Outlet />;
};

export default RutaProtegida;
