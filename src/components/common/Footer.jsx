import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

/**
 * Componente común: Pie de página
 * Cumple especificación del Mockup (Tema 8):
 * - Visitante y Comensal: Pie completo con enlaces institucionales y contacto.
 * - Local y Administrador: Barra de soporte clara de una línea.
 */
export function Footer() {
  const { currentRole, currentUser } = useAuth();
  const { locales } = useData();
  const isMinimal = currentRole === 'local' || currentRole === 'administrador';

  const activeLocal = currentRole === 'local'
    ? (locales.find(l => l.id === currentUser?.localId) || locales[0])
    : null;

  if (isMinimal) {
    return (
      <footer
        style={{
          backgroundColor: '#FFFBF8',
          borderTop: '1px solid var(--color-border)',
          color: 'var(--color-text-muted)',
          padding: '14px 24px',
          fontSize: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span>Campus Pide · {currentRole === 'local' ? 'panel del local' : 'administración'}</span>
          <span>Soporte: campuspide@ulima.edu.pe</span>
          <span>Anexo 1180</span>
        </div>
        <div>
          <span>
            Sesión iniciada como {activeLocal ? activeLocal.nombreComercial : (currentUser?.nombres || 'Administrador')}
          </span>
        </div>
      </footer>
    );
  }

  return (
    <footer
      style={{
        backgroundColor: '#261915',
        color: '#EFE2DC',
        paddingTop: 'var(--space-10)',
        marginTop: 'auto'
      }}
    >
      <div
        className="contenedor"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-8)',
          paddingBottom: 'var(--space-8)'
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'var(--font-family-title)',
              fontSize: '22px',
              fontWeight: '700',
              marginBottom: 'var(--space-3)'
            }}
          >
            <span style={{ color: '#FFFFFF' }}>Campus</span>
            <span style={{ color: 'var(--color-primary)' }}>Pide</span>
          </div>
          <p style={{ fontSize: '14px', lineHeight: '20px', color: '#B5A59E' }}>
            Plataforma oficial de pedidos anticipados en las cafeterías y concesionarios del campus de la Universidad de Lima.
          </p>
        </div>

        <div>
          <h4 style={{ color: '#FFFFFF', fontSize: '15px', marginBottom: 'var(--space-3)' }}>
            Explorar
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#B5A59E' }}>
            <li><a href="#locales" style={{ color: 'inherit' }}>Locales del campus</a></li>
            <li><a href="#como-funciona" style={{ color: 'inherit' }}>Cómo funciona</a></li>
            <li><a href="#mis-pedidos" style={{ color: 'inherit' }}>Seguimiento de pedidos</a></li>
          </ul>
        </div>

        <div>
          <h4 style={{ color: '#FFFFFF', fontSize: '15px', marginBottom: 'var(--space-3)' }}>
            Para concesionarios
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#B5A59E' }}>
            <li><span style={{ color: 'inherit' }}>Gestión de pedidos en tiempo real</span></li>
            <li><span style={{ color: 'inherit' }}>Mantenimiento de carta y disponibilidad</span></li>
            <li><span style={{ color: 'inherit' }}>Entrega rápida contra código único</span></li>
          </ul>
        </div>

        <div>
          <h4 style={{ color: '#FFFFFF', fontSize: '15px', marginBottom: 'var(--space-3)' }}>
            Contacto & Soporte
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#B5A59E' }}>
            <li>Av. Javier Prado Este 4600, Lima</li>
            <li>Horario: Lunes a viernes, 7:30 a 19:30</li>
            <li>campuspide@ulima.edu.pe · Anexo 1180</li>
          </ul>
        </div>
      </div>

      <div
        style={{
          borderTop: '1px solid #3A2A24',
          padding: 'var(--space-4) 0',
          textAlign: 'center',
          fontSize: '13px',
          color: '#8C7A72'
        }}
      >
        <div className="contenedor">
          <p>© 2026 Universidad de Lima. Proyecto Asignatura Programación Web (Ciclo 2026-2).</p>
        </div>
      </div>
    </footer>
  );
}
