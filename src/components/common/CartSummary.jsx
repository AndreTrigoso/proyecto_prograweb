import React from 'react';
import { useCart } from '../../context/CartContext';
import { Trash2, Plus, Minus, AlertCircle, ShoppingBag } from 'lucide-react';

/**
 * Componente común: Resumen del carrito
 * Cumple especificación del Mockup (Tema 8):
 * - Control de cantidades (+ / -)
 * - Notas por producto
 * - Eliminación de ítems
 * - Subtotal en tiempo real
 * - Advertencia de un solo local
 * - Manejo de estado vacío
 */
export function CartSummary({ onProceedToCheckout, isReadOnly = false }) {
  const {
    items,
    activeLocal,
    totalItemsCount,
    subtotalTotal,
    updateQuantity,
    updateItemNote,
    removeItem,
    clearCart,
    checkCartAvailability
  } = useCart();

  const unavailableItems = checkCartAvailability();

  if (items.length === 0) {
    return (
      <div
        style={{
          padding: 'var(--space-8) var(--space-4)',
          textAlign: 'center',
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px dashed var(--color-border)'
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-primary-soft)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--space-4)'
          }}
        >
          <ShoppingBag size={28} />
        </div>
        <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Tu carrito está vacío</h3>
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', maxWidth: '320px', margin: '0 auto' }}>
          Explora los locales del campus, agrega tus productos favoritos y recógelos sin hacer cola.
        </p>
      </div>
    );
  }

  return (
    <div
      className="cart-summary"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-warm)',
        overflow: 'hidden'
      }}
    >
      {/* Cabecera del carrito con el local */}
      <div
        style={{
          padding: 'var(--space-4) var(--space-5)',
          backgroundColor: '#FAF5F1',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-muted)', fontWeight: '600' }}>
            Pedido en
          </span>
          <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-text)' }}>
            {activeLocal?.nombreComercial || 'Local del campus'}
          </h4>
        </div>
        {!isReadOnly && (
          <button
            type="button"
            onClick={clearCart}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-danger)',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Vaciar
          </button>
        )}
      </div>

      {/* Alerta si algún producto del carrito ya no está disponible */}
      {unavailableItems.length > 0 && (
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: 'var(--color-primary-soft)',
            borderBottom: '1px solid #F9C2BF',
            color: 'var(--color-danger)',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <AlertCircle size={16} />
          <span>Atención: {unavailableItems.length} producto(s) ya no están disponibles hoy.</span>
        </div>
      )}

      {/* Lista de productos */}
      <div
        style={{
          maxHeight: '380px',
          overflowY: 'auto',
          padding: 'var(--space-4) var(--space-5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)'
        }}
      >
        {items.map(item => (
          <div
            key={item.itemCarritoId}
            style={{
              display: 'flex',
              gap: 'var(--space-3)',
              paddingBottom: 'var(--space-4)',
              borderBottom: '1px solid var(--color-border)'
            }}
          >
            {item.fotografia && (
              <img
                src={item.fotografia}
                alt={item.nombre}
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: 'var(--radius-md)',
                  objectFit: 'cover'
                }}
              />
            )}

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h5 style={{ fontSize: '15px', fontWeight: '600' }}>{item.nombre}</h5>
                <span style={{ fontWeight: '600', fontSize: '15px' }}>
                  S/ {Number(item.subtotal).toFixed(2)}
                </span>
              </div>

              {/* Opciones seleccionadas */}
              {item.opcionesSeleccionadas && item.opcionesSeleccionadas.length > 0 && (
                <div style={{ marginTop: '2px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  {item.opcionesSeleccionadas.map((opt, i) => (
                    <span key={i} style={{ display: 'inline-block', marginRight: '6px' }}>
                      • {opt.nombre} {opt.precioAdicional > 0 ? `(+S/ ${opt.precioAdicional.toFixed(2)})` : ''}
                    </span>
                  ))}
                </div>
              )}

              {/* Nota del producto */}
              {!isReadOnly ? (
                <input
                  type="text"
                  placeholder="Nota (ej. sin mayonesa, bien caliente)..."
                  value={item.nota || ''}
                  onChange={(e) => updateItemNote(item.itemCarritoId, e.target.value)}
                  style={{
                    width: '100%',
                    marginTop: '6px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    outline: 'none',
                    backgroundColor: '#FFFDFB'
                  }}
                />
              ) : item.nota ? (
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontStyle: 'italic', marginTop: '4px' }}>
                  Nota: "{item.nota}"
                </p>
              ) : null}

              {/* Selector de cantidad y eliminar */}
              {!isReadOnly && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      backgroundColor: '#F3EFEA',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.itemCarritoId, item.cantidad - 1)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Minus size={14} />
                    </button>
                    <span style={{ padding: '0 8px', fontSize: '13px', fontWeight: '600' }}>
                      {item.cantidad}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.itemCarritoId, item.cantidad + 1)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.itemCarritoId)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px'
                    }}
                  >
                    <Trash2 size={14} />
                    Quitar
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pie del carrito: Subtotal y Botón de acción */}
      <div
        style={{
          padding: 'var(--space-4) var(--space-5)',
          backgroundColor: '#FAF5F1',
          borderTop: '1px solid var(--color-border)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
          <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Total a pagar ({totalItemsCount} {totalItemsCount === 1 ? 'ítem' : 'ítems'})
          </span>
          <span
            style={{
              fontFamily: 'var(--font-family-title)',
              fontSize: '20px',
              fontWeight: '700',
              color: 'var(--color-text)'
            }}
          >
            S/ {subtotalTotal.toFixed(2)}
          </span>
        </div>

        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
          💡 El pago se realiza directamente en el local al recoger con tu código.
        </p>

        {onProceedToCheckout && (
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={onProceedToCheckout}
            disabled={unavailableItems.length > 0}
          >
            Continuar a elegir hora de recojo
          </button>
        )}
      </div>
    </div>
  );
}
