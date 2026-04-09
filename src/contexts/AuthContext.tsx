"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/db/supabase/supabase";
import { clearSupabaseUserIdCache } from "@/lib/storage/storage";
import { ANONYMOUS_UID } from "@/lib/auth/authConstants";

const DEMO_UID = ANONYMOUS_UID;

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

/** Chat bubble label: OAuth display name, else email local part before @. */
export function getUserChatLabel(user: AuthUser | null): string | undefined {
  if (!user) return undefined;
  const name = user.displayName?.trim();
  if (name) return name;
  const email = user.email?.trim();
  const local = email?.split("@")[0]?.trim();
  if (local) return local;
  return undefined;
}

interface AuthContextValue {
  user: AuthUser | null;
  /** True when logged in with Google/Supabase (storage uses Supabase; otherwise localStorage). */
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
      queueMicrotask(() => {
        setUser(getDemoUser());
        setLoading(false);
      });
      return;
    }
    const client = supabase;
    const setUserFromSession = async () => {
      const {
        data: { user: supaUser },
      } = await client.auth.getUser();
      const mapped = mapSupabaseUser(supaUser);
      setUser(mapped ?? getDemoUser());
      setLoading(false);
    };
    setUserFromSession();
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      const mapped = mapSupabaseUser(session?.user ?? null);
      setUser(mapped ?? getDemoUser());
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
    setUser(getDemoUser());
  };

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
    clearSupabaseUserIdCache();
    setUser(getDemoUser());
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
