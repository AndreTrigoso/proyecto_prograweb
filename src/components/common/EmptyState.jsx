import React from 'react';
import { Inbox, Search, ShoppingBag, AlertCircle } from 'lucide-react';

/**
 * Componente común: Estado Vacío (Empty State)
 * Cumple especificación del PDF (Sección 7):
 * "toda vista que pueda quedar sin datos contempla su estado vacío"
 */
export function EmptyState({
  icon: Icon = Inbox,
  title = 'No hay datos disponibles',
  description = 'No se encontraron elementos en esta sección.',
  actionText,
  onAction
}) {
  return (
    <div
      style={{
        padding: 'var(--space-10) var(--space-6)',
        textAlign: 'center',
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px dashed var(--color-border)',
        margin: 'var(--space-4) 0'
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#FAF5F1',
          color: 'var(--color-text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto var(--space-4)'
        }}
      >
        <Icon size={26} />
      </div>

      <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
        {title}
      </h3>

      <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', maxWidth: '420px', margin: '0 auto var(--space-5)' }}>
        {description}
      </p>

      {actionText && onAction && (
        <button type="button" className="btn btn-secondary btn-sm" onClick={onAction}>
          {actionText}
        </button>
      )}
    </div>
  );
}
