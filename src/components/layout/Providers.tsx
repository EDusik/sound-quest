"use client";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AudioBar } from "@/components/audio/AudioBar";
import { GlobalAuthLoading } from "@/components/auth/GlobalAuthLoading";
import { ThemeFavicon } from "@/components/theme/ThemeFavicon";

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
    <ThemeProvider>
      <ThemeFavicon />
      <AuthProvider>
        <AuthShell>{children}</AuthShell>
      </AuthProvider>
    </ThemeProvider>
  );
}
