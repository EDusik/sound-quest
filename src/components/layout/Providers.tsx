"use client";

import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { I18nProvider } from "@/contexts/I18nContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AudioBar } from "@/components/audio/AudioBar";
import { GlobalAuthLoading } from "@/components/auth/GlobalAuthLoading";
import { ThemeFavicon } from "@/components/theme/ThemeFavicon";
import { queryClient } from "@/lib/queryClient";
import { useMigrateLocalScenesOnLogin } from "@/hooks/useMigrateLocalScenesOnLogin";

/** Routes that render immediately without waiting for auth (better LCP). */
const PUBLIC_ROUTES = ["/", "/support", "/login"];

function AuthShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { loading } = useAuth();
  const isPublicRoute = pathname != null && PUBLIC_ROUTES.includes(pathname);

  useMigrateLocalScenesOnLogin();

  if (loading && !isPublicRoute) return <GlobalAuthLoading />;
  if (isPublicRoute) {
    return (
      <>
        {children}
        <AudioBar />
      </>
    );
  }
  return (
    <AuthGuard>
      {children}
      <AudioBar />
    </AuthGuard>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nProvider>
          <ThemeFavicon />
          <AuthProvider>
            <AuthShell>{children}</AuthShell>
          </AuthProvider>
        </I18nProvider>
        <Toaster richColors position="top-right" closeButton />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
