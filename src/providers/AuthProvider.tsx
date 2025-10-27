import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  provider?: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  status: AuthStatus;
  signIn: () => void;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const getApiUrl = (path: string) => {
  const base = import.meta.env.VITE_API_URL;
  if (!base) {
    return path;
  }
  return `${base.replace(/\/+$/, "")}${path}`;
};

const fetchCurrentUser = async (): Promise<AuthUser | null> => {
  const response = await fetch(getApiUrl("/auth/me"), {
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to verify authentication");
  }

  const payload = (await response.json()) as { user: AuthUser | null };
  return payload.user;
};

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const refresh = useCallback(async () => {
    try {
      const current = await fetchCurrentUser();
      setUser(current);
      setStatus(current ? "authenticated" : "unauthenticated");
    } catch (error) {
      console.error("Failed to refresh session", error);
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signIn = useCallback(() => {
    window.location.href = getApiUrl("/auth/google");
  }, []);

  const signOut = useCallback(async () => {
    await fetch(getApiUrl("/auth/logout"), {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      signIn,
      signOut,
      refresh,
    }),
    [user, status, signIn, signOut, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};
