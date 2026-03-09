"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const LOGIN_PATH = "/login";

/** Routes that require a logged-in user (logged out users are redirected to /login). */
const PROTECTED_PATH_PREFIXES = ["/dashboard", "/scene"];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some((prefix) =>
    pathname === prefix || pathname.startsWith(prefix + "/"),
  );
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated && isProtectedPath(pathname)) {
      router.replace(LOGIN_PATH);
    }
  }, [loading, isAuthenticated, pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated && isProtectedPath(pathname)) {
    return null;
  }

  return <>{children}</>;
}
