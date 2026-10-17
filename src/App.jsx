import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { DataProvider } from './context/DataContext';
import {
  Header,
  ComensalTabs,
  Sidebar,
  CartDrawer,
  Footer,
  NotificationToast
} from './components/common';
import { PrerequisitesShowcase } from './components/dev/PrerequisitesShowcase';

function MainLayout() {
  const { currentRole } = useAuth();
  const [activeComensalTab, setActiveComensalTab] = useState('locales');
  const [activeSidebarSection, setActiveSidebarSection] = useState('bandeja');
  const [notification, setNotification] = useState(null);

  const showToast = (toastData) => {
    setNotification(toastData);
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const isSidebarLayout = currentRole === 'local' || currentRole === 'administrador';

  return (
    <div className="app-container">
      {/* Cabecera Adaptativa */}
      <Header
        activeTab={activeComensalTab}
        setActiveTab={setActiveComensalTab}
        onShowNotification={showToast}
        onOpenAuthModal={(type) => {
          showToast({
            type: 'info',
            title: `Modal de ${type === 'login' ? 'Inicio de Sesión' : 'Registro'}`,
            message: 'HU-1 conectará aquí el flujo con validaciones de campos.'
          });
        }}
      />

      {/* Pestañas de Comensal si el rol es Comensal */}
      {currentRole === 'comensal' && (
        <ComensalTabs
          activeTab={activeComensalTab}
          onTabChange={setActiveComensalTab}
          breadcrumbs={[
            { label: 'Campus Monterrico' },
            {
              label:
                activeComensalTab === 'locales'
                  ? 'Cafeterías y concesionarios'
                  : activeComensalTab === 'pedidos'
                  ? 'Mis pedidos en curso'
                  : 'Calificaciones y reseñas'
            }
          ]}
        />
      )}

      {/* Cuerpo principal con layout adaptable */}
      <div style={{ display: 'flex', flex: 1 }}>
        {isSidebarLayout && (
          <Sidebar
            currentSection={activeSidebarSection}
            onSectionChange={setActiveSidebarSection}
          />
        )}

        <main
          className="main-content"
          style={{
            flex: 1,
            padding: isSidebarLayout ? 'var(--space-6) var(--space-8)' : 'var(--space-6) 0'
          }}
        >
          <div className={isSidebarLayout ? '' : 'contenedor'}>
            <PrerequisitesShowcase onShowNotification={showToast} />
          </div>
        </main>
      </div>

      {/* Carrito deslizante y modal de conflicto */}
      <CartDrawer
        onCheckout={() => {
          showToast({
            type: 'success',
            title: 'Confirmación de Pedido (HU-4)',
            message: 'Redirigiendo a selección de franja de recojo y generación de código PED-XXXX.'
          });
        }}
      />

      {/* Notificación Toast para feedback de operaciones */}
      <NotificationToast
        notification={notification}
        onClose={() => setNotification(null)}
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
          <MainLayout />
        </CartProvider>
      </DataProvider>
    </AuthProvider>
  );
}
