import React from 'react';
import { useCart } from '../../context/CartContext';
import { CartSummary } from './CartSummary';
import { X, AlertTriangle } from 'lucide-react';

export function CartDrawer({ onCheckout }) {
  const {
    isDrawerOpen,
    setIsDrawerOpen,
    conflictModal,
    resolveConflictReplace,
    cancelConflict
  } = useCart();

  if (!isDrawerOpen && !conflictModal.isOpen) return null;

  return (
    <>
      {/* Modal de conflicto si se intenta agregar de otro local */}
      {conflictModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#FEF7ED',
                  color: 'var(--color-warning)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <AlertTriangle size={24} />
              </div>
              <h3 style={{ fontSize: '18px' }}>¿Deseas iniciar un nuevo pedido?</h3>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '24px' }}>
              Tu carrito ya contiene productos de otra cafetería. Los pedidos solo pueden realizarse a un único local a la vez para coordinar la hora de recojo.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-tertiary" onClick={cancelConflict}>
                Mantener carrito actual
              </button>
              <button type="button" className="btn btn-primary" onClick={resolveConflictReplace}>
                Vaciar y agregar nuevo producto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer lateral del carrito */}
      {isDrawerOpen && (
        <div
          className="modal-overlay"
          style={{ justifyContent: 'flex-end', padding: 0 }}
          onClick={() => setIsDrawerOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '440px',
              height: '100%',
              backgroundColor: 'var(--color-surface)',
              boxShadow: 'var(--shadow-warm-lg)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'slideInRight 0.25s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: 'var(--space-4) var(--space-5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--color-border)'
              }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Mi carrito de compra</h3>
              <button
                type="button"
                className="btn btn-tertiary btn-icon btn-sm"
                onClick={() => setIsDrawerOpen(false)}
                title="Cerrar carrito"
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)' }}>
              <CartSummary
                onProceedToCheckout={() => {
                  setIsDrawerOpen(false);
                  if (onCheckout) onCheckout();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
