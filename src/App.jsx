import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { DataProvider } from './context/DataContext';
import { ToastProvider, useToast } from './context/ToastContext';
import {
  Header,
  ComensalTabs,
  Sidebar,
  CartDrawer,
  Footer
} from './components/common';


const RUTAS_PESTANAS = {
  locales: '/locales',
  pedidos: '/mis-pedidos',
  calificaciones: '/mis-calificaciones',
  cuenta: '/cuenta'
};

const pestanaDeRuta = (pathname) =>
  Object.keys(RUTAS_PESTANAS).find((id) => pathname === RUTAS_PESTANAS[id] || pathname.startsWith(`${RUTAS_PESTANAS[id]}/`));

// Las secciones del Sidebar de administrador llevan el prefijo "admin-" (ej. admin-tablero -> /admin/tablero).
const rutaDeSeccion = (role, id) =>
  id === 'prerrequisitos' ? '/prerrequisitos' : role === 'administrador' ? `/admin/${id.replace('admin-', '')}` : `/local/${id}`;

const seccionDeRuta = (pathname) => {
  const [, zona, seccion] = pathname.split('/');
  return zona === 'admin' ? `admin-${seccion}` : zona === 'local' ? seccion : zona;
};

function MainLayout() {
  const { currentRole } = useAuth();
  const { notify: showToast } = useToast();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const activeComensalTab = pestanaDeRuta(pathname) || 'locales';

  const isSidebarLayout = currentRole === 'local' || currentRole === 'administrador';

  return (
    <div className="app-container">
      {/* Cabecera Adaptativa */}
      <Header
        activeTab={activeComensalTab}
        setActiveTab={(id) => navigate(id === 'como-funciona' ? '/#como-funciona' : RUTAS_PESTANAS[id] || '/locales')}
        onShowNotification={showToast}
        onOpenAccount={() => navigate('/cuenta')}
        onOpenAuthModal={(type) => navigate(type === 'login' ? '/login' : '/registro')}
      />

      {/* Pestañas de Comensal si el rol es Comensal */}
      {currentRole === 'comensal' && (
        <ComensalTabs
          activeTab={activeComensalTab}
          onTabChange={(id) => navigate(RUTAS_PESTANAS[id])}
          breadcrumbs={
            // Las vistas de HU-3 (carta, producto, carrito) y HU-4 (pedidos) muestran sus propias migas de pan
            activeComensalTab === 'cuenta' || activeComensalTab === 'pedidos' || pathname.startsWith('/locales/') || pathname === '/carrito' || pathname.startsWith('/pedido/')
              ? []
              : [
                  { label: 'Campus Monterrico' },
                  {
                    label:
                      activeComensalTab === 'locales'
                        ? 'Cafeterías y concesionarios'
                        : activeComensalTab === 'pedidos'
                        ? 'Mis pedidos en curso'
                        : 'Calificaciones y reseñas'
                  }
                ]
          }
        />
      )}

      {/* Cuerpo principal con layout adaptable */}
      <div style={{ display: 'flex', flex: 1 }}>
        {isSidebarLayout && (
          <Sidebar
            currentSection={seccionDeRuta(pathname)}
            onSectionChange={(id) => navigate(rutaDeSeccion(currentRole, id))}
          />
        )}

        <main
          className="main-content"
          style={{
            flex: 1,
            padding: isSidebarLayout ? 'var(--space-6) var(--space-8)' : 0
          }}
        >
          {/* Cada pantalla maneja su propio ancho para poder usar fondos a sangre */}
          <Outlet />
        </main>
      </div>

      {/* Carrito deslizante y modal de conflicto */}
      <CartDrawer
        onCheckout={() => navigate('/carrito')} // HU-3: el carrito completo (3.4) revisa disponibilidad antes de pasar a HU-4
      />

      {/* Pie de página oficial */}
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <CartProvider>
          <ToastProvider>
            <MainLayout />
          </ToastProvider>
        </CartProvider>
      </DataProvider>
    </AuthProvider>
  );
}