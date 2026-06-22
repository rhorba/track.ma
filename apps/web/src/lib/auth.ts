'use client';

import { useState, useEffect } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  organizationId: string;
  role: string;
}

function parseJwt(token: string): AuthUser | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name ?? payload.email,
      organizationId: payload.orgId,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('token');
  return token ? parseJwt(token) : null;
}

export function saveToken(token: string) {
  localStorage.setItem('token', token);
}

export function clearToken() {
  localStorage.removeItem('token');
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const logout = () => {
    clearToken();
    setUser(null);
  };

  const setLoggedIn = (token: string) => {
    saveToken(token);
    setUser(parseJwt(token));
  };

  return { user, logout, setLoggedIn };
}
