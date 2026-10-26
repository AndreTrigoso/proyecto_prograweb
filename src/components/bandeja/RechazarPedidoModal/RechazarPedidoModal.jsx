import React, { useState, useEffect } from 'react';
import './RechazarPedidoModal.css';

const MOTIVOS_RECHAZO = [
  {
    id: 'Producto agotado',
    label: 'Producto agotado',
    defaultText: 'Se terminó el menú ejecutivo antes de tu franja de recojo.'
  },
  {
    id: 'Fuera del horario de atención',
    label: 'Fuera del horario de atención',
    defaultText: 'El pedido ingresó cuando la cocina ya había cerrado su turno.'
  },
  {
    id: 'Capacidad de preparación llena',
    label: 'Capacidad de preparación llena',
    defaultText: 'No contamos con capacidad para preparar tu pedido en la franja solicitada.'
  },
  {
    id: 'Otro motivo',
    label: 'Otro motivo',
    defaultText: ''
  }
];

/**
 * 5.3 Modal de rechazo · Motivo obligatorio
 * Fiel al Mockup 5.3:
 * - Selección de motivo por radio button obligatorio.
 * - Detalle para el comensal con contador de máximo 160 caracteres.
 * - Validación antes de confirmar el rechazo destructivo.
 */
export function RechazarPedidoModal({ isOpen, pedido, onClose, onConfirmRechazo }) {
  const [selectedMotivo, setSelectedMotivo] = useState('Producto agotado');
  const [detalle, setDetalle] = useState('Se terminó el menú ejecutivo antes de tu franja de recojo.');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && pedido) {
      setSelectedMotivo('Producto agotado');
      setDetalle('Se terminó el menú ejecutivo antes de tu franja de recojo.');
      setError('');
    }
  }, [isOpen, pedido]);

  if (!isOpen || !pedido) return null;

  const handleSelectMotivo = (motivoObj) => {
    setSelectedMotivo(motivoObj.id);
    if (motivoObj.defaultText) {
      setDetalle(motivoObj.defaultText);
    } else {
      setDetalle('');
    }
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedMotivo) {
      setError('Selecciona un motivo obligatorio para rechazar el pedido.');
      return;
    }
    if (!detalle.trim()) {
      setError('Ingresa el detalle para el comensal antes de rechazar el pedido.');
      return;
    }
    onConfirmRechazo(pedido.id, selectedMotivo, detalle.trim());
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content rechazar-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="rechazar-modal-title">
          Rechazar el pedido {pedido.codigoPedido}
        </h3>

        <p className="rechazar-modal-subtitle">
          El motivo será visible para el comensal en el detalle de su pedido.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Grupo de Radio Buttons */}
          <div className="rechazar-modal-section">
            <div className="rechazar-modal-label">
              MOTIVO · OBLIGATORIO
            </div>

            <div className="rechazar-modal-radio-list">
              {MOTIVOS_RECHAZO.map((m) => {
                const isSelected = selectedMotivo === m.id;
                return (
                  <label
                    key={m.id}
                    onClick={() => handleSelectMotivo(m)}
                    className={`rechazar-modal-radio-item ${isSelected ? 'is-selected' : ''}`}
                  >
                    <span className="rechazar-modal-radio-circle" />
                    <span>{m.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Textarea: Detalle para el comensal */}
          <div className="rechazar-modal-section-detail">
            <label className="rechazar-modal-label">
              DETALLE PARA EL COMENSAL
            </label>

            <textarea
              rows={3}
              maxLength={160}
              value={detalle}
              onChange={(e) => {
                setDetalle(e.target.value);
                if (error) setError('');
              }}
              placeholder="Explica brevemente el motivo al comensal..."
              className={`rechazar-modal-textarea ${error ? 'has-error' : ''}`}
            />

            <div className={`rechazar-modal-helper ${error ? 'has-error' : ''}`}>
              <span>{error || `Máximo 160 caracteres. Van ${detalle.length}.`}</span>
            </div>
          </div>

          {/* Acciones del modal */}
          <div className="rechazar-modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="rechazar-btn-volver"
            >
              Volver
            </button>

            <button
              type="submit"
              className="rechazar-btn-confirmar"
            >
              Rechazar pedido
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
