import React, { createContext, useEffect, useRef, useState } from "react";
import {
  getCurrentSessionUser,
  loginUser,
  logoutUser,
  signupUser,
} from "@/features/auth/api/authApi";

type AuthState = "anonymous" | "guest" | "authenticated";
type UserSource = "backend" | "local";

export type AuthUser = {
  name: string;
  email: string;
  source: UserSource;
};

type LoginInput = {
  email: string;
  password: string;
};

type SignupInput = {
  name: string;
  email: string;
  password: string;
};

type MockAccount = {
  name: string;
  email: string;
  password: string;
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
const STORAGE_MOCK_ACCOUNTS = "yacs.auth.mockAccounts";

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

function getMockAccounts() {
  return readStorage<MockAccount[]>(STORAGE_MOCK_ACCOUNTS) ?? [];
}

function saveMockAccounts(accounts: MockAccount[]) {
  writeStorage(STORAGE_MOCK_ACCOUNTS, accounts);
}

function findMockAccount(email: string) {
  return getMockAccounts().find(
    (account) => account.email.toLowerCase() === email.toLowerCase()
  );
}

function upsertMockAccount(input: SignupInput) {
  const existing = findMockAccount(input.email);
  if (existing) {
    throw new Error("An account with this email already exists.");
  }

  const accounts = getMockAccounts();
  accounts.push({
    name: input.name,
    email: input.email,
    password: input.password,
  });
  saveMockAccounts(accounts);
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
            source: "backend",
          });
          return;
        }

        if (response.statusCode === 401 && mountedInitial.user?.source === "backend") {
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
          source: "backend",
        });
        return true;
      }

      const mockAccount = findMockAccount(input.email);
      if (mockAccount && mockAccount.password === input.password) {
        setAuthenticated({
          name: mockAccount.name,
          email: mockAccount.email,
          source: "local",
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
      const mockAccount = findMockAccount(input.email);
      if (mockAccount && mockAccount.password === input.password) {
        setAuthenticated({
          name: mockAccount.name,
          email: mockAccount.email,
          source: "local",
        });
        return true;
      }

      setError("Login failed. Please check your credentials and try again.");
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
      console.log("Signup response:", signupResponse);
      if (!signupResponse.ok || !signupResponse.success) {
        console.log("Setting error:", signupResponse.message);
        const errorMessage = signupResponse.message ?? "Unable to create account.";
        setError(errorMessage);
        window.alert("Signup failed: " + errorMessage);
        setIsBusy(false);
        return false;
      }

      // Signup succeeded, now log in
      try {
        upsertMockAccount(input);
      } catch (mockError) {
        // Mock account error is non-fatal
        console.warn("Mock account upsert failed:", mockError);
      }

      const loginResponse = await loginUser({
        email: input.email,
        password: input.password,
      });

      if (loginResponse.ok && loginResponse.success) {
        setAuthenticated({
          name: input.name,
          email: input.email,
          source: "backend",
        });
        return true;
      }

      setAuthenticated({
        name: input.name,
        email: input.email,
        source: "local",
      });
      return true;
    } catch (error) {
      console.log("Signup error:", error);
      setError(error instanceof Error ? error.message : "Network error during signup.");
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
