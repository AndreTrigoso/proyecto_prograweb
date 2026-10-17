import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Store, Clock, Star, ChevronRight } from 'lucide-react';

/**
 * Componente común: Navegación para COMENSAL
 * Cumple especificación del Mockup (Tema 8):
 * - Barra de pestañas: «Locales · Mis pedidos · Mis calificaciones».
 * - Soporte para migas de pan (breadcrumbs) dentro de cada pestaña.
 */
export function ComensalTabs({ activeTab, onTabChange, breadcrumbs = [] }) {
  const tabs = [
    { id: 'locales', label: 'Locales del campus', icon: Store },
    { id: 'pedidos', label: 'Mis pedidos', icon: Clock },
    { id: 'calificaciones', label: 'Mis calificaciones', icon: Star }
  ];

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        paddingTop: 'var(--space-2)'
      }}
    >
      <div className="contenedor">
        {/* Migas de pan si se encuentran en sub-vistas (ej. carta o detalle de producto) */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: 'var(--color-text-muted)',
              paddingBottom: 'var(--space-2)'
            }}
          >
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight size={12} />}
                {crumb.onClick ? (
                  <button
                    type="button"
                    onClick={crumb.onClick}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-primary)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      padding: 0
                    }}
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span style={{ color: idx === breadcrumbs.length - 1 ? 'var(--color-text)' : 'inherit', fontWeight: idx === breadcrumbs.length - 1 ? '600' : '400' }}>
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        {/* Barra de pestañas de primer nivel */}
        <div style={{ display: 'flex', gap: 'var(--space-6)' }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: 'var(--space-3) 0',
                  background: 'none',
                  border: 'none',
                  borderBottom: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '15px',
                  fontWeight: isActive ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
