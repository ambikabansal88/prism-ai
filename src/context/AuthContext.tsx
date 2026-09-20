import React, { createContext, useContext, useState, useEffect } from "react";
import { User, AuthResponse } from "../types";
import { safeFetchJson } from "../utils/api";
import { safeStorage } from "../utils/storage";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string, avatarUrl?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogleCredential: (credential: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogleToken: (accessToken: string) => Promise<{ success: boolean; error?: string }>;
  loginAsGuest: () => { success: boolean };
  requestPasswordReset: (email: string) => Promise<{ success: boolean; code?: string; error?: string }>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (data: { name?: string; email?: string; avatarUrl?: string; currentPassword?: string; newPassword?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "chat_auth_token";
const USER_KEY = "chat_auth_user";
const LEGACY_SAVED_ACCOUNTS_KEY = "prism_saved_google_accounts";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize and verify persistent session
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Clean up legacy saved Google accounts to protect user privacy
        safeStorage.removeItem(LEGACY_SAVED_ACCOUNTS_KEY);

        const storedToken = safeStorage.getItem(TOKEN_KEY);
        const storedUser = safeStorage.getItem(USER_KEY);

        if (storedToken && storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setToken(storedToken);

            // Verify with server endpoint safely
            const res = await safeFetchJson<{ user: User }>("/api/auth/me", {
              headers: { Authorization: `Bearer ${storedToken}` },
            });

            if (res.ok && res.data?.user) {
              setUser(res.data.user);
              safeStorage.setJSON(USER_KEY, res.data.user);
            } else if (res.status === 401 || res.status === 403) {
              // Token explicitly invalid
              safeStorage.removeItem(TOKEN_KEY);
              safeStorage.removeItem(USER_KEY);
              setUser(null);
              setToken(null);
            }
          } catch (e) {
            console.warn("Auth session validation note:", e);
          }
        }
      } catch (err) {
        console.warn("Auth initialization error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Save session helper
  const saveSession = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    safeStorage.setItem(TOKEN_KEY, newToken);
    safeStorage.setJSON(USER_KEY, newUser);
  };

  // Listen for OAuth postMessage events (e.g. Google popup callback)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        if (!event || !event.data || typeof event.data !== "object") {
          return;
        }

        // Validate origin
        const origin = event.origin || "";
        if (
          origin &&
          !origin.endsWith(".run.app") &&
          !origin.includes("localhost") &&
          !origin.includes("127.0.0.1")
        ) {
          return;
        }

        if (
          event.data.type === "GOOGLE_OAUTH_SUCCESS" &&
          event.data.token &&
          event.data.user
        ) {
          saveSession(event.data.token, event.data.user);
        }
      } catch (err) {
        console.warn("OAuth postMessage handling note:", err);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // 1. Email + Password Login
  const login = async (email: string, password: string) => {
    try {
      const res = await safeFetchJson<{ token: string; user: User }>("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok || !res.data) {
        return { success: false, error: res.error || "Login failed" };
      }

      saveSession(res.data.token, res.data.user);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "Network error during login" };
    }
  };

  // 2. Signup
  const signup = async (name: string, email: string, password: string, avatarUrl?: string) => {
    try {
      const res = await safeFetchJson<{ token: string; user: User }>("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, avatarUrl }),
      });

      if (!res.ok || !res.data) {
        return { success: false, error: res.error || "Failed to create account" };
      }

      saveSession(res.data.token, res.data.user);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "Network error during signup" };
    }
  };

  // 3. Google Sign-In with Verified ID Token Credential (Google Identity Services)
  const loginWithGoogleCredential = async (credential: string) => {
    try {
      if (!credential || !credential.trim()) {
        return { success: false, error: "Missing Google credential token." };
      }

      const res = await safeFetchJson<{ token: string; user: User }>("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });

      if (!res.ok || !res.data) {
        return { success: false, error: res.error || "Google credential verification failed." };
      }

      saveSession(res.data.token, res.data.user);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "Network error verifying Google credential." };
    }
  };

  // 3.1 Google Sign-In with OAuth Access Token
  const loginWithGoogleToken = async (accessToken: string) => {
    try {
      if (!accessToken || !accessToken.trim()) {
        return { success: false, error: "Missing Google access token." };
      }

      const res = await safeFetchJson<{ token: string; user: User }>("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken }),
      });

      if (!res.ok || !res.data) {
        return { success: false, error: res.error || "Google access token verification failed." };
      }

      saveSession(res.data.token, res.data.user);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "Network error verifying Google access token." };
    }
  };

  // 3.5 Login as Guest
  const loginAsGuest = () => {
    const guestUser: User = {
      id: "guest_" + Date.now(),
      email: "guest@prismai.app",
      name: "Guest Explorer",
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=GuestExplorer`,
      createdAt: new Date().toISOString(),
    };
    saveSession("guest_token_" + Date.now(), guestUser);
    return { success: true };
  };

  // 4. Request Password Reset
  const requestPasswordReset = async (email: string) => {
    try {
      const res = await safeFetchJson<{ resetCode?: string }>("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok || !res.data) {
        return { success: false, error: res.error || "Failed to request password reset" };
      }

      return { success: true, code: res.data.resetCode };
    } catch (e: any) {
      return { success: false, error: e.message || "Network error during reset request" };
    }
  };

  // 5. Reset Password
  const resetPassword = async (email: string, code: string, newPassword: string) => {
    try {
      const res = await safeFetchJson<{ token?: string; user?: User }>("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, resetCode: code, newPassword }),
      });

      if (!res.ok || !res.data) {
        return { success: false, error: res.error || "Password reset failed" };
      }

      if (res.data.token && res.data.user) {
        saveSession(res.data.token, res.data.user);
      }

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "Network error during password reset" };
    }
  };

  // 6. Update Profile
  const updateProfile = async (data: {
    name?: string;
    email?: string;
    avatarUrl?: string;
    currentPassword?: string;
    newPassword?: string;
  }) => {
    if (!token) return { success: false, error: "Not authenticated" };

    try {
      const res = await safeFetchJson<{ user: User; token?: string }>("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok || !res.data?.user) {
        return { success: false, error: res.error || "Failed to update profile" };
      }

      const updatedUser = res.data.user;
      setUser(updatedUser);
      safeStorage.setJSON(USER_KEY, updatedUser);

      if (res.data.token) {
        setToken(res.data.token);
        safeStorage.setItem(TOKEN_KEY, res.data.token);
      }

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "Network error updating profile" };
    }
  };

  // 7. Logout
  const logout = () => {
    setUser(null);
    setToken(null);
    safeStorage.removeItem(TOKEN_KEY);
    safeStorage.removeItem(USER_KEY);
    safeStorage.removeItem(LEGACY_SAVED_ACCOUNTS_KEY);
    if (typeof window !== "undefined" && (window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.disableAutoSelect();
      } catch (e) {
        // ignore
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        signup,
        loginWithGoogleCredential,
        loginWithGoogleToken,
        loginAsGuest,
        requestPasswordReset,
        resetPassword,
        updateProfile,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
