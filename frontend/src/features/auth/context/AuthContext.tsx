import React, { createContext, useEffect, useRef, useState } from "react";
import {
  getCurrentSessionUser,
  loginUser,
  logoutUser,
  signupUser,
} from "@/features/auth/api/authApi";

type AuthState = "anonymous" | "guest" | "authenticated";

export type AuthUser = {
  name: string;
  email: string;
  preferredSemester?: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type SignupInput = {
  name: string;
  email: string;
  password: string;
  entryYear?: number;
};

type AuthContextValue = {
  state: AuthState;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isBusy: boolean;
  error: string | null;
  clearError: () => void;
  login: (input: LoginInput) => Promise<boolean>;
  signup: (input: SignupInput) => Promise<boolean>;
  logout: () => Promise<void>;
  continueAsGuest: () => void;
};

const STORAGE_AUTH_USER = "yacs.auth.user";
const STORAGE_GUEST = "yacs.auth.guest";

function readStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function clearStorage(key: string) {
  localStorage.removeItem(key);
}

function getInitialAuth() {
  const storedUser = readStorage<AuthUser>(STORAGE_AUTH_USER);
  if (storedUser) {
    return { state: "authenticated" as AuthState, user: storedUser };
  }

  const isGuest = readStorage<boolean>(STORAGE_GUEST);
  if (isGuest) {
    return { state: "guest" as AuthState, user: null };
  }

  return { state: "anonymous" as AuthState, user: null };
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initial = getInitialAuth();
  const initialRef = useRef(initial);
  const [state, setState] = useState<AuthState>(initial.state);
  const [user, setUser] = useState<AuthUser | null>(initial.user);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearAuthenticated = () => {
    setState("anonymous");
    setUser(null);
    clearStorage(STORAGE_AUTH_USER);
    clearStorage(STORAGE_GUEST);
  };

  const setAuthenticated = (nextUser: AuthUser) => {
    setState("authenticated");
    setUser(nextUser);
    writeStorage(STORAGE_AUTH_USER, nextUser);
    clearStorage(STORAGE_GUEST);
  };

  useEffect(() => {
    let cancelled = false;

    const hydrateAuthFromServer = async () => {
      const mountedInitial = initialRef.current;
      if (mountedInitial.state === "guest") {
        return;
      }

      setIsBusy(true);
      try {
        const response = await getCurrentSessionUser();
        if (cancelled) {
          return;
        }

        if (response.ok && response.success && response.user) {
          setAuthenticated({
            name: response.user.name,
            email: response.user.email,
            preferredSemester: response.user.preferred_semester,
          });
          return;
        }

        if (response.statusCode === 401 && mountedInitial.state === "authenticated") {
          clearAuthenticated();
        }
      } catch {
        // Keep existing local state on network failures.
      } finally {
        if (!cancelled) {
          setIsBusy(false);
        }
      }
    };

    void hydrateAuthFromServer();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (input: LoginInput) => {
    setError(null);
    setIsBusy(true);

    try {
      const response = await loginUser(input);
      if (response.ok && response.success) {
        setAuthenticated({
          name: response.user?.name ?? input.email,
          email: response.user?.email ?? input.email,
          preferredSemester: response.user?.preferred_semester,
        });
        return true;
      }

      if (response.statusCode === 429 || response.code === "rate_limited") {
        setError(response.message ?? "Too many failed login attempts. Please wait and try again.");
        return false;
      }

      if (response.statusCode === 401) {
        setError("Invalid email or password.");
        return false;
      }

      setError(response.message ?? "Unable to log in with those credentials.");
      return false;
    } catch {
      setError("Login failed. Please check your connection and try again.");
      return false;
    } finally {
      setIsBusy(false);
    }
  };

  const signup = async (input: SignupInput) => {
    setError(null);
    setIsBusy(true);

    try {
      const signupResponse = await signupUser(input);
      if (!signupResponse.ok) {
        setError(signupResponse.message ?? "Unable to create account.");
        setIsBusy(false);
        return false;
      }

      const loginResponse = await loginUser({
        email: input.email,
        password: input.password,
      });

      if (loginResponse.ok && loginResponse.success) {
        setAuthenticated({
          name: input.name,
          email: input.email,
          preferredSemester: loginResponse.user?.preferred_semester,
        });
        return true;
      }

      setError("Account created but login failed. Please try logging in.");
      return false;
    } catch {
      setError("Network error. Please check your connection and try again.");
      return false;
    } finally {
      setIsBusy(false);
    }
  };

  const logout = async () => {
    setError(null);
    setIsBusy(true);

    try {
      await logoutUser();
    } catch {
      // Ignore network errors during logout; local state still clears.
    } finally {
      clearAuthenticated();
      setIsBusy(false);
    }
  };

  const continueAsGuest = () => {
    setError(null);
    setState("guest");
    setUser(null);
    writeStorage(STORAGE_GUEST, true);
    clearStorage(STORAGE_AUTH_USER);
  };

  const clearError = () => setError(null);

  const value: AuthContextValue = {
    state,
    user,
    isAuthenticated: state === "authenticated",
    isGuest: state === "guest",
    isBusy,
    error,
    clearError,
    login,
    signup,
    logout,
    continueAsGuest,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
