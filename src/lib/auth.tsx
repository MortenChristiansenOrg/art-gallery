import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = "gallery_admin_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const loginMutation = useMutation(api.auth.login);

  // Restore token from session storage
  useEffect(() => {
    const savedToken = sessionStorage.getItem(TOKEN_KEY);
    if (savedToken) {
      setToken(savedToken);
      setIsAuthenticated(true);
    }
  }, []);

  // Validate token on mount (if we have one)
  const validation = useQuery(
    api.auth.validateSession,
    token ? { token } : "skip"
  );

  // If token becomes invalid, log out
  useEffect(() => {
    if (token && validation && !validation.valid) {
      logout();
    }
  }, [validation, token]);

  const login = async (password: string): Promise<boolean> => {
    try {
      const result = await loginMutation({ password });
      if (result.success && result.token) {
        setToken(result.token);
        setIsAuthenticated(true);
        sessionStorage.setItem(TOKEN_KEY, result.token);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    setIsAuthenticated(false);
    sessionStorage.removeItem(TOKEN_KEY);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
