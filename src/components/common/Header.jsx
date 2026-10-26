import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useData } from '../../context/DataContext';
import { localesService, usuariosService } from '../../services/storageService';
import { ShoppingBag, LogOut, ChevronDown, Store, User } from 'lucide-react';

export function Header({ onOpenAuthModal, activeTab, setActiveTab, onShowNotification, onOpenAccount }) {
  const { currentUser, currentRole, logout } = useAuth();
  const { totalItemsCount, setIsDrawerOpen, activeLocal } = useCart();
  const { locales } = useData();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [localSelectorOpen, setLocalSelectorOpen] = useState(false);
  const [estadoDropdownOpen, setEstadoDropdownOpen] = useState(false);

  const assignedLocal = currentRole === 'local'
    ? (locales.find(l => l.id === currentUser?.localId) || locales[0])
    : null;

  const isDarkMode = currentRole === 'local' || currentRole === 'administrador';

  const handleEstadoLocalChange = (nuevoEstado) => {
    if (assignedLocal) {
      localesService.updateEstado(assignedLocal.id, nuevoEstado);
      setEstadoDropdownOpen(false);
      if (onShowNotification) {
        onShowNotification({
          type: nuevoEstado === 'abierto' ? 'success' : 'info',
          title: 'Estado del local actualizado',
          message: `${assignedLocal.nombreComercial} ahora está ${nuevoEstado.toUpperCase()}.`
        });
      }
    }
  };

  const handleSelectLocalForSession = (loc) => {
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        localId: loc.id,
        apellidos: loc.nombreComercial
      };
      usuariosService.setCurrentSession(updatedUser);
      setLocalSelectorOpen(false);
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'abierto':
        return { bg: '#5B9B2E', text: '#FFFFFF', label: 'Abierto' };
      case 'suspendido':
        return { bg: '#B7791F', text: '#FFFFFF', label: 'Suspendido' };
      case 'cerrado':
        return { bg: '#B4322B', text: '#FFFFFF', label: 'Cerrado' };
      default:
        return { bg: '#5B9B2E', text: '#FFFFFF', label: 'Abierto' };
    }
  };

  const estadoConfig = assignedLocal ? getEstadoColor(assignedLocal.estado) : null;

  return (
    <header
      style={{
        backgroundColor: isDarkMode ? '#261915' : 'var(--color-surface)',
        color: isDarkMode ? '#FFFFFF' : 'var(--color-text)',
        borderBottom: isDarkMode ? '1px solid #362823' : '1px solid var(--color-border)',
        position: 'sticky',
        top: 0,
        zIndex: 500
      }}
    >
      <div
        style={{
          height: '64px',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-4)'
        }}
      >
        {/* Izquierda: Logotipo Campus Pide + Selector de Local */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '6px',
              cursor: 'pointer'
            }}
            onClick={() => setActiveTab && setActiveTab('locales')}
          >
            <span
              style={{
                fontFamily: 'var(--font-family-title)',
                fontSize: '19px',
                fontWeight: '700',
                color: isDarkMode ? '#FFFFFF' : 'var(--color-text)'
              }}
            >
              Campus Pide
            </span>
            {currentRole === 'local' && (
              <span style={{ fontSize: '13px', color: '#B5A59E', fontWeight: '400' }}>
                · panel del local
              </span>
            )}
            {currentRole === 'administrador' && (
              <span style={{ fontSize: '13px', color: '#B5A59E', fontWeight: '400' }}>
                · administración
              </span>
            )}
          </div>

          {/* Selector de Cafetería para rol LOCAL (como en el Mockup) */}
          {currentRole === 'local' && assignedLocal && (
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setLocalSelectorOpen(!localSelectorOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: '#31221D',
                  border: '1px solid #4A3730',
                  borderRadius: '10px',
                  padding: '7px 14px',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                <span
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '5px',
                    backgroundColor: '#5C4740',
                    display: 'inline-block'
                  }}
                />
                <span>{assignedLocal.nombreComercial}</span>
                <ChevronDown size={14} style={{ color: '#B5A59E' }} />
              </button>

              {localSelectorOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '112%',
                    left: 0,
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-warm-lg)',
                    padding: '6px',
                    minWidth: '220px',
                    zIndex: 600
                  }}
                >
                  <div style={{ padding: '4px 10px', fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: '600' }}>
                    CAMBIAR LOCAL ACTIVO
                  </div>
                  {locales.map(loc => (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => handleSelectLocalForSession(loc)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 10px',
                        border: 'none',
                        borderRadius: '8px',
                        backgroundColor: loc.id === assignedLocal.id ? 'var(--color-primary-soft)' : 'transparent',
                        color: loc.id === assignedLocal.id ? 'var(--color-primary)' : 'var(--color-text)',
                        fontWeight: loc.id === assignedLocal.id ? '600' : '400',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span>{loc.nombreComercial}</span>
                      <span style={{ fontSize: '11px', opacity: 0.75 }}>{loc.estado}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Centro (para Visitante / Comensal) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          {currentRole === 'visitante' && (
            <nav style={{ display: 'flex', gap: 'var(--space-5)' }}>
              <a
                href="#locales"
                onClick={(e) => { e.preventDefault(); setActiveTab && setActiveTab('locales'); }}
                style={{ fontSize: '15px', fontWeight: '500', color: 'var(--color-text)' }}
              >
                Locales
              </a>
              <a
                href="#como-funciona"
                onClick={(e) => { e.preventDefault(); setActiveTab && setActiveTab('como-funciona'); }}
                style={{ fontSize: '15px', fontWeight: '500', color: 'var(--color-text-muted)' }}
              >
                Cómo funciona
              </a>
            </nav>
          )}

          {currentRole === 'comensal' && activeLocal && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                backgroundColor: '#FAF5F1',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px'
              }}
            >
              <Store size={15} style={{ color: 'var(--color-primary)' }} />
              <span style={{ color: 'var(--color-text-muted)' }}>Local activo:</span>
              <strong style={{ color: 'var(--color-text)' }}>{activeLocal.nombreComercial}</strong>
            </div>
          )}
        </div>

        {/* Derecha: Estado del local + Menú de cuenta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Conmutador de Estado del local exacto al Mockup */}
          {currentRole === 'local' && assignedLocal && estadoConfig && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
              <span style={{ fontSize: '13px', color: '#D4C5BF' }}>Estado del local:</span>
              <button
                type="button"
                onClick={() => setEstadoDropdownOpen(!estadoDropdownOpen)}
                style={{
                  backgroundColor: estadoConfig.bg,
                  color: estadoConfig.text,
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{estadoConfig.label}</span>
                <ChevronDown size={14} />
              </button>

              {estadoDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '115%',
                    right: 0,
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-warm-lg)',
                    border: '1px solid var(--color-border)',
                    padding: '6px',
                    minWidth: '190px',
                    zIndex: 600
                  }}
                >
                  {[
                    { key: 'abierto', label: 'Abierto (Recibiendo)', dot: '#5B9B2E' },
                    { key: 'suspendido', label: 'Recepción suspendida', dot: '#B7791F' },
                    { key: 'cerrado', label: 'Cerrado', dot: '#B4322B' }
                  ].map(st => (
                    <button
                      key={st.key}
                      type="button"
                      onClick={() => handleEstadoLocalChange(st.key)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 10px',
                        border: 'none',
                        borderRadius: '6px',
                        backgroundColor: assignedLocal.estado === st.key ? '#FAF5F1' : 'transparent',
                        fontWeight: assignedLocal.estado === st.key ? '600' : '400',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: st.dot }} />
                      {st.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentRole === 'visitante' ? (
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button
                type="button"
                className="btn btn-tertiary btn-sm"
                onClick={() => onOpenAuthModal && onOpenAuthModal('login')}
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => onOpenAuthModal && onOpenAuthModal('registro')}
              >
                Crear cuenta
              </button>
            </div>
          ) : (
            <>
              {currentRole === 'comensal' && (
                <button
                  type="button"
                  className="btn btn-tertiary btn-icon"
                  onClick={() => setIsDrawerOpen(true)}
                  style={{ position: 'relative' }}
                  title="Ver carrito"
                >
                  <ShoppingBag size={20} />
                  {totalItemsCount > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        backgroundColor: 'var(--color-primary)',
                        color: '#FFFFFF',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        fontSize: '11px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid var(--color-surface)'
                      }}
                    >
                      {totalItemsCount}
                    </span>
                  )}
                </button>
              )}

              {/* Botón de cuenta estilo Mockup: [ CC  Encargado ▾ ] */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '5px 12px 5px 6px',
                    borderRadius: '999px',
                    border: isDarkMode ? '1px solid #4A3730' : '1px solid var(--color-border)',
                    backgroundColor: isDarkMode ? '#31221D' : 'var(--color-surface)',
                    color: isDarkMode ? '#FFFFFF' : 'var(--color-text)',
                    cursor: 'pointer'
                  }}
                >
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: '#FCEAE7',
                      color: '#D6402F',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: '700'
                    }}
                  >
                    {currentRole === 'local' ? 'CC' : (currentUser?.nombres?.charAt(0) || 'U')}
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '500' }}>
                    {currentUser?.nombres || 'Encargado'}
                  </span>
                  <ChevronDown size={14} style={{ color: isDarkMode ? '#B5A59E' : 'inherit' }} />
                </button>

                {userMenuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '115%',
                      right: 0,
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-warm-lg)',
                      border: '1px solid var(--color-border)',
                      minWidth: '210px',
                      padding: '8px',
                      zIndex: 600
                    }}
                  >
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border)' }}>
                      <p style={{ fontSize: '14px', fontWeight: '600' }}>
                        {currentUser?.nombres} {currentUser?.apellidos}
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        {currentUser?.correo}
                      </p>
                    </div>

                    {onOpenAccount && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenAccount();
                          setUserMenuOpen(false);
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '10px 12px',
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-text)',
                          fontSize: '13px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: 'pointer'
                        }}
                      >
                        <User size={16} />
                        Mi cuenta
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setUserMenuOpen(false);
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 12px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-danger)',
                        fontSize: '13px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      <LogOut size={16} />
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
