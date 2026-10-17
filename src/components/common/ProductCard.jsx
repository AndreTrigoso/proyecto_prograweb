import React from 'react';
import { StatusBadge } from './StatusBadge';
import { Plus, Check } from 'lucide-react';

/**
 * Componente común: Tarjeta de producto
 * Cumple especificación del Mockup (Tema 8):
 * - Imagen a sangre.
 * - Radio de borde 16px.
 * - Sombra cálida (0 2px 12px rgba(38,25,21,.10)).
 * - Precios grandes en Poppins 600.
 * - Botones de gran superficie.
 * - Productos agotados se atenúan al 50 %, nunca se ocultan.
 */
export function ProductCard({
  producto,
  onAddToCart,
  onOpenDetails,
  isSelected = false
}) {
  const isAgotado = producto.disponibilidad === 'agotado_dia';
  const isRetirado = producto.disponibilidad === 'retirado';
  const hasOptions = producto.gruposOpciones && producto.gruposOpciones.length > 0;

  if (isRetirado) return null;

  return (
    <article
      className="card product-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-warm)',
        opacity: isAgotado ? 0.55 : 1,
        transition: 'all var(--transition-fast)',
        position: 'relative',
        filter: isAgotado ? 'grayscale(20%)' : 'none'
      }}
    >
      {/* Imagen a sangre */}
      <div
        style={{
          width: '100%',
          height: '180px',
          overflow: 'hidden',
          backgroundColor: '#F7F2EE',
          position: 'relative',
          cursor: onOpenDetails ? 'pointer' : 'default'
        }}
        onClick={() => onOpenDetails && onOpenDetails(producto)}
      >
        <img
          src={producto.fotografia}
          alt={producto.nombre}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.3s ease'
          }}
          loading="lazy"
        />

        {/* Badge de disponibilidad flotante */}
        <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
          <StatusBadge status={producto.disponibilidad} type="producto" size="sm" />
        </div>

        {producto.tiempoPreparacionMin && (
          <div
            style={{
              position: 'absolute',
              bottom: '8px',
              left: '8px',
              backgroundColor: 'rgba(38, 25, 21, 0.75)',
              color: '#FFFFFF',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '11px',
              fontWeight: '500'
            }}
          >
            ⏱ {producto.tiempoPreparacionMin} min
          </div>
        )}
      </div>

      {/* Contenido de la tarjeta */}
      <div
        style={{
          padding: 'var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          justifyContent: 'space-between'
        }}
      >
        <div>
          <h3
            style={{
              fontFamily: 'var(--font-family-title)',
              fontSize: '16px',
              lineHeight: '24px',
              fontWeight: '500',
              marginBottom: '6px',
              color: 'var(--color-text)',
              cursor: onOpenDetails ? 'pointer' : 'default'
            }}
            onClick={() => onOpenDetails && onOpenDetails(producto)}
          >
            {producto.nombre}
          </h3>

          <p
            style={{
              fontSize: '13px',
              lineHeight: '18px',
              color: 'var(--color-text-muted)',
              marginBottom: 'var(--space-4)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {producto.descripcion}
          </p>
        </div>

        {/* Pie de tarjeta: Precio y Acción */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 'var(--space-3)',
            borderTop: '1px solid var(--color-border)'
          }}
        >
          <div>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block' }}>
              Precio
            </span>
            <span
              style={{
                fontFamily: 'var(--font-family-title)',
                fontSize: '18px',
                lineHeight: '24px',
                fontWeight: '600',
                color: 'var(--color-text)'
              }}
            >
              S/ {Number(producto.precio).toFixed(2)}
            </span>
          </div>

          <div>
            {isAgotado ? (
              <button
                type="button"
                className="btn btn-sm"
                disabled
                style={{
                  backgroundColor: '#EFE2DC',
                  color: 'var(--color-text-muted)',
                  border: 'none',
                  cursor: 'not-allowed'
                }}
              >
                Agotado
              </button>
            ) : hasOptions ? (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onOpenDetails ? onOpenDetails(producto) : onAddToCart(producto)}
              >
                Personalizar
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => onAddToCart && onAddToCart(producto)}
                title="Agregar al carrito"
              >
                <Plus size={16} />
                Agregar
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
