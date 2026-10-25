import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { useToast } from './context/ToastContext';
import { PrerequisitesShowcase } from './components/dev/PrerequisitesShowcase';
import RutaProtegida from './components/auth/RutaProtegida/RutaProtegida.jsx';
import SoloVisitantes from './components/auth/SoloVisitantes/SoloVisitantes.jsx';
import PaginaInicio from './pages/PaginaInicio.jsx';
import PaginaIniciarSesion from './pages/PaginaIniciarSesion.jsx';
import PaginaRegistroComensal from './pages/PaginaRegistroComensal.jsx';
import PaginaRegistroLocal from './pages/PaginaRegistroLocal.jsx';
import PaginaRecuperarContrasena from './pages/PaginaRecuperarContrasena.jsx';
import PaginaNuevaContrasena from './pages/PaginaNuevaContrasena.jsx';
import PaginaMiCuenta from './pages/PaginaMiCuenta.jsx';
import PaginaAccesoDenegado from './pages/PaginaAccesoDenegado.jsx';
import PaginaNoEncontrada from './pages/PaginaNoEncontrada.jsx';
import PaginaProximamente from './pages/PaginaProximamente.jsx';
import PaginaMiCarta from './pages/PaginaMiCarta.jsx';
import PaginaOpcionesLocal from './pages/PaginaOpcionesLocal.jsx';
import PaginaDisponibilidadLocal from './pages/PaginaDisponibilidadLocal.jsx';
import PaginaPerfilLocal from './pages/PaginaPerfilLocal.jsx';
import PaginaHorarioLocal from './pages/PaginaHorarioLocal.jsx';
import PaginaLocales from './pages/PaginaLocales.jsx';
import PaginaCartaLocal from './pages/PaginaCartaLocal.jsx';
import PaginaDetalleProducto from './pages/PaginaDetalleProducto.jsx';
import PaginaCarrito from './pages/PaginaCarrito.jsx';
import PaginaConfirmarPedido from './pages/PaginaConfirmarPedido.jsx';
import PaginaPedidoConfirmado from './pages/PaginaPedidoConfirmado.jsx';
import PaginaMisPedidos from './pages/PaginaMisPedidos.jsx';
import PaginaDetalleMiPedido from './pages/PaginaDetalleMiPedido.jsx';
import './styles/compartido.css';


// Rutas que pertenecen a otras historias: ya existen (con su protección por rol) para que la navegación funcione.
// Cada integrante reemplaza el elemento de su ruta por su pantalla real.
const proximamente = (path, titulo, historia) => ({
  path,
  element: <PaginaProximamente titulo={titulo} historia={historia} />
});

// Catálogo de componentes comunes (apoyo del equipo), ahora accesible por ruta.
const Prerrequisitos = () => {
  const { notify } = useToast();
  return (
    <div className="contenedor">
      <PrerequisitesShowcase onShowNotification={notify} />
    </div>
  );
};

const router = createBrowserRouter([
  {
    // App dibuja la cabecera, la navegación y el pie según el rol; las pantallas cuelgan de su <Outlet />
    element: <App />,
    children: [
      { index: true, element: <PaginaInicio /> },

      // Solo visitantes: con sesión iniciada llevan a la vista principal del rol
      {
        element: <SoloVisitantes />,
        children: [
          { path: 'login', element: <PaginaIniciarSesion /> },
          { path: 'registro', element: <PaginaRegistroComensal /> },
          { path: 'registro-local', element: <PaginaRegistroLocal /> },
          { path: 'recuperar', element: <PaginaRecuperarContrasena /> },
          { path: 'recuperar/nueva', element: <PaginaNuevaContrasena /> }
        ]
      },

      // Públicas
      // HU-3 · Catálogo (el visitante ve locales y cartas en modo lectura)
      { path: 'locales', element: <PaginaLocales /> },
      { path: 'locales/:localId', element: <PaginaCartaLocal /> },
      { path: 'locales/:localId/productos/:productoId', element: <PaginaDetalleProducto /> },
      { path: 'prerrequisitos', element: <Prerrequisitos /> },

      // Cualquier rol autenticado
      {
        element: <RutaProtegida />,
        children: [{ path: 'cuenta', element: <PaginaMiCuenta /> }]
      },

      // Comensal
      {
        element: <RutaProtegida roles={['comensal']} />,
        children: [
          { path: 'carrito', element: <PaginaCarrito /> }, // HU-3
          { path: 'pedido/confirmar', element: <PaginaConfirmarPedido /> }, // HU-4 · 4.1
          { path: 'mis-pedidos', element: <PaginaMisPedidos /> }, // HU-4 · 4.3
          { path: 'mis-pedidos/:pedidoId', element: <PaginaDetalleMiPedido /> }, // HU-4 · 4.4 y 4.5
          { path: 'mis-pedidos/:pedidoId/confirmado', element: <PaginaPedidoConfirmado /> }, // HU-4 · 4.2
          proximamente('mis-calificaciones', 'Mis calificaciones', 'HU-6 (Valoraciones)')
        ]
      },

      // Local (los ids coinciden con las secciones del Sidebar)
      {
        element: <RutaProtegida roles={['local']} />,
        children: [
          { path: 'local', element: <Navigate to="/local/bandeja" replace /> },
          proximamente('local/bandeja', 'Bandeja del día', 'HU-5 (Bandeja del local)'),
          proximamente('local/entrega', 'Entrega contra código', 'HU-5 (Bandeja del local)'),
          proximamente('local/resumen', 'Resumen del día', 'HU-5 (Bandeja del local)'),
          { path: 'local/mi-carta', element: <PaginaMiCarta /> },
          { path: 'local/opciones', element: <PaginaOpcionesLocal /> },
          { path: 'local/agotados', element: <PaginaDisponibilidadLocal /> },
          { path: 'local/perfil', element: <PaginaPerfilLocal /> },
          { path: 'local/horario', element: <PaginaHorarioLocal /> },
          proximamente('local/resenas', 'Reseñas', 'HU-6 (Valoraciones)')
        ]
      },

      // Administrador
      {
        element: <RutaProtegida roles={['administrador']} />,
        children: [
          { path: 'admin', element: <Navigate to="/admin/tablero" replace /> },
          proximamente('admin/tablero', 'Tablero de ventas', 'HU-7 (Métricas y usuarios)'),
          proximamente('admin/franjas', 'Ventas por producto y franja', 'HU-7 (Métricas y usuarios)'),
          proximamente('admin/usuarios', 'Usuarios y locales', 'HU-7 (Métricas y usuarios)'),
          proximamente('admin/bloqueos', 'Bloqueo de cuentas', 'HU-7 (Métricas y usuarios)'),
          proximamente('admin/rankings', 'Ranking y valoraciones', 'HU-6 (Valoraciones)')
        ]
      },

      { path: '403', element: <PaginaAccesoDenegado /> },
      { path: '*', element: <PaginaNoEncontrada /> }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);