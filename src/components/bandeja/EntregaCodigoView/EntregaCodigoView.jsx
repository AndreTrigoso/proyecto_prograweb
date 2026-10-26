import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { pedidosService } from '../../../services/storageService';
import { StatusBadge } from '../../common';
import './EntregaCodigoView.css';

/**
 * 5.4 Entrega contra código
 * Fiel al Mockup 5.4:
 * - Búsqueda de pedido por código (ej. PED-4835 o solo los 4 dígitos 4835).
 * - Estado 1: Pedido válido listo para entregar con botón "Marcar como entregado".
 * - Estado 2 (Pieza suelta): Código no encontrado (PED-9999).
 * - Estado 3 (Pieza suelta): Pedido ya entregado (PED-4805) con acción "Ver detalle del pedido".
 */
export function EntregaCodigoView({ onSelectPedido, onShowNotification }) {
  const { currentUser } = useAuth();
  const { pedidos } = useData();

  const [codigoInput, setCodigoInput] = useState('PED-4835');
  const [codigoBuscado, setCodigoBuscado] = useState('PED-4835');

  const activeLocalId = currentUser?.localId || 'loc-central';

  // Buscar el pedido de forma reactiva en los pedidos del local actual
  const buscarPedido = (codigo) => {
    if (!codigo || !codigo.trim()) return null;
    const raw = codigo.trim().toUpperCase();
    const normalized = raw.startsWith('PED-') ? raw : `PED-${raw}`;
    return pedidos.find(
      p => p.localId === activeLocalId && (p.codigoPedido.toUpperCase() === normalized || p.codigoPedido.toUpperCase() === raw)
    ) || null;
  };

  const pedidoEncontrado = buscarPedido(codigoBuscado);
  const noEncontrado = codigoBuscado.trim() !== '' && !pedidoEncontrado;
  const yaEntregado = pedidoEncontrado && pedidoEncontrado.estado === 'entregado';
  const pedidoNoEntregable = pedidoEncontrado && (pedidoEncontrado.estado === 'rechazado' || pedidoEncontrado.estado === 'cancelado' || pedidoEncontrado.estado === 'no_recogido');
  const pedidoParaEntregar = pedidoEncontrado && !yaEntregado && !pedidoNoEntregable;

  const handleSubmit = (e) => {
    e.preventDefault();
    const raw = codigoInput.trim().toUpperCase();
    if (!raw) return;
    const formatted = /^\d{4}$/.test(raw) ? `PED-${raw}` : raw;
    setCodigoInput(formatted);
    setCodigoBuscado(formatted);
  };

  const handleQuickCode = (code) => {
    setCodigoInput(code);
    setCodigoBuscado(code);
  };

  const handleConfirmarEntrega = () => {
    if (!pedidoEncontrado) return;
    const actualizado = pedidosService.entregar(pedidoEncontrado.id);
    if (onShowNotification && actualizado) {
      onShowNotification({
        type: 'success',
        title: `Entrega confirmada (${actualizado.codigoPedido})`,
        message: `El pedido de ${actualizado.comensalNombre} fue marcado como entregado a las ${actualizado.horaEntrega}.`
      });
    }
  };

  // Determinar clase de borde del input según el estado de la búsqueda
  const getInputModClass = () => {
    if (noEncontrado) return 'entrega-codigo__input--error';
    if (pedidoParaEntregar) return 'entrega-codigo__input--valid';
    return '';
  };

  return (
    <div>
      {/* Contenedor centrado como en el Mockup 5.4 */}
      <div className="entrega-codigo__container">
        {/* Migas de pan */}
        <div className="entrega-codigo__breadcrumb">
          Atención &gt; Entrega contra código
        </div>

        <h1 className="entrega-codigo__title">
          Entrega contra código
        </h1>

        <p className="entrega-codigo__subtitle">
          Pide al comensal los cuatro dígitos de su código y confirma la entrega.
        </p>

        {/* Buscador de Código */}
        <form onSubmit={handleSubmit} className="entrega-codigo__form">
          <label className="entrega-codigo__label">
            CÓDIGO DE PEDIDO
          </label>

          <div className="entrega-codigo__search-row">
            <input
              type="text"
              value={codigoInput}
              onChange={(e) => setCodigoInput(e.target.value.toUpperCase())}
              placeholder="PED-0000"
              className={`entrega-codigo__input ${getInputModClass()}`}
            />

            <button
              type="submit"
              className="entrega-codigo__submit-btn"
            >
              Buscar
            </button>
          </div>
        </form>

        {/* Botones de prueba rápida para evaluar los 3 estados del Mockup 5.4 */}
        <div className="entrega-codigo__quick-cases">
          <span>Probar casos del mockup:</span>
          {[
            { code: 'PED-4835', label: 'PED-4835 (Listo)' },
            { code: 'PED-4805', label: 'PED-4805 (Ya entregado)' },
            { code: 'PED-9999', label: 'PED-9999 (No encontrado)' }
          ].map(item => (
            <button
              key={item.code}
              type="button"
              onClick={() => handleQuickCode(item.code)}
              className={`entrega-codigo__quick-btn ${codigoBuscado === item.code ? 'entrega-codigo__quick-btn--active' : ''}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* CASO 1: CÓDIGO VÁLIDO LISTO PARA ENTREGAR */}
        {pedidoParaEntregar && (
          <div className="entrega-codigo__valid-card">
            <div className="entrega-codigo__valid-header">
              <h2 className="entrega-codigo__valid-title">
                {pedidoEncontrado.codigoPedido} · {pedidoEncontrado.comensalNombre}
              </h2>

              <StatusBadge status={pedidoEncontrado.estado} type="pedido" solid={pedidoEncontrado.estado === 'listo'} size="sm" />
            </div>

            {/* Lista de ítems */}
            <div className="entrega-codigo__valid-items">
              {(pedidoEncontrado.items || []).map((item, idx) => {
                const opciones = (item.opcionesSeleccionadas || []).map(o => o.nombre).join(' · ');
                return (
                  <div
                    key={idx}
                    className="entrega-codigo__valid-item-row"
                  >
                    <span>
                      {item.cantidad} × {item.nombre}
                      {opciones ? ` · ${opciones}` : ''}
                    </span>
                    <strong className="entrega-codigo__valid-item-price">
                      S/ {Number(item.subtotal).toFixed(2)}
                    </strong>
                  </div>
                );
              })}
            </div>

            {/* Total y botón de entrega */}
            <div className="entrega-codigo__valid-footer">
              <span className="entrega-codigo__valid-meta">
                Cobrar en el mostrador · recojo {pedidoEncontrado.horaRecojo} del {pedidoEncontrado.fechaPedido || '15/09/2026'}
              </span>
              <span className="entrega-codigo__valid-total">
                S/ {Number(pedidoEncontrado.total).toFixed(2)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleConfirmarEntrega}
              className="entrega-codigo__confirm-btn"
            >
              Marcar como entregado
            </button>
          </div>
        )}

        {/* CASO 2 (PIEZA SUELTA): CÓDIGO NO ENCONTRADO */}
        {noEncontrado && (
          <div className="entrega-codigo__not-found">
            No existe un pedido con ese código en tu local para hoy. Verifica los cuatro dígitos con el comensal.
          </div>
        )}

        {/* CASO 3 (PIEZA SUELTA): PEDIDO YA ENTREGADO */}
        {yaEntregado && (
          <div className="entrega-codigo__status-card">
            <div className="entrega-codigo__delivered-notice">
              Este pedido ya fue entregado a las {pedidoEncontrado.horaEntrega || '10:34'} a {pedidoEncontrado.comensalNombre}. No se puede volver a entregar.
            </div>

            <button
              type="button"
              onClick={() => onSelectPedido && onSelectPedido(pedidoEncontrado)}
              className="entrega-codigo__detail-btn"
            >
              Ver detalle del pedido
            </button>
          </div>
        )}

        {/* CASO ADICIONAL: PEDIDO RECHAZADO / CANCELADO / NO RECOGIDO */}
        {pedidoNoEntregable && (
          <div className="entrega-codigo__status-card">
            <div className="entrega-codigo__rejected-notice">
              El pedido {pedidoEncontrado.codigoPedido} figura con estado <strong>{pedidoEncontrado.estado.replace('_', ' ')}</strong> y no puede ser entregado.
            </div>

            <button
              type="button"
              onClick={() => onSelectPedido && onSelectPedido(pedidoEncontrado)}
              className="entrega-codigo__detail-btn"
            >
              Ver detalle del pedido
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
