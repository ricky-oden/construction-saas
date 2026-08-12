"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { apiRequest } from "@/lib/api/client";
import {
  AUTH_CLEARED_EVENT,
  clearStoredToken,
  getStoredToken,
  storeToken,
} from "@/auth/storage";
import type { AuthUser, LoginResponse } from "@/auth/types";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  user: AuthUser | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>(() =>
    getStoredToken() ? "loading" : "unauthenticated",
  );

  useEffect(() => {
    const handleCleared = () => {
      setUser(null);
      setStatus("unauthenticated");
    };
    window.addEventListener(AUTH_CLEARED_EVENT, handleCleared);
    return () => window.removeEventListener(AUTH_CLEARED_EVENT, handleCleared);
  }, []);

  useEffect(() => {
    if (!getStoredToken()) return;
    let active = true;
    apiRequest<AuthUser>("/auth/me")
      .then((restoredUser) => {
        if (!active) return;
        setUser(restoredUser);
        setStatus("authenticated");
      })
      .catch(() => {
        if (!active) return;
        clearStoredToken(false);
        setUser(null);
        setStatus("unauthenticated");
      });
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiRequest<LoginResponse>("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    storeToken(response.token);
    setUser(response.user);
    setStatus("authenticated");
    return response.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      if (getStoredToken()) {
        await apiRequest<{ status: string }>("/auth/logout", {
          method: "POST",
        });
      }
    } catch {
      // Clear local authentication even if the server cannot revoke the token.
    } finally {
      clearStoredToken(false);
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  const value = useMemo(
    () => ({ user, status, login, logout }),
    [user, status, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
