import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

/**
 * Componente común: Notificaciones flotantes (Toasts)
 * Cumple especificación del PDF (Sección 7):
 * "Toda operación de escritura notifica su resultado"
 */
export function NotificationToast({ notification, onClose }) {
  if (!notification) return null;

  const { type = 'success', message, title } = notification;

  const getStyle = () => {
    switch (type) {
      case 'success':
        return { bg: '#F0F9EA', border: '#D3EFBF', color: '#5B9B2E', icon: CheckCircle2 };
      case 'danger':
      case 'error':
        return { bg: '#FDE8E7', border: '#F9C2BF', color: '#B4322B', icon: AlertCircle };
      default:
        return { bg: '#EAF2FB', border: '#CBE0F5', color: '#3B6FA8', icon: Info };
    }
  };

  const styleConfig = getStyle();
  const Icon = styleConfig.icon;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 2000,
        backgroundColor: styleConfig.bg,
        border: `1px solid ${styleConfig.border}`,
        color: 'var(--color-text)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-warm-lg)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        maxWidth: '400px',
        animation: 'slideUp 0.2s ease-out'
      }}
    >
      <Icon size={20} style={{ color: styleConfig.color, flexShrink: 0 }} />
      <div style={{ flex: 1, fontSize: '14px' }}>
        {title && <strong style={{ display: 'block', marginBottom: '2px' }}>{title}</strong>}
        <span>{message}</span>
      </div>
      <button
        type="button"
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--color-text-muted)',
          cursor: 'pointer',
          padding: '2px',
          display: 'flex'
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
