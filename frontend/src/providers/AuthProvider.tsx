import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  provider?: string | null;
  providerId?: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  status: AuthStatus;
  signIn: () => Promise<void>;
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
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const googleInitializedRef = useRef(false);
  const pendingSignInRef = useRef<{
    resolve: () => void;
    reject: (error: Error) => void;
  } | null>(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const settlePending = useCallback(
    (outcome: "success" | "cancel" | "error", error?: Error) => {
      const pending = pendingSignInRef.current;
      if (!pending) {
        return;
      }

      if (outcome === "success" || outcome === "cancel") {
        pending.resolve();
      } else {
        pending.reject(error ?? new Error("Failed to sign in with Google"));
      }

      pendingSignInRef.current = null;
    },
    [],
  );

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

  useEffect(() => {
    if (window.google?.accounts?.id) {
      setIsScriptLoaded(true);
      return;
    }

    let canceled = false;
    const scriptId = "google-identity-services";
    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;

    const handleLoad = () => {
      if (!canceled) {
        setIsScriptLoaded(true);
      }
    };

    const handleError = () => {
      if (!canceled) {
        console.error("Failed to load Google Identity Services script");
      }
    };

    if (existingScript) {
      existingScript.addEventListener("load", handleLoad);
      existingScript.addEventListener("error", handleError);

      return () => {
        canceled = true;
        existingScript.removeEventListener("load", handleLoad);
        existingScript.removeEventListener("error", handleError);
      };
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      handleLoad();
    };
    script.onerror = handleError;

    document.head.appendChild(script);

    return () => {
      canceled = true;
      script.onload = null;
      script.onerror = null;
    };
  }, []);

  const handleCredential = useCallback(
    async (response: google.accounts.id.CredentialResponse) => {
      const credential = response.credential;
      if (!credential) {
        console.info("Google sign-in cancelled: no credential returned");
        setStatus("unauthenticated");
        settlePending("cancel");
        return;
      }

      if (pendingSignInRef.current) {
        setStatus("loading");
      }

      try {
        const result = await fetch(getApiUrl("/auth/google"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ credential }),
        });

        if (!result.ok) {
          throw new Error("Failed to sign in with Google");
        }

        const payload = (await result.json()) as { user: AuthUser };
        setUser(payload.user);
        setStatus("authenticated");
        settlePending("success");
      } catch (error) {
        const normalizedError =
          error instanceof Error ? error : new Error("Failed to sign in with Google");
        console.error("Failed to complete Google sign-in", normalizedError);
        setUser(null);
        setStatus("unauthenticated");
        settlePending("error", normalizedError);
      }
    },
    [settlePending],
  );

  useEffect(() => {
    if (!isScriptLoaded || googleInitializedRef.current) {
      return;
    }

    if (!window.google?.accounts?.id) {
      return;
    }

    if (!googleClientId) {
      console.warn("VITE_GOOGLE_CLIENT_ID is not configured; Google sign-in is disabled.");
      return;
    }

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: handleCredential,
      auto_select: false,
      ux_mode: "popup",
      cancel_on_tap_outside: true,
    });

    googleInitializedRef.current = true;
    setIsGoogleReady(true);
  }, [googleClientId, handleCredential, isScriptLoaded]);

  const signIn = useCallback(() => {
    const googleInstance = window.google;
    if (!isGoogleReady || !googleInstance?.accounts?.id) {
      return Promise.reject(new Error("Google Identity Services not ready"));
    }

    if (!googleClientId) {
      return Promise.reject(new Error("Google client ID is not configured"));
    }

    if (pendingSignInRef.current) {
      return Promise.reject(new Error("Another sign-in request is already in progress"));
    }

    return new Promise<void>((resolve, reject) => {
      setStatus("loading");
      pendingSignInRef.current = { resolve, reject };
      const googleId = googleInstance.accounts.id;

      const invokePrompt = () => {
        try {
          googleId.prompt((notification) => {
            if (notification.isNotDisplayed()) {
              const reason = notification.getNotDisplayedReason() ?? undefined;
              setStatus("unauthenticated");
              if (reason === "suppressed_by_user") {
                console.info("Google sign-in prompt suppressed by the user");
                settlePending("cancel");
                return;
              }
              const message =
                reason && reason !== "unknown"
                  ? `Google sign-in prompt not displayed: ${reason}`
                  : "Google sign-in prompt was not displayed";
              console.warn(message);
              settlePending("error", new Error(message));
              return;
            }

            if (notification.isSkippedMoment()) {
              const reason = notification.getSkippedReason() ?? undefined;
              setStatus("unauthenticated");
              if (reason === "user_cancel" || reason === "not_opted_in") {
                console.info(`Google sign-in skipped by user (${reason})`);
                settlePending("cancel");
              } else {
                const message =
                  reason && reason !== "unknown"
                    ? `Google sign-in skipped: ${reason}`
                    : "Google sign-in was skipped";
                console.warn(message);
                settlePending("error", new Error(message));
              }
              return;
            }

            if (notification.isDismissedMoment()) {
              const reason = notification.getDismissedReason() ?? undefined;
              if (reason === "credential_returned") {
                return;
              }

              setStatus("unauthenticated");
              if (reason === "user_cancel" || reason === "tap_outside" || reason === "cancel_called") {
                console.info(`Google sign-in dismissed by user (${reason})`);
                settlePending("cancel");
              } else {
                const message =
                  reason && reason !== "unknown_reason"
                    ? `Google sign-in dismissed: ${reason}`
                    : "Google sign-in was dismissed";
                console.warn(message);
                settlePending("error", new Error(message));
              }
            }
          });
        } catch (error) {
          setStatus("unauthenticated");
          settlePending(
            "error",
            error instanceof Error ? error : new Error("Failed to trigger Google sign-in"),
          );
        }
      };

      window.setTimeout(invokePrompt, 0);
    });
  }, [googleClientId, isGoogleReady, settlePending]);

  const signOut = useCallback(async () => {
    await fetch(getApiUrl("/auth/logout"), {
      method: "POST",
      credentials: "include",
    });
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
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
