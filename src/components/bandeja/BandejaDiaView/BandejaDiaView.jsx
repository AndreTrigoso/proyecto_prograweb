import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { pedidosService } from '../../../services/storageService';
import { ConfirmModal, StatusBadge } from '../../common';
import { RechazarPedidoModal } from '../RechazarPedidoModal/RechazarPedidoModal';
import { ChevronDown, Calendar } from 'lucide-react';
import './BandejaDiaView.css';

/**
 * 5.1 Bandeja del día
 * Fiel al Mockup 5.1 y especificaciones de HU-5:
 * - Columnas por estado (Recibidos, En preparación, Listos, Entregados) y agrupación por hora de recojo.
 * - Alerta de pedidos próximos a vencer (en 6 min) y bloque de Pedidos Vencidos (>15 min).
 * - Transiciones de estado directas y rechazo con motivo obligatorio.
 * - Estado de bandeja vacía ("Sin pedidos por ahora").
 */
export function BandejaDiaView({
  onSelectPedido,
  onNavigateEntregaCodigo,
  onNavigateMiCarta,
  onShowNotification
}) {
  const { currentUser } = useAuth();
  const { pedidos } = useData();

  const [agruparPor, setAgruparPor] = useState('estado'); // 'estado' | 'hora'
  const [groupMenuOpen, setGroupMenuOpen] = useState(false);

  // Modal de rechazo (5.3)
  const [pedidoARechazar, setPedidoARechazar] = useState(null);
  // Modal de confirmación destructiva para "No recogido"
  const [pedidoNoRecogido, setPedidoNoRecogido] = useState(null);

  const activeLocalId = currentUser?.localId || 'loc-central';

  // Todos los pedidos del local actual
  const todosPedidosLocal = pedidos.filter(p => p.localId === activeLocalId);

  // Separar pedidos vencidos (>15 min) de las columnas activas
  const pedidosVencidos = todosPedidosLocal.filter(p => p.vencido && p.estado === 'listo');

  const recibidos = todosPedidosLocal
    .filter(p => p.estado === 'recibido' && !p.vencido)
    .sort((a, b) => a.horaRecojo.localeCompare(b.horaRecojo));

  const enPreparacion = todosPedidosLocal
    .filter(p => p.estado === 'en_preparacion' && !p.vencido)
    .sort((a, b) => (a.minutosRestantes || 99) - (b.minutosRestantes || 99));

  const listos = todosPedidosLocal
    .filter(p => p.estado === 'listo' && !p.vencido)
    .sort((a, b) => a.horaRecojo.localeCompare(b.horaRecojo));

  const entregados = todosPedidosLocal
    .filter(p => p.estado === 'entregado')
    .sort((a, b) => (b.horaEntrega || '').localeCompare(a.horaEntrega || ''));

  const totalEnCola = recibidos.length + enPreparacion.length + listos.length;

  // Contar cantidad total de unidades en un pedido
  const contarUnidades = (pedido) => {
    return (pedido.items || []).reduce((acc, item) => acc + (item.cantidad || 1), 0);
  };

  // Contar notas en un pedido
  const contarNotas = (pedido) => {
    return (pedido.items || []).filter(item => item.nota && item.nota.trim().length > 0).length;
  };

  // Handlers de transición de estado
  const handlePasarAPreparacion = (e, pedido) => {
    e.stopPropagation();
    pedidosService.pasarAPreparacion(pedido.id);
    if (onShowNotification) {
      onShowNotification({
        type: 'info',
        title: `${pedido.codigoPedido} en preparación`,
        message: `El pedido de ${pedido.comensalNombre} pasó a cocina.`
      });
    }
  };

  const handleMarcarListo = (e, pedido) => {
    e.stopPropagation();
    pedidosService.marcarComoListo(pedido.id);
    if (onShowNotification) {
      onShowNotification({
        type: 'success',
        title: `${pedido.codigoPedido} listo para recoger`,
        message: `Se notificó a ${pedido.comensalNombre} que su pedido está listo.`
      });
    }
  };

  const handleEntregarPedido = (e, pedido) => {
    e.stopPropagation();
    pedidosService.entregar(pedido.id);
    if (onShowNotification) {
      onShowNotification({
        type: 'success',
        title: `${pedido.codigoPedido} entregado`,
        message: `Pedido entregado exitosamente a ${pedido.comensalNombre}.`
      });
    }
  };

  const handleConfirmRechazo = (pedidoId, categoria, detalle) => {
    const ped = pedidosService.rechazar(pedidoId, categoria, detalle);
    setPedidoARechazar(null);
    if (onShowNotification && ped) {
      onShowNotification({
        type: 'danger',
        title: `Pedido ${ped.codigoPedido} rechazado`,
        message: `Motivo registrado: ${categoria} — "${detalle}"`
      });
    }
  };

  const handleConfirmNoRecogido = () => {
    if (!pedidoNoRecogido) return;
    const ped = pedidosService.marcarNoRecogido(pedidoNoRecogido.id);
    setPedidoNoRecogido(null);
    if (onShowNotification && ped) {
      onShowNotification({
        type: 'danger',
        title: `${ped.codigoPedido} marcado como no recogido`,
        message: `El pedido vencido de ${ped.comensalNombre} fue retirado de la bandeja.`
      });
    }
  };

  // Agrupación por franja de hora de recojo
  const franjasHorarias = Array.from(
    new Set(
      [...recibidos, ...enPreparacion, ...listos, ...entregados].map(p => p.horaRecojo)
    )
  ).sort();

  const mostrarEstadoVacio = (
    recibidos.length === 0 &&
    enPreparacion.length === 0 &&
    listos.length === 0 &&
    entregados.length === 0 &&
    pedidosVencidos.length === 0
  );

  return (
    <div>
      {/* Migas de pan */}
      <div className="bandeja-breadcrumb">
        Atención &gt; Bandeja del día
      </div>

      {/* Cabecera de la Bandeja del día */}
      <div className="bandeja-header">
        <div>
          <h1 className="bandeja-title">Bandeja del día</h1>
          <p className="bandeja-subtitle">
            15/09/2026 · {todosPedidosLocal.length} pedidos de la jornada · {totalEnCola} en cola · hora actual 11:24
          </p>
        </div>

        {/* Controles superiores: Agrupar por y Entregar contra código */}
        <div className="bandeja-controls">
          {/* Selector Agrupar por: estado / hora de recojo */}
          <div className="bandeja-dropdown-wrapper">
            <button
              type="button"
              onClick={() => setGroupMenuOpen(!groupMenuOpen)}
              className="bandeja-btn-group"
            >
              <span>Agrupar por: {agruparPor === 'estado' ? 'estado' : 'hora de recojo'}</span>
              <ChevronDown size={14} />
            </button>

            {groupMenuOpen && (
              <div className="bandeja-dropdown-menu">
                {[
                  { id: 'estado', label: 'Agrupar por: estado (Columnas)' },
                  { id: 'hora', label: 'Agrupar por: hora de recojo' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setAgruparPor(opt.id);
                      setGroupMenuOpen(false);
                    }}
                    className={`bandeja-dropdown-item ${agruparPor === opt.id ? 'is-selected' : ''}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Botón primario: Entregar contra código */}
          <button
            type="button"
            onClick={onNavigateEntregaCodigo}
            className="bandeja-btn-entrega-codigo"
          >
            Entregar contra código
          </button>
        </div>
      </div>

      {/* ESTADO VACÍO: SIN PEDIDOS POR AHORA */}
      {mostrarEstadoVacio ? (
        <div className="bandeja-empty-card">
          <div className="bandeja-empty-icon">
            <Calendar size={24} />
          </div>

          <h2 className="bandeja-empty-title">Sin pedidos por ahora</h2>

          <p className="bandeja-empty-desc">
            Cuando llegue un pedido aparecerá aquí ordenado por su hora de recojo.
          </p>

          <button
            type="button"
            onClick={() => {
              if (onNavigateMiCarta) onNavigateMiCarta();
            }}
            className="bandeja-btn-revisar-carta"
          >
            Revisar mi carta
          </button>
        </div>
      ) : (
        <>
          {/* VISTA PRINCIPAL: 4 COLUMNAS POR ESTADO (como en Mockup 5.1) */}
          {agruparPor === 'estado' ? (
            <div className="bandeja-columns-grid">
              {/* COLUMNA 1: RECIBIDOS */}
              <div>
                <div className="bandeja-col-header recibidos">
                  <span>RECIBIDOS</span>
                  <span className="bandeja-col-count">{recibidos.length}</span>
                </div>

                <div className="bandeja-col-list">
                  {recibidos.map(ped => {
                    const numItems = contarUnidades(ped);
                    return (
                      <article
                        key={ped.id}
                        onClick={() => onSelectPedido(ped)}
                        className="bandeja-order-card"
                      >
                        <div className="bandeja-card-top">
                          <strong className="bandeja-card-code">{ped.codigoPedido}</strong>
                          <span className="bandeja-card-time">{ped.horaRecojo}</span>
                        </div>

                        <div className="bandeja-card-meta">
                          <div>{numItems} {numItems === 1 ? 'ítem' : 'ítems'} · S/ {Number(ped.total).toFixed(2)}</div>
                          <div>{ped.comensalNombre}</div>
                        </div>

                        <div className="bandeja-card-actions">
                          <button
                            type="button"
                            onClick={(e) => handlePasarAPreparacion(e, ped)}
                            className="bandeja-btn-preparar"
                          >
                            Preparar
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPedidoARechazar(ped);
                            }}
                            className="bandeja-btn-rechazar"
                          >
                            Rechazar
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>

              {/* COLUMNA 2: EN PREPARACIÓN */}
              <div>
                <div className="bandeja-col-header preparacion">
                  <span>EN PREPARACIÓN</span>
                  <span className="bandeja-col-count">{enPreparacion.length}</span>
                </div>

                <div className="bandeja-col-list">
                  {enPreparacion.map(ped => {
                    const numItems = contarUnidades(ped);
                    const numNotas = contarNotas(ped);
                    const isUrgent = ped.minutosRestantes !== undefined && ped.minutosRestantes <= 10;

                    return (
                      <article
                        key={ped.id}
                        onClick={() => onSelectPedido(ped)}
                        className={`bandeja-order-card ${isUrgent ? 'is-urgent' : ''}`}
                      >
                        <div className="bandeja-card-top">
                          <strong className="bandeja-card-code">{ped.codigoPedido}</strong>
                          <span className="bandeja-card-time">
                            en {ped.minutosRestantes || 15} min
                          </span>
                        </div>

                        <div className="bandeja-card-meta">
                          <div>{numItems} {numItems === 1 ? 'ítem' : 'ítems'} · recojo {ped.horaRecojo}</div>
                          <div>
                            {ped.comensalNombre}
                            {numNotas > 0 ? ` · ${numNotas} ${numNotas === 1 ? 'nota' : 'notas'}` : ''}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleMarcarListo(e, ped)}
                          className="bandeja-btn-listo"
                        >
                          Marcar listo
                        </button>
                      </article>
                    );
                  })}
                </div>
              </div>

              {/* COLUMNA 3: LISTOS */}
              <div>
                <div className="bandeja-col-header listos">
                  <span>LISTOS</span>
                  <span className="bandeja-col-count">{listos.length}</span>
                </div>

                <div className="bandeja-col-list">
                  {listos.map((ped, idx) => {
                    const numItems = contarUnidades(ped);
                    const isFirst = idx === 0;

                    return (
                      <article
                        key={ped.id}
                        onClick={() => onSelectPedido(ped)}
                        className={`bandeja-order-card ${isFirst ? 'is-ready-highlight' : ''}`}
                      >
                        <div className="bandeja-card-top">
                          <strong className="bandeja-card-code">{ped.codigoPedido}</strong>
                          <span className="bandeja-card-time">{ped.horaRecojo}</span>
                        </div>

                        <div className="bandeja-card-meta">
                          <div>{numItems} {numItems === 1 ? 'ítem' : 'ítems'} · S/ {Number(ped.total).toFixed(2)}</div>
                          <div>{ped.comensalNombre}</div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleEntregarPedido(e, ped)}
                          className="bandeja-btn-entregar"
                        >
                          Entregar
                        </button>
                      </article>
                    );
                  })}
                </div>
              </div>

              {/* COLUMNA 4: ENTREGADOS */}
              <div>
                <div className="bandeja-col-header entregados">
                  <span>ENTREGADOS</span>
                  <span className="bandeja-col-count">{entregados.length}</span>
                </div>

                <div className="bandeja-col-list">
                  {entregados.map(ped => {
                    const numItems = contarUnidades(ped);
                    return (
                      <article
                        key={ped.id}
                        onClick={() => onSelectPedido(ped)}
                        className="bandeja-order-card"
                      >
                        <div className="bandeja-card-top">
                          <strong className="bandeja-card-code">{ped.codigoPedido}</strong>
                          <span className="bandeja-card-time">{ped.horaRecojo}</span>
                        </div>

                        <div className="bandeja-card-meta no-actions">
                          <div>{numItems} {numItems === 1 ? 'ítem' : 'ítems'} · S/ {Number(ped.total).toFixed(2)}</div>
                          <div>{ped.comensalNombre} · entregado {ped.horaEntrega || '10:34'}</div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* MODO ALTERNATIVO: AGRUPADO POR HORA DE RECOJO */
            <div>
              {/* Contadores por estado rápidos */}
              <div className="bandeja-hora-badges">
                <StatusBadge status={`Recibidos: ${recibidos.length}`} type="pedido" />
                <StatusBadge status="en_preparacion" type="pedido" />
                <span className="bandeja-hora-counter-text">({enPreparacion.length})</span>
                <StatusBadge status="listo" type="pedido" solid />
                <span className="bandeja-hora-counter-text">({listos.length})</span>
                <StatusBadge status="entregado" type="pedido" />
                <span className="bandeja-hora-counter-text">({entregados.length})</span>
              </div>

              <div className="bandeja-hora-list">
                {franjasHorarias.map(franja => {
                  const pedidosFranja = [...recibidos, ...enPreparacion, ...listos, ...entregados].filter(
                    p => p.horaRecojo === franja
                  );
                  return (
                    <div key={franja} className="bandeja-franja-card">
                      <div className="bandeja-franja-header">
                        <h3 className="bandeja-franja-title">Franja de recojo: {franja} hrs</h3>
                        <span className="bandeja-franja-count">
                          {pedidosFranja.length} {pedidosFranja.length === 1 ? 'pedido' : 'pedidos'}
                        </span>
                      </div>

                      <div className="bandeja-franja-grid">
                        {pedidosFranja.map(ped => (
                          <div
                            key={ped.id}
                            onClick={() => onSelectPedido(ped)}
                            className="bandeja-franja-item"
                          >
                            <div className="bandeja-franja-item-top">
                              <strong className="bandeja-card-code">{ped.codigoPedido}</strong>
                              <StatusBadge status={ped.estado} type="pedido" size="sm" solid={ped.estado === 'listo'} />
                            </div>
                            <div className="bandeja-franja-item-meta">
                              <div>{ped.comensalNombre}</div>
                              <div>{contarUnidades(ped)} ítems · S/ {Number(ped.total).toFixed(2)}</div>
                            </div>

                            {ped.estado === 'recibido' && (
                              <div className="bandeja-card-actions">
                                <button
                                  type="button"
                                  onClick={(e) => handlePasarAPreparacion(e, ped)}
                                  className="bandeja-btn-preparar"
                                >
                                  Preparar
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPedidoARechazar(ped);
                                  }}
                                  className="bandeja-btn-rechazar"
                                >
                                  Rechazar
                                </button>
                              </div>
                            )}

                            {ped.estado === 'en_preparacion' && (
                              <button
                                type="button"
                                onClick={(e) => handleMarcarListo(e, ped)}
                                className="bandeja-btn-listo"
                              >
                                Marcar listo
                              </button>
                            )}

                            {ped.estado === 'listo' && (
                              <button
                                type="button"
                                onClick={(e) => handleEntregarPedido(e, ped)}
                                className="bandeja-btn-entregar"
                              >
                                Entregar
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PIEZA SUELTA INTEGRADA: PEDIDOS VENCIDOS (> 15 MINUTOS) */}
          {pedidosVencidos.length > 0 && (
            <section className="bandeja-vencidos-section">
              <div className="bandeja-vencidos-label">
                ALERTA · PEDIDOS VENCIDOS
              </div>

              {/* Banner de alerta */}
              <div className="bandeja-vencidos-alert">
                <strong>!</strong>
                <span>
                  {pedidosVencidos.length} {pedidosVencidos.length === 1 ? 'pedido pasó' : 'pedidos pasaron'} su franja de recojo hace más de 15 minutos. Revisa si el comensal ya no vendrá.
                </span>
              </div>

              {/* Tarjetas de pedidos vencidos */}
              <div className="bandeja-vencidos-grid">
                {pedidosVencidos.map(ped => {
                  const numItems = contarUnidades(ped);
                  return (
                    <div
                      key={ped.id}
                      onClick={() => onSelectPedido(ped)}
                      className="bandeja-vencido-card"
                    >
                      <div className="bandeja-vencido-top">
                        <strong className="bandeja-vencido-code">{ped.codigoPedido}</strong>
                        <span className="bandeja-vencido-badge">
                          Vencido {ped.vencidoMinutos || 20} min
                        </span>
                      </div>

                      <div className="bandeja-vencido-meta">
                        Recojo {ped.horaRecojo} · {numItems} {numItems === 1 ? 'ítem' : 'ítems'} · S/ {Number(ped.total).toFixed(2)}
                      </div>

                      <div className="bandeja-card-actions">
                        <button
                          type="button"
                          onClick={(e) => handleEntregarPedido(e, ped)}
                          className="bandeja-btn-entregar"
                        >
                          Entregar igual
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPedidoNoRecogido(ped);
                          }}
                          className="bandeja-btn-no-recogido"
                        >
                          No recogido
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}

      {/* Modal 5.3: Rechazo con motivo obligatorio */}
      <RechazarPedidoModal
        isOpen={!!pedidoARechazar}
        pedido={pedidoARechazar}
        onClose={() => setPedidoARechazar(null)}
        onConfirmRechazo={handleConfirmRechazo}
      />

      {/* Modal de confirmación para marcar como No Recogido */}
      <ConfirmModal
        isOpen={!!pedidoNoRecogido}
        title={`¿Marcar ${pedidoNoRecogido?.codigoPedido} como no recogido?`}
        message={`El pedido de ${pedidoNoRecogido?.comensalNombre} superó el tiempo de espera tras su franja (${pedidoNoRecogido?.horaRecojo}). Se registrará como no recogido en el resumen de la jornada.`}
        confirmText="Confirmar no recogido"
        cancelText="Volver"
        isDestructive={true}
        onConfirm={handleConfirmNoRecogido}
        onCancel={() => setPedidoNoRecogido(null)}
      />
    </div>
  );
}
