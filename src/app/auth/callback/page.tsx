"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/db/supabase/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "error">("loading");

  useEffect(() => {
    const client = supabase;
    const code = searchParams.get("code");
    const redirectToDashboard = "/dashboard";

    if (!client) {
      queueMicrotask(() => setStatus("error"));
      setTimeout(() => router.replace("/login"), 2000);
      return;
    }

    if (!code) {
      router.replace("/login");
      return;
    }

    client.auth
      .exchangeCodeForSession(code)
      .then(async () => {
        const { data: aal } =
          await client.auth.mfa.getAuthenticatorAssuranceLevel();
        const needsMfa =
          aal?.nextLevel === "aal2" && aal?.nextLevel !== aal?.currentLevel;
        if (needsMfa) {
          router.replace(
            `/login/verify?next=${encodeURIComponent(redirectToDashboard)}`,
          );
        } else {
          if (typeof window !== "undefined") {
            window.location.replace(redirectToDashboard);
          } else {
            router.replace(redirectToDashboard);
          }
        }
      })
      .catch(() => {
        setStatus("error");
        setTimeout(() => router.replace("/login"), 2000);
      });
  }, [searchParams, router]);

  if (status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
        <p className="text-center text-muted">
          Failed to complete login. Redirecting...
        </p>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
      <p className="text-center text-muted">
        Completing login with Google...
      </p>
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
    </div>
  );
}
