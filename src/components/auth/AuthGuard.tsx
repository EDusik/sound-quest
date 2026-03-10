"use client";

import { useAuth } from "@/contexts/AuthContext";

/**
 * Wraps the app and shows loading until auth state is ready.
 * All routes are accessible without logging in; no redirects.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
