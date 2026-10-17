import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useData } from '../../context/DataContext';
import { pedidosService, localesService } from '../../services/storageService';
import {
  StatusBadge,
  ProductCard,
  CartSummary,
  ConfirmModal,
  EmptyState,
  NotificationToast
} from '../common';
import {
  CheckCircle,
  FileText,
  Database,
  Layers,
  Palette,
  Users,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';

export function PrerequisitesShowcase({ onShowNotification }) {
  const { currentRole, currentUser, switchRole } = useAuth();
  const { items, addItem, totalItemsCount } = useCart();
  const { locales, productos, pedidos, resetToSeeds } = useData();

  // Estados para pruebas interactivas de modales
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    isDestructive: false,
    requiresReason: false,
    onConfirm: () => {}
  });

  const [activeTab, setActiveTab] = useState('resumen');

  const handleTestModal = (type) => {
    if (type === 'cancelar') {
      setModalConfig({
        isOpen: true,
        title: '¿Deseas cancelar tu pedido?',
        message: 'Esta acción cancelará tu pedido PED-4712. Estás dentro de la ventana permitida (15 minutos antes de la hora de recojo).',
        isDestructive: true,
        requiresReason: true,
        reasonPlaceholder: 'Ingresa el motivo de cancelación (ej. cruce de clases)...',
        onConfirm: (reason) => {
          setModalConfig(prev => ({ ...prev, isOpen: false }));
          if (onShowNotification) {
            onShowNotification({
              type: 'danger',
              title: 'Pedido cancelado',
              message: `Tu pedido ha sido cancelado. Motivo registrado: "${reason}"`
            });
          }
        }
      });
    } else if (type === 'rechazar') {
      setModalConfig({
        isOpen: true,
        title: 'Rechazar pedido entrante',
        message: 'El pedido PED-4790 no podrá ser preparado. Debes registrar un motivo que será visible para el comensal.',
        isDestructive: true,
        requiresReason: true,
        reasonPlaceholder: 'Motivo obligatorio (ej. Se agotó el stock del menú ejecutivo)...',
        onConfirm: (reason) => {
          setModalConfig(prev => ({ ...prev, isOpen: false }));
          if (onShowNotification) {
            onShowNotification({
              type: 'danger',
              title: 'Pedido rechazado',
              message: `Pedido rechazado. Motivo comunicado: "${reason}"`
            });
          }
        }
      });
    } else {
      setModalConfig({
        isOpen: true,
        title: 'Confirmar acción',
        message: '¿Estás seguro de continuar con esta operación en el sistema?',
        isDestructive: false,
        requiresReason: false,
        onConfirm: () => {
          setModalConfig(prev => ({ ...prev, isOpen: false }));
          if (onShowNotification) {
            onShowNotification({
              type: 'success',
              title: 'Operación confirmada',
              message: 'La acción fue procesada exitosamente.'
            });
          }
        }
      });
    }
  };

  const handleQuickAdd = (prod) => {
    const success = addItem(prod, 1, [], '');
    if (success && onShowNotification) {
      onShowNotification({
        type: 'success',
        title: 'Producto añadido',
        message: `${prod.nombre} fue agregado a tu carrito.`
      });
    }
  };

  return (
    <div style={{ padding: 'var(--space-6) 0' }}>
      {/* Banner de Verificación de Prerrequisitos */}
      <div
        className="card"
        style={{
          padding: 'var(--space-6)',
          backgroundColor: '#FFFFFF',
          borderLeft: '5px solid var(--color-success)',
          marginBottom: 'var(--space-8)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-success)', marginBottom: '4px' }}>
              <CheckCircle size={22} />
              <span style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Prerrequisitos Técnicos Completados
              </span>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-text)' }}>
              Entorno Base del Proyecto · Programación Web 2026-2
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '4px', maxWidth: '780px' }}>
              Se ha configurado la infraestructura compartida exigida en la <strong>Sección 9</strong> del documento descriptivo (*"Cómo evitar bloquearse entre ustedes"*): Contrato de Datos, Datos Semilla completos, Repositorio limpio y los 6 Componentes Comunes compartidos.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-tertiary btn-sm"
              onClick={() => {
                resetToSeeds();
                if (onShowNotification) {
                  onShowNotification({
                    type: 'info',
                    title: 'Semillas restablecidas',
                    message: 'Los datos en localStorage han sido reiniciados a los valores iniciales del PDF.'
                  });
                }
              }}
              title="Restablecer localStorage con los datos semilla del JSON"
            >
              <RotateCcw size={15} />
              Restablecer semillas
            </button>
          </div>
        </div>

        {/* Indicadores de Prerrequisitos */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 'var(--space-4)',
            marginTop: 'var(--space-6)',
            paddingTop: 'var(--space-6)',
            borderTop: '1px solid var(--color-border)'
          }}
        >
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ color: 'var(--color-primary)' }}><FileText size={24} /></div>
            <div>
              <strong style={{ fontSize: '14px', display: 'block' }}>1. Contrato de Datos</strong>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                `CONTRATO_DATOS.md` con 5 entidades compartidas y validaciones.
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ color: 'var(--color-accent)' }}><Database size={24} /></div>
            <div>
              <strong style={{ fontSize: '14px', display: 'block' }}>2. Datos Semilla</strong>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                `datos-semilla.json` con {locales.length} locales, {productos.length} productos y {pedidos.length} pedidos.
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ color: 'var(--color-info)' }}><Layers size={24} /></div>
            <div>
              <strong style={{ fontSize: '14px', display: 'block' }}>3. Componentes Comunes</strong>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Header, Sidebar (280px), Tabs, Badges, Tarjetas, Carrito y Modales.
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ color: 'var(--color-warning)' }}><Palette size={24} /></div>
            <div>
              <strong style={{ fontSize: '14px', display: 'block' }}>4. Sistema de Diseño</strong>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Tokens exactos del PDF: Poppins/Inter, rojo #D6402F, verde #5B9B2E.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pestañas de Navegación del Panel de Demostración */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: 'var(--space-6)', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
        {[
          { id: 'resumen', label: '1. Catálogo & Tarjetas de Producto' },
          { id: 'badges', label: '2. Badges de Estado & Chips' },
          { id: 'modales', label: '3. Diálogos de Confirmación' },
          { id: 'historias', label: '4. Distribución de Historias (HU-1 a HU-7)' }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: activeTab === tab.id ? 'var(--color-primary)' : 'transparent',
              color: activeTab === tab.id ? '#FFFFFF' : 'var(--color-text)',
              fontWeight: activeTab === tab.id ? '600' : '500',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SECCIÓN 1: Tarjetas de Producto con el Sistema de Diseño */}
      {activeTab === 'resumen' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '600' }}>Tarjetas de Producto Compartidas</h3>
              <p style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
                Fotos a sangre, tipografía Poppins 600 para precios, bordes de 16px y atenuación al 50% en productos agotados del día.
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 'var(--space-6)'
            }}
          >
            {productos.slice(0, 4).map(prod => (
              <ProductCard
                key={prod.id}
                producto={prod}
                onAddToCart={() => handleQuickAdd(prod)}
                onOpenDetails={() => {
                  if (onShowNotification) {
                    onShowNotification({
                      type: 'info',
                      title: prod.nombre,
                      message: `Abriendo vista de detalle y opciones configurables de este ítem.`
                    });
                  }
                }}
              />
            ))}
          </div>

          {/* Muestra de Estado Vacío */}
          <div style={{ marginTop: 'var(--space-8)' }}>
            <h4 style={{ fontSize: '16px', marginBottom: '8px' }}>Demostración del Componente EmptyState:</h4>
            <EmptyState
              title="No hay más productos en esta categoría"
              description="La cafetería seleccionada no cuenta con más platos registrados en esta sección por el momento."
              actionText="Ver toda la carta"
              onAction={() => {
                if (onShowNotification) {
                  onShowNotification({ type: 'info', message: 'Filtro reiniciado a toda la carta.' });
                }
              }}
            />
          </div>
        </div>
      )}

      {/* SECCIÓN 2: Badges de Estado */}
      {activeTab === 'badges' && (
        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <h3 style={{ fontSize: '20px', marginBottom: 'var(--space-2)' }}>Etiquetas de Estado (StatusBadges)</h3>
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)' }}>
            Estandarizados con radio 999px (chip), combinación de color y texto, e icono de estado circular según la guía visual del Mockup.
          </p>

          <div style={{ marginBottom: 'var(--space-6)' }}>
            <h4 style={{ fontSize: '14px', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
              Estados de Pedidos (HU-4 y HU-5):
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <StatusBadge status="recibido" type="pedido" />
              <StatusBadge status="en_preparacion" type="pedido" />
              <StatusBadge status="listo" type="pedido" />
              <StatusBadge status="entregado" type="pedido" />
              <StatusBadge status="cancelado" type="pedido" />
              <StatusBadge status="rechazado" type="pedido" />
              <StatusBadge status="vencido" type="pedido" />
            </div>
          </div>

          <div style={{ marginBottom: 'var(--space-6)' }}>
            <h4 style={{ fontSize: '14px', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
              Estados de Locales (HU-2 y HU-3):
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <StatusBadge status="abierto" type="local" />
              <StatusBadge status="suspendido" type="local" />
              <StatusBadge status="cerrado" type="local" />
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '14px', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
              Disponibilidad de Productos (HU-2 y HU-3):
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <StatusBadge status="disponible" type="producto" />
              <StatusBadge status="agotado_dia" type="producto" />
              <StatusBadge status="retirado" type="producto" />
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN 3: Modales de Confirmación */}
      {activeTab === 'modales' && (
        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <h3 style={{ fontSize: '20px', marginBottom: 'var(--space-2)' }}>Diálogos Modales de Confirmación</h3>
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)' }}>
            Cumplen el requerimiento no funcional: *"Toda acción destructiva pide confirmación"* y permiten capturar motivos obligatorios para rechazos de pedido o cancelaciones.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleTestModal('cancelar')}
            >
              Probar: Modal Cancelar Pedido (Comensal)
            </button>

            <button
              type="button"
              className="btn btn-danger"
              onClick={() => handleTestModal('rechazar')}
            >
              Probar: Modal Rechazar Pedido c/ Motivo (Local)
            </button>

            <button
              type="button"
              className="btn btn-tertiary"
              onClick={() => handleTestModal('general')}
            >
              Probar: Confirmación General
            </button>
          </div>
        </div>
      )}

      {/* SECCIÓN 4: Historias de Usuario Asignables */}
      {activeTab === 'historias' && (
        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <h3 style={{ fontSize: '20px', marginBottom: 'var(--space-2)' }}>
            Historias Funcionales (Sección 5 y 6 del PDF)
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)' }}>
            Cada integrante escoge una historia completa y es dueño de sus vistas, servicios y acceso a datos sin bloquearse:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { id: 'HU-1', rol: 'Visitante / Comensal', name: 'Cuenta y acceso', desc: 'Registro de comensal y local, validaciones, inicio y cierre de sesión, protección de rutas y recuperación de contraseña.' },
              { id: 'HU-2', rol: 'Local', name: 'Local y carta', desc: 'Perfil del local, horario por día, categorías, productos, opciones/agregados, disponibilidad y estado del local.' },
              { id: 'HU-3', rol: 'Comensal', name: 'Catálogo y carrito', desc: 'Listado de locales abiertos, carta con filtros y búsqueda, detalle con agregados, carrito con subtotal y validación de único local.' },
              { id: 'HU-4', rol: 'Comensal', name: 'Pedidos', desc: 'Confirmación de hora de recojo, código PED-XXXX, "Mis pedidos", avance, cancelación permitida y repetición de pedidos.' },
              { id: 'HU-5', rol: 'Local', name: 'Bandeja del local', desc: 'Pedidos entrantes por hora de recojo, cambio de estado (recibido -> preparación -> listo -> entregado), rechazo c/ motivo, entrega contra código y resumen del día.' },
              { id: 'HU-6', rol: 'Comensal / Admin', name: 'Valoraciones (complementaria)', desc: 'Calificación de pedidos y productos consumidos, promedios, distribución en barras y ranking de locales.' },
              { id: 'HU-7', rol: 'Administrador', name: 'Métricas y usuarios (complementaria)', desc: 'Tablero de ventas, gráficos por franja horaria, gestión de comensales y locales, bloqueo/desbloqueo de cuentas.' }
            ].map(hu => (
              <div
                key={hu.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#FAF5F1',
                  border: '1px solid var(--color-border)',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ color: 'var(--color-primary)', fontSize: '15px' }}>{hu.id}: {hu.name}</strong>
                    <span style={{ fontSize: '11px', backgroundColor: '#EFE2DC', padding: '2px 8px', borderRadius: 'var(--radius-chip)', fontWeight: '600' }}>
                      {hu.rol}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    {hu.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de confirmación interactivo */}
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        isDestructive={modalConfig.isDestructive}
        requiresReason={modalConfig.requiresReason}
        reasonPlaceholder={modalConfig.reasonPlaceholder}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
