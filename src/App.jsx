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
import PerfilLocal from './hu2/PerfilLocal';
import HorarioLocal from './hu2/HorarioLocal';
import MiCarta from './hu2/MiCarta';
import DisponibilidadLocal from './hu2/DisponibilidadLocal';
import GestionOpciones from './hu2/GestionOpciones';

function MainLayout() {
  const { currentRole } = useAuth();

  const [activeComensalTab, setActiveComensalTab] =
    useState('locales');

  const [activeSidebarSection, setActiveSidebarSection] =
    useState('bandeja');

  const [notification, setNotification] = useState(null);

  const showToast = (toastData) => {
    setNotification(toastData);

    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const isSidebarLayout =
    currentRole === 'local' ||
    currentRole === 'administrador';
  
  function renderMainContent() {
    if (currentRole === 'local') {
      switch (activeSidebarSection) {
        case 'mi-carta':
          return <MiCarta />;

        case 'opciones':
          return <GestionOpciones />;

        case 'agotados':
          return <DisponibilidadLocal />;

        case 'perfil':
          return <PerfilLocal />;

        case 'horario':
          return <HorarioLocal />;

        default:
          break;
      }
    }

    return (
      <PrerequisitesShowcase
        onShowNotification={showToast}
      />
    );
  }

  return (
    <div className="app-container">
      <Header
        activeTab={activeComensalTab}
        setActiveTab={setActiveComensalTab}
        onShowNotification={showToast}
        onOpenAuthModal={(type) => {
          showToast({
            type: 'info',
            title: `Modal de ${
              type === 'login'
                ? 'Inicio de Sesión'
                : 'Registro'
            }`,
            message:
              'HU-1 conectará aquí el flujo con validaciones de campos.'
          });
        }}
      />

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
            padding: isSidebarLayout
              ? 'var(--space-6) var(--space-8)'
              : 'var(--space-6) 0'
          }}
        >
          <div
            className={
              isSidebarLayout ? '' : 'contenedor'
            }
          >
            {renderMainContent()}
          </div>
        </main>
      </div>

      <CartDrawer
        onCheckout={() => {
          showToast({
            type: 'success',
            title: 'Confirmación de Pedido (HU-4)',
            message:
              'Redirigiendo a selección de franja de recojo y generación de código PED-XXXX.'
          });
        }}
      />

      <NotificationToast
        notification={notification}
        onClose={() => setNotification(null)}
      />

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
