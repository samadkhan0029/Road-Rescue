import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem('currentUser');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const validateToken = (token) => {
  if (!token) return false;
  try {
    const parts = token.split('.');
    return parts.length === 3; // Basic JWT validation
  } catch {
    return false;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(readStoredUser);

  const setUser = useCallback((nextUser) => {
    setUserState(nextUser);
    if (nextUser) {
      localStorage.setItem('currentUser', JSON.stringify(nextUser));
      localStorage.setItem('currentUserName', nextUser.fullName || nextUser.name || '');
    } else {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('currentUserName');
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentUserName');
    localStorage.removeItem('rememberedEmail');
    setUser(null);
  }, [setUser]);

  // Check if current session is valid
  const checkAuthStatus = useCallback(() => {
    const token = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('currentUser');
    
    if (!token || !storedUser || !validateToken(token)) {
      logout();
      return false;
    }
    
    try {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      return true;
    } catch {
      logout();
      return false;
    }
  }, [logout, setUser]);

  // Initialize auth status on mount
  React.useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const value = useMemo(
    () => ({
      user,
      fullName: user?.fullName || user?.name || '',
      role: user?.role || null,
      setUser,
      logout,
      checkAuthStatus,
      isAuthenticated: !!user && validateToken(localStorage.getItem('authToken')),
    }),
    [user, setUser, logout, checkAuthStatus]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components -- hook colocated with provider for this app size
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
