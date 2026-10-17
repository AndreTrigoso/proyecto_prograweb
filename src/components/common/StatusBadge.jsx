import React from 'react';

/**
 * Componente común: Etiquetas de estado y disponibilidad
 * Cumple especificación del Mockup (Tema 8):
 * - Estados combinan siempre color y texto.
 * - Formato chip con radio 999px.
 */
export function StatusBadge({ status, type = 'pedido', size = 'normal', solid = false, className = '' }) {
  if (!status) return null;

  const getBadgeConfig = () => {
    const s = String(status).toLowerCase();

    // Estados de Pedido
    if (type === 'pedido') {
      switch (s) {
        case 'recibido':
          return { label: 'Recibido', bg: '#EAF2FB', color: '#3B6FA8', border: '#CBE0F5' };
        case 'en_preparacion':
        case 'en preparación':
          return { label: 'En preparación', bg: '#FEF7ED', color: '#9C6514', border: '#F6E1C3' };
        case 'listo':
        case 'listo para recoger':
          if (solid) {
            return { label: 'Listo', bg: '#5B9B2E', color: '#FFFFFF', border: '#5B9B2E' };
          }
          return { label: 'Listo para recoger', bg: '#F0F9EA', color: '#5B9B2E', border: '#D3EFBF' };
        case 'entregado':
          return { label: 'Entregado', bg: '#EFECE6', color: '#5C4F49', border: '#E2D9D2' };
        case 'cancelado':
          return { label: 'Cancelado', bg: '#FCEAE7', color: '#B4322B', border: '#F9C2BF' };
        case 'rechazado':
          return { label: 'Rechazado', bg: '#FCEAE7', color: '#B4322B', border: '#F9C2BF' };
        case 'no_recogido':
        case 'no recogido':
          return { label: 'No recogido', bg: '#FCEAE7', color: '#B4322B', border: '#F9C2BF' };
        case 'vencido':
          return { label: 'Vencido', bg: '#B4322B', color: '#FFFFFF', border: '#B4322B' };
        default:
          return { label: status, bg: '#F3EFEA', color: '#7C6960', border: '#E2D9D2' };
      }
    }

    // Estados de Local
    if (type === 'local') {
      switch (s) {
        case 'abierto':
          return { label: 'Abierto', bg: '#F0F9EA', color: '#5B9B2E', border: '#D3EFBF' };
        case 'suspendido':
          return { label: 'Suspendido', bg: '#FEF7ED', color: '#B7791F', border: '#FCE6C7' };
        case 'cerrado':
          return { label: 'Cerrado', bg: '#F3EFEA', color: '#7C6960', border: '#E2D9D2' };
        default:
          return { label: status, bg: '#F3EFEA', color: '#7C6960', border: '#E2D9D2' };
      }
    }

    // Estados de Producto
    if (type === 'producto') {
      switch (s) {
        case 'disponible':
          return { label: 'Disponible', bg: '#F0F9EA', color: '#5B9B2E', border: '#D3EFBF' };
        case 'agotado_dia':
        case 'agotado':
          return { label: 'Agotado por hoy', bg: '#FCEAE7', color: '#B4322B', border: '#F9C2BF' };
        case 'retirado':
          return { label: 'Retirado de carta', bg: '#F3EFEA', color: '#7C6960', border: '#E2D9D2' };
        default:
          return { label: status, bg: '#F3EFEA', color: '#7C6960', border: '#E2D9D2' };
      }
    }

    return { label: status, bg: '#F3EFEA', color: '#7C6960', border: '#E2D9D2' };
  };

  const config = getBadgeConfig();
  const isSmall = size === 'sm';

  const badgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: config.bg,
    color: config.color,
    border: `1px solid ${config.border}`,
    borderRadius: '999px',
    padding: isSmall ? '3px 10px' : '5px 14px',
    fontSize: isSmall ? '12px' : '13px',
    lineHeight: isSmall ? '16px' : '18px',
    fontWeight: '600',
    fontFamily: 'var(--font-family-body)',
    whiteSpace: 'nowrap'
  };

  return (
    <span style={badgeStyle} className={`status-badge ${className}`}>
      {config.label}
    </span>
  );
}
