import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

/**
 * Componente común: Panel lateral fijo para LOCAL y ADMINISTRADOR
 * Fiel al Mockup de Alta Fidelidad (5.1 a 5.5):
 * - Fondo cálido #FFFBF8, borde derecho #EFE2DC.
 * - Ítem activo con fondo #FCEAE7 y texto #D6402F.
 * - Contadores en vivo para Bandeja del día y Agotados del día.
 */
export function Sidebar({ currentSection, onSectionChange }) {
  const { currentRole, currentUser } = useAuth();
  const { pedidos, productos } = useData();

  if (currentRole !== 'local' && currentRole !== 'administrador') {
    return null;
  }

  const activeLocalId = currentUser?.localId || 'loc-central';

  // Contar pedidos activos en cola (recibidos + en_preparacion + listos no vencidos)
  const pedidosLocal = pedidos.filter(p => p.localId === activeLocalId);
  const enColaCount = pedidosLocal.filter(
    p => !p.vencido && (p.estado === 'recibido' || p.estado === 'en_preparacion' || p.estado === 'listo')
  ).length;

  // Contar productos agotados del día
  const agotadosCount = productos.filter(
    pr => pr.localId === activeLocalId && pr.disponibilidad === 'agotado_dia'
  ).length;

  const localGroups = [
    {
      title: 'ATENCIÓN',
      items: [
        { id: 'bandeja', label: 'Bandeja del día', badge: enColaCount, badgeType: 'pill' },
        { id: 'entrega', label: 'Entrega contra código' },
        { id: 'resumen', label: 'Resumen del día' }
      ]
    },
    {
      title: 'CARTA',
      items: [
        { id: 'mi-carta', label: 'Mi carta' },
        { id: 'opciones', label: 'Opciones y agregados' },
        { id: 'agotados', label: 'Agotados del día', badge: agotadosCount, badgeType: 'text' }
      ]
    },
    {
      title: 'LOCAL',
      items: [
        { id: 'perfil', label: 'Perfil del local' },
        { id: 'horario', label: 'Horario de atención' },
        { id: 'resenas', label: 'Reseñas' }
      ]
    }
  ];

  const adminGroups = [
    {
      title: 'MÉTRICAS',
      items: [
        { id: 'admin-tablero', label: 'Tablero de ventas' },
        { id: 'admin-franjas', label: 'Ventas por producto y franja' }
      ]
    },
    {
      title: 'CUENTAS',
      items: [
        { id: 'admin-usuarios', label: 'Usuarios y locales' },
        { id: 'admin-bloqueos', label: 'Bloqueo de cuentas' }
      ]
    },
    {
      title: 'CONTENIDO',
      items: [
        { id: 'admin-rankings', label: 'Ranking y valoraciones' }
      ]
    }
  ];

  const groups = currentRole === 'local' ? localGroups : adminGroups;

  return (
    <aside
      style={{
        width: '240px',
        minWidth: '240px',
        backgroundColor: '#FFFBF8',
        borderRight: '1px solid var(--color-border)',
        color: 'var(--color-text)',
        minHeight: 'calc(100vh - 110px)',
        padding: '24px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px'
      }}
    >
      {groups.map((group, gIdx) => (
        <div
          key={gIdx}
          style={{
            paddingBottom: gIdx < groups.length - 1 ? '16px' : '0',
            borderBottom: gIdx < groups.length - 1 ? '1px solid var(--color-border)' : 'none'
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: '700',
              letterSpacing: '0.8px',
              color: 'var(--color-text-muted)',
              marginBottom: '8px',
              paddingLeft: '12px'
            }}
          >
            {group.title}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {group.items.map(item => {
              const isActive = currentSection === item.id || (item.id === 'bandeja' && currentSection === 'detalle-pedido');
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSectionChange(item.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: isActive ? 'var(--color-primary-soft)' : 'transparent',
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
                    fontFamily: 'var(--font-family-body)',
                    fontSize: '14px',
                    fontWeight: isActive ? '600' : '500',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{item.label}</span>

                  {item.badge !== undefined && item.badge > 0 && (
                    item.badgeType === 'pill' ? (
                      <span
                        style={{
                          backgroundColor: 'var(--color-primary)',
                          color: '#FFFFFF',
                          borderRadius: '999px',
                          minWidth: '22px',
                          height: '22px',
                          padding: '0 6px',
                          fontSize: '12px',
                          fontWeight: '700',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {item.badge}
                      </span>
                    ) : (
                      <span
                        style={{
                          color: 'var(--color-primary)',
                          fontSize: '13px',
                          fontWeight: '700'
                        }}
                      >
                        {item.badge}
                      </span>
                    )
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Acceso al catálogo de componentes comunes / prerrequisitos */}
      <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
        <button
          type="button"
          onClick={() => onSectionChange('prerrequisitos')}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px dashed var(--color-border)',
            backgroundColor: currentSection === 'prerrequisitos' ? 'var(--color-primary-soft)' : 'transparent',
            color: currentSection === 'prerrequisitos' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            fontSize: '12px',
            fontWeight: '500',
            textAlign: 'left',
            cursor: 'pointer'
          }}
        >
          ⚙️ Ver Prerrequisitos Base
        </button>
      </div>
    </aside>
  );
}
