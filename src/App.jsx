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
  NotificationToast,
  EmptyState
} from './components/common';
import PaginaBandejaDia from './pages/PaginaBandejaDia';
import PaginaDetallePedido from './pages/PaginaDetallePedido';
import PaginaEntregaCodigo from './pages/PaginaEntregaCodigo';
import PaginaResumenDia from './pages/PaginaResumenDia';
import { PrerequisitesShowcase } from './components/dev/PrerequisitesShowcase';

function MainLayout() {
  const { currentRole } = useAuth();
  const [activeComensalTab, setActiveComensalTab] = useState('locales');
  const [activeSidebarSection, setActiveSidebarSection] = useState('bandeja');
  const [selectedPedidoId, setSelectedPedidoId] = useState('ped-4821');
  const [notification, setNotification] = useState(null);

  const showToast = (toastData) => {
    setNotification(toastData);
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const isSidebarLayout = currentRole === 'local' || currentRole === 'administrador';

  const handleOpenDetallePedido = (pedido) => {
    if (pedido && pedido.id) {
      setSelectedPedidoId(pedido.id);
      setActiveSidebarSection('detalle-pedido');
    }
  };

  const renderLocalContent = () => {
    switch (activeSidebarSection) {
      case 'bandeja':
        return (
          <PaginaBandejaDia
            onSelectPedido={handleOpenDetallePedido}
            onNavigateEntregaCodigo={() => setActiveSidebarSection('entrega')}
            onNavigateMiCarta={() => setActiveSidebarSection('mi-carta')}
            onShowNotification={showToast}
          />
        );
      case 'detalle-pedido':
        return (
          <PaginaDetallePedido
            pedidoId={selectedPedidoId}
            onBack={() => setActiveSidebarSection('bandeja')}
            onShowNotification={showToast}
          />
        );
      case 'entrega':
        return (
          <PaginaEntregaCodigo
            onSelectPedido={handleOpenDetallePedido}
            onShowNotification={showToast}
          />
        );
      case 'resumen':
        return (
          <PaginaResumenDia
            onSelectPedido={handleOpenDetallePedido}
            onShowNotification={showToast}
          />
        );
      case 'prerrequisitos':
        return <PrerequisitesShowcase onShowNotification={showToast} />;
      default:
        return (
          <div style={{ maxWidth: '640px', margin: '32px auto' }}>
            <EmptyState
              title={`Sección: ${activeSidebarSection.toUpperCase()} (Corresponde a HU-2 / HU-6)`}
              description="Esta vista forma parte de las historias asignadas a otros integrantes del equipo (HU-2: Local y carta / HU-6: Valoraciones). Las vistas completas de la Historia 5 se encuentran bajo el grupo ATENCIÓN."
              actionText="Volver a Bandeja del día (HU-5)"
              onAction={() => setActiveSidebarSection('bandeja')}
            />
          </div>
        );
    }
  };

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
            onSectionChange={(sec) => setActiveSidebarSection(sec)}
          />
        )}

        <main
          className="main-content"
          style={{
            flex: 1,
            padding: isSidebarLayout ? '28px 36px' : 'var(--space-6) 0',
            overflowX: 'hidden'
          }}
        >
          {currentRole === 'local' ? (
            renderLocalContent()
          ) : (
            <div className={isSidebarLayout ? '' : 'contenedor'}>
              <PrerequisitesShowcase onShowNotification={showToast} />
            </div>
          )}
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
