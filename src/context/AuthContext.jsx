import React, { createContext, useContext, useState, useEffect } from 'react';
import { usuariosService } from '../services/storageService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => usuariosService.getCurrentSession());

  useEffect(() => {
    const handleSessionChange = (e) => {
      setCurrentUser(e.detail);
    };
    window.addEventListener('pw_session_changed', handleSessionChange);
    return () => window.removeEventListener('pw_session_changed', handleSessionChange);
  }, []);

  const login = (email, password) => {
    const user = usuariosService.getByEmail(email);
    if (!user) {
      throw new Error('Correo o contraseña incorrectos.');
    }
    if (user.estadoCuenta === 'bloqueado') {
      throw new Error(`Cuenta bloqueada: ${user.motivoBloqueo || 'Consulte con administración'}`);
    }
    usuariosService.setCurrentSession(user);
    setCurrentUser(user);
    return user;
  };

  const logout = () => {
    usuariosService.setCurrentSession(null);
    setCurrentUser(null);
  };

  // Helper para alternar rápidamente entre roles durante desarrollo y evaluación
  const switchRole = (rol, userId = null) => {
    if (rol === 'visitante') {
      logout();
      return;
    }
    const allUsers = usuariosService.getAll();
    let target = null;
    if (userId) {
      target = allUsers.find(u => u.id === userId);
    } else {
      target = allUsers.find(u => u.rol === rol);
    }
    if (target) {
      usuariosService.setCurrentSession(target);
      setCurrentUser(target);
    }
  };

  const currentRole = currentUser?.rol || 'visitante';

  return (
    <AuthContext.Provider value={{
      currentUser,
      currentRole,
      isAuthenticated: !!currentUser,
      login,
      logout,
      switchRole
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
