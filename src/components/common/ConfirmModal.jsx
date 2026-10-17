import React, { useState } from 'react';
import { AlertTriangle, AlertCircle, X } from 'lucide-react';

/**
 * Componente común: Diálogo modal de confirmación
 * Cumple especificación del PDF (Secciones 7 y 9):
 * - Acción destructiva pide confirmación.
 * - Soporte para captura de motivo obligatorio (ej. rechazo de pedido, bloqueo de cuenta).
 */
export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDestructive = false,
  requiresReason = false,
  reasonPlaceholder = 'Ingresa el motivo obligatorio...',
  onConfirm,
  onCancel
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (requiresReason && !reason.trim()) {
      setError('El motivo es obligatorio para continuar.');
      return;
    }
    setError('');
    onConfirm(requiresReason ? reason.trim() : true);
    setReason('');
  };

  const handleCancel = () => {
    setError('');
    setReason('');
    onCancel();
  };

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: isDestructive ? 'var(--color-primary-soft)' : '#FEF7ED',
                color: isDestructive ? 'var(--color-danger)' : 'var(--color-warning)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              {isDestructive ? <AlertCircle size={22} /> : <AlertTriangle size={22} />}
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '600' }}>{title}</h3>
          </div>
          <button
            type="button"
            className="btn btn-tertiary btn-icon btn-sm"
            onClick={handleCancel}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: requiresReason ? 'var(--space-4)' : 'var(--space-6)' }}>
          {message}
        </p>

        {/* Campo de motivo obligatorio si aplica */}
        {requiresReason && (
          <div style={{ marginBottom: 'var(--space-5)' }}>
            <label className="form-label">
              Motivo obligatorio *
            </label>
            <textarea
              className={`form-textarea ${error ? 'is-invalid' : ''}`}
              rows={3}
              placeholder={reasonPlaceholder}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              style={{ width: '100%', resize: 'none' }}
              autoFocus
            />
            {error && (
              <span className="form-error" style={{ marginTop: '4px' }}>
                {error}
              </span>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
          <button type="button" className="btn btn-tertiary" onClick={handleCancel}>
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn ${isDestructive ? 'btn-danger' : 'btn-primary'}`}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
