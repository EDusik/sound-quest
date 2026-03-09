"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { I18nProvider } from "@/contexts/I18nContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AudioBar } from "@/components/audio/AudioBar";
import { GlobalAuthLoading } from "@/components/auth/GlobalAuthLoading";
import { ThemeFavicon } from "@/components/theme/ThemeFavicon";
import { queryClient } from "@/lib/queryClient";

function AuthShell({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();
  if (loading) return <GlobalAuthLoading />;
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
      </ThemeProvider>
    </QueryClientProvider>
  );
}
