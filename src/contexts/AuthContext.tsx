"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { clearSupabaseUserIdCache } from "@/lib/storage";

const DEMO_UID = "demo-user-local";

/** When true, app is freely accessible without login. Set to "false" to require login. */
const FREE_ACCESS = process.env.NEXT_PUBLIC_FREE_ACCESS !== "false";

/** Unified user shape used across the app (compatible with storage userId = user.uid). */
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

function getDemoUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  return {
    uid: DEMO_UID,
    email: null,
    displayName: "User",
    photoURL: null,
  };
}

function mapSupabaseUser(
  user: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  } | null,
): AuthUser | null {
  if (!user) return null;
  const meta = user.user_metadata ?? {};
  return {
    uid: user.id,
    email: user.email ?? null,
    displayName: (meta.full_name as string) ?? (meta.name as string) ?? null,
    photoURL: (meta.avatar_url as string) ?? null,
  };
}

/** True only when the user has a real Supabase session (not demo/local). */
export function isRealUser(user: AuthUser | null): boolean {
  return user != null && user.uid !== DEMO_UID;
}

interface AuthContextValue {
  user: AuthUser | null;
  /** True when logged in with Google/Supabase (dashboard etc. require this). */
  isAuthenticated: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  signInDemo: () => void;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) {
      if (FREE_ACCESS) {
        queueMicrotask(() => {
          setUser(getDemoUser());
          setLoading(false);
        });
      } else {
        const stored =
          typeof window !== "undefined" &&
          localStorage.getItem("audio_scenes_demo") === "1";
        queueMicrotask(() => {
          setUser(stored ? getDemoUser() : null);
          setLoading(false);
        });
      }
      return;
    }
    const client = supabase;
    const setUserFromSession = async () => {
      const {
        data: { user: supaUser },
      } = await client.auth.getUser();
      const mapped = mapSupabaseUser(supaUser);
      if (mapped) {
        setUser(mapped);
      } else if (FREE_ACCESS) {
        setUser(getDemoUser());
      } else {
        const stored =
          typeof window !== "undefined" &&
          localStorage.getItem("audio_scenes_demo") === "1";
        setUser(stored ? getDemoUser() : null);
      }
      setLoading(false);
    };
    setUserFromSession();
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      const mapped = mapSupabaseUser(session?.user ?? null);
      if (mapped) {
        setUser(mapped);
      } else if (FREE_ACCESS) {
        setUser(getDemoUser());
      } else {
        const stored =
          typeof window !== "undefined" &&
          localStorage.getItem("audio_scenes_demo") === "1";
        setUser(stored ? getDemoUser() : null);
      }
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const client = supabase;
    if (!client) throw new Error("Supabase is not configured");
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : undefined;
    const { error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) throw error;
    // Browser redirects to Google, then to /auth/callback?code=... which exchanges the code and sends user to /dashboard
  };

  const signInDemo = () => {
    if (typeof window !== "undefined")
      localStorage.setItem("audio_scenes_demo", "1");
    setUser(getDemoUser());
  };

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
    clearSupabaseUserIdCache();
    if (typeof window !== "undefined")
      localStorage.removeItem("audio_scenes_demo");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: isRealUser(user),
        loading,
        signInWithGoogle,
        signOut,
        signInDemo,
        isConfigured: isSupabaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
