import React, { useState } from 'react';
import { useData } from '../../../context/DataContext';
import { pedidosService } from '../../../services/storageService';
import { StatusBadge } from '../../common';
import { RechazarPedidoModal } from '../RechazarPedidoModal/RechazarPedidoModal';
import { Check } from 'lucide-react';
import './DetallePedidoView.css';

/**
 * 5.2 Detalle del pedido
 * Fiel al Mockup 5.2:
 * - Ítems con opciones y notas resaltadas.
 * - Tarjeta con datos del comensal e historial.
 * - Línea de avance de 4 pasos con horas reales.
 * - Botones de transición de estado y rechazo con motivo.
 */
export function DetallePedidoView({ pedidoId, onBack, onShowNotification }) {
  const { pedidos } = useData();
  const [modalRechazoOpen, setModalRechazoOpen] = useState(false);

  const pedido = pedidos.find(p => p.id === pedidoId) || pedidos.find(p => p.codigoPedido === 'PED-4821') || pedidos[0];

  if (!pedido) {
    return (
      <div className="detalle-pedido__empty">
        <p>No se encontró el pedido solicitado.</p>
        <button type="button" className="btn btn-primary detalle-pedido__empty-btn" onClick={onBack}>
          Volver a la bandeja
        </button>
      </div>
    );
  }

  // Obtener iniciales del comensal
  const obtenerIniciales = (nombreCompleto = '') => {
    const partes = nombreCompleto.trim().split(' ');
    if (partes.length >= 2) {
      return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    return nombreCompleto.slice(0, 2).toUpperCase() || 'CM';
  };

  // Subtítulo dinámico según estado
  const construirSubtitulo = () => {
    const base = `Recibido ${pedido.horaRecibido || '11:02'} · recojo ${pedido.horaRecojo} del ${pedido.fechaPedido || '15/09/2026'}`;
    if (pedido.estado === 'en_preparacion' && pedido.minutosRestantes) {
      return `${base} · faltan ${pedido.minutosRestantes} minutos`;
    }
    if (pedido.estado === 'entregado' && pedido.horaEntrega) {
      return `${base} · entregado a las ${pedido.horaEntrega}`;
    }
    if (pedido.vencido) {
      return `${base} · vencido hace ${pedido.vencidoMinutos || 20} minutos`;
    }
    return base;
  };

  // Determinar el progreso de los 4 pasos
  const getStepState = (stepKey) => {
    const order = ['recibido', 'en_preparacion', 'listo', 'entregado'];
    const currentIndex = order.indexOf(pedido.estado);
    const stepIndex = order.indexOf(stepKey);

    if (pedido.estado === 'rechazado' || pedido.estado === 'cancelado' || pedido.estado === 'no_recogido') {
      return stepIndex === 0 ? 'completed' : 'pending';
    }
    if (pedido.estado === 'entregado') {
      return 'completed';
    }
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  // Handlers de cambio de estado
  const handleMarcarListo = () => {
    pedidosService.marcarComoListo(pedido.id);
    if (onShowNotification) {
      onShowNotification({
        type: 'success',
        title: `Pedido ${pedido.codigoPedido} listo`,
        message: 'El comensal ha recibido el aviso para acercarse a recoger su pedido.'
      });
    }
  };

  const handlePasarAPreparacion = () => {
    pedidosService.pasarAPreparacion(pedido.id);
    if (onShowNotification) {
      onShowNotification({
        type: 'info',
        title: `Pedido ${pedido.codigoPedido} en preparación`,
        message: 'Se actualizó el estado a En preparación.'
      });
    }
  };

  const handleVolverARecibido = () => {
    pedidosService.volverARecibido(pedido.id);
    if (onShowNotification) {
      onShowNotification({
        type: 'info',
        title: `Pedido ${pedido.codigoPedido} devuelto a recibido`,
        message: 'El pedido regresó a la columna de Recibidos.'
      });
    }
  };

  const handleVolverAPreparacion = () => {
    pedidosService.volverAPreparacion(pedido.id);
    if (onShowNotification) {
      onShowNotification({
        type: 'info',
        title: `Pedido ${pedido.codigoPedido} en preparación`,
        message: 'El pedido regresó al estado En preparación.'
      });
    }
  };

  const handleEntregar = () => {
    pedidosService.entregar(pedido.id);
    if (onShowNotification) {
      onShowNotification({
        type: 'success',
        title: `Pedido ${pedido.codigoPedido} entregado`,
        message: `Se registró la entrega a ${pedido.comensalNombre}.`
      });
    }
  };

  const handleConfirmRechazo = (id, categoria, detalle) => {
    pedidosService.rechazar(id, categoria, detalle);
    setModalRechazoOpen(false);
    if (onShowNotification) {
      onShowNotification({
        type: 'danger',
        title: `Pedido ${pedido.codigoPedido} rechazado`,
        message: `Motivo visible para el comensal: "${detalle}"`
      });
    }
  };

  return (
    <div>
      {/* Migas de pan */}
      <div className="detalle-pedido__breadcrumb">
        <span>Atención &gt; </span>
        <button
          type="button"
          onClick={onBack}
          className="detalle-pedido__breadcrumb-btn"
        >
          Bandeja del día
        </button>
        <span> &gt; {pedido.codigoPedido}</span>
      </div>

      {/* Cabecera del Pedido */}
      <div className="detalle-pedido__header">
        <div>
          <h1 className="detalle-pedido__title">
            Pedido {pedido.codigoPedido}
          </h1>
          <p className="detalle-pedido__subtitle">
            {construirSubtitulo()}
          </p>
        </div>

        <StatusBadge status={pedido.estado} type="pedido" solid={pedido.estado === 'listo'} />
      </div>

      {/* Layout de 2 columnas (Tabla + Acciones a la izquierda | Comensal + Avance a la derecha) */}
      <div className="detalle-pedido__grid">
        {/* COLUMNA IZQUIERDA: Ítems del pedido y botones de acción */}
        <div>
          {/* Alerta si el pedido está rechazado o cancelado */}
          {(pedido.estado === 'rechazado' || pedido.estado === 'cancelado') && (
            <div className="detalle-pedido__reject-alert">
              <div className="detalle-pedido__reject-title">
                {pedido.estado === 'rechazado' ? `MOTIVO DEL RECHAZO (${pedido.categoriaRechazo || 'Registrado'})` : 'MOTIVO DE CANCELACIÓN'}
              </div>
              <p className="detalle-pedido__reject-reason">
                {pedido.motivoRechazo || pedido.motivoCancelacion || 'Sin detalle especificado.'}
              </p>
            </div>
          )}

          {/* Tabla de productos */}
          <div className="detalle-pedido__table-card">
            {/* Cabecera de tabla */}
            <div className="detalle-pedido__table-head">
              <span>CANT.</span>
              <span>PRODUCTO Y OPCIONES</span>
              <span className="detalle-pedido__text-right">IMPORTE</span>
            </div>

            {/* Filas de productos */}
            {(pedido.items || []).map((item, idx) => {
              const textoOpciones = (item.opcionesSeleccionadas || [])
                .map(opt => opt.nombre)
                .join(' · ');

              return (
                <div
                  key={item.itemCarritoId || idx}
                  className="detalle-pedido__table-row"
                >
                  <span className="detalle-pedido__item-qty">
                    {item.cantidad} ×
                  </span>

                  <div>
                    <div
                      className={`detalle-pedido__item-name ${textoOpciones ? 'detalle-pedido__item-name--with-opts' : ''}`}
                    >
                      {item.nombre}
                    </div>

                    {textoOpciones && (
                      <div className="detalle-pedido__item-opts">
                        {textoOpciones}
                      </div>
                    )}

                    {item.nota && item.nota.trim() !== '' && (
                      <div className="detalle-pedido__item-note">
                        Nota del comensal: {item.nota}
                      </div>
                    )}
                  </div>

                  <div className="detalle-pedido__item-subtotal">
                    S/ {Number(item.subtotal).toFixed(2)}
                  </div>
                </div>
              );
            })}

            {/* Pie de tabla: Total a cobrar en el mostrador */}
            <div className="detalle-pedido__table-footer">
              <span className="detalle-pedido__footer-label">
                Total a cobrar en el mostrador
              </span>
              <span className="detalle-pedido__footer-total">
                S/ {Number(pedido.total).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Botonera de acciones según el estado actual */}
          <div className="detalle-pedido__actions">
            {pedido.estado === 'recibido' && (
              <>
                <button
                  type="button"
                  onClick={handlePasarAPreparacion}
                  className="detalle-pedido__btn detalle-pedido__btn--primary"
                >
                  Preparar pedido
                </button>
                <button
                  type="button"
                  onClick={() => setModalRechazoOpen(true)}
                  className="detalle-pedido__btn detalle-pedido__btn--danger-outline"
                >
                  Rechazar pedido
                </button>
              </>
            )}

            {pedido.estado === 'en_preparacion' && (
              <>
                <button
                  type="button"
                  onClick={handleMarcarListo}
                  className="detalle-pedido__btn detalle-pedido__btn--success"
                >
                  Marcar como listo
                </button>

                <button
                  type="button"
                  onClick={handleVolverARecibido}
                  className="detalle-pedido__btn detalle-pedido__btn--secondary"
                >
                  Volver a recibido
                </button>

                <button
                  type="button"
                  onClick={() => setModalRechazoOpen(true)}
                  className="detalle-pedido__btn detalle-pedido__btn--danger-outline"
                >
                  Rechazar pedido
                </button>
              </>
            )}

            {pedido.estado === 'listo' && (
              <>
                <button
                  type="button"
                  onClick={handleEntregar}
                  className="detalle-pedido__btn detalle-pedido__btn--dark"
                >
                  Entregar pedido
                </button>

                <button
                  type="button"
                  onClick={handleVolverAPreparacion}
                  className="detalle-pedido__btn detalle-pedido__btn--secondary"
                >
                  Volver a preparación
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onBack}
              className="detalle-pedido__btn--back"
            >
              ← Volver a la bandeja
            </button>
          </div>
        </div>

        {/* COLUMNA DERECHA: Tarjeta Comensal + Avance del Estado */}
        <div className="detalle-pedido__sidebar">
          {/* Tarjeta COMENSAL */}
          <div className="detalle-pedido__side-card">
            <div className="detalle-pedido__side-title">
              COMENSAL
            </div>

            <div className="detalle-pedido__customer-header">
              <div className="detalle-pedido__avatar">
                {obtenerIniciales(pedido.comensalNombre)}
              </div>

              <div>
                <div className="detalle-pedido__customer-name">
                  {pedido.comensalNombre}
                </div>
                <div className="detalle-pedido__customer-history">
                  {pedido.comensalHistorial || '12 pedidos · 0 no recogidos'}
                </div>
              </div>
            </div>

            <div className="detalle-pedido__customer-contact">
              <div>{pedido.comensalTelefono || '987 654 321'}</div>
              <div>{pedido.comensalCorreo || 'comensal@aloe.ulima.edu.pe'}</div>
            </div>
          </div>

          {/* Tarjeta AVANCE DEL ESTADO */}
          <div className="detalle-pedido__side-card">
            <div className="detalle-pedido__side-title">
              AVANCE DEL ESTADO
            </div>

            <div className="detalle-pedido__steps">
              {[
                { key: 'recibido', num: 1, label: 'Recibido', time: pedido.horaRecibido || '11:02' },
                { key: 'en_preparacion', num: 2, label: 'En preparación', time: pedido.horaPreparacion || (pedido.estado === 'en_preparacion' ? '11:14' : null) },
                { key: 'listo', num: 3, label: 'Listo', time: pedido.horaListo || null },
                { key: 'entregado', num: 4, label: 'Entregado', time: pedido.horaEntrega || null }
              ].map((step) => {
                const st = getStepState(step.key);
                const isCompleted = st === 'completed';
                const isActive = st === 'active';

                return (
                  <div
                    key={step.key}
                    className="detalle-pedido__step-row"
                  >
                    <div className="detalle-pedido__step-left">
                      {isCompleted ? (
                        <span className="detalle-pedido__step-icon detalle-pedido__step-icon--completed">
                          <Check size={13} strokeWidth={3} />
                        </span>
                      ) : isActive ? (
                        <span className="detalle-pedido__step-icon detalle-pedido__step-icon--active">
                          {step.num}
                        </span>
                      ) : (
                        <span className="detalle-pedido__step-icon detalle-pedido__step-icon--pending">
                          {step.num}
                        </span>
                      )}

                      <span
                        className={
                          isActive
                            ? 'detalle-pedido__step-label--active'
                            : isCompleted
                              ? 'detalle-pedido__step-label--completed'
                              : 'detalle-pedido__step-label--pending'
                        }
                      >
                        {step.label}
                      </span>
                    </div>

                    {step.time && (
                      <span className="detalle-pedido__step-time">
                        {step.time}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Nota informativa inferior */}
            <div className="detalle-pedido__info-note">
              Al marcar «listo» el comensal recibe el aviso en su detalle de pedido.
            </div>
          </div>
        </div>
      </div>

      {/* Modal 5.3: Rechazo con motivo obligatorio */}
      <RechazarPedidoModal
        isOpen={modalRechazoOpen}
        pedido={pedido}
        onClose={() => setModalRechazoOpen(false)}
        onConfirmRechazo={handleConfirmRechazo}
      />
    </div>
  );
}
