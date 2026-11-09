import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, Sector, HealthStatus, RegisterInput, RegisterResponse } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  activeSector: Sector | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  health: HealthStatus | null;
  login: (username: string, password: string) => Promise<void>;
  adminLogin: (username: string, password: string) => Promise<void>;
  demoLogin: (sectorId: string) => Promise<void>;
  registerUser: (input: RegisterInput) => Promise<RegisterResponse>;
  switchSector: (sectorId: string) => Promise<void>;
  logout: () => void;
  setActiveSector: (sector: Sector | null) => void;
  refreshHealth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [activeSector, setActiveSector] = useState<Sector | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [health, setHealth] = useState<HealthStatus | null>(null);

  const refreshHealth = useCallback(async () => {
    try {
      const data = await api.getHealth();
      setHealth(data);
    } catch (err) {
      console.warn('Backend health check error:', err);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    const token = api.getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const data = await api.getMe();
      setUser(data.user);
      if (data.sector) {
        setActiveSector(data.sector);
      }
    } catch (err) {
      console.warn('Stored token invalid or expired:', err);
      api.logout();
      setUser(null);
      setActiveSector(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
    refreshHealth();
    const interval = setInterval(refreshHealth, 30000);
    return () => clearInterval(interval);
  }, [checkAuth, refreshHealth]);

  const login = async (username: string, password: string) => {
    const data = await api.login(username, password);
    setUser(data.user);
    if (data.sector) {
      setActiveSector(data.sector);
    }
  };

  const adminLogin = async (username: string, password: string) => {
    const data = await api.adminLogin(username, password);
    setUser(data.user);
    if (data.sector) {
      setActiveSector(data.sector);
    }
  };

  const registerUser = async (input: RegisterInput): Promise<RegisterResponse> => {
    return await api.register(input);
  };

  const demoLogin = async (sectorId: string) => {
    const data = await api.demoLogin(sectorId);
    setUser(data.user);
    if (data.sector) {
      setActiveSector(data.sector);
    }
  };

  const switchSector = async (sectorId: string) => {
    const data = await api.switchSector(sectorId);
    setUser(data.user);
    if (data.sector) {
      setActiveSector(data.sector);
    }
  };

  const logout = () => {
    api.logout();
    setUser(null);
    setActiveSector(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeSector,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isLoading,
        health,
        login,
        adminLogin,
        demoLogin,
        registerUser,
        switchSector,
        logout,
        setActiveSector,
        refreshHealth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
