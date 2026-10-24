import React, { createContext, useContext, useState, useEffect } from 'react';
import { usuariosService } from '../services/storageService';
import { authService } from '../services/authService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => authService.restoreSession());

  useEffect(() => {
    const handleSessionChange = (e) => {
      setCurrentUser(e.detail);
    };
    window.addEventListener('pw_session_changed', handleSessionChange);
    return () => window.removeEventListener('pw_session_changed', handleSessionChange);
  }, []);

  const login = async (email, password, remember = false) => {
    const user = await authService.login({ email, password, remember });
    setCurrentUser(user);
    return user;
  };

  const logout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  const actualizarPerfil = async (valores) => {
    const user = await authService.updateProfile(currentUser.id, valores);
    setCurrentUser(user);
    return user;
  };

  const cambiarContrasena = async (valores) => {
    const user = await authService.changePassword(currentUser.id, valores);
    setCurrentUser(user);
    return user;
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
      actualizarPerfil,
      cambiarContrasena,
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
