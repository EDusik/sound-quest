"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/Spinner";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (isAuthenticated) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  return (
    <div className="flex min-h-full items-center justify-center bg-background" role="status" aria-live="polite" aria-label="Loading">
      <Spinner />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
