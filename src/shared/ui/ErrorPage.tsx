"use client";

import Link from "next/link";

interface ErrorPageProps {
  message: string;
  backHref?: string;
  backLabel?: string;
  className?: string;
}

export function ErrorPage({
  message,
  backHref = "/dashboard",
  backLabel = "← Dashboard",
  className = "",
}: ErrorPageProps) {
  return (
    <div className={`min-h-screen bg-background px-4 py-8 ${className}`}>
      <h1 className="sr-only">Error</h1>
      <div
        className="mx-auto max-w-xl rounded-lg bg-red-500/20 p-4 text-red-200"
        role="alert"
      >
        {message}
      </div>
      {backHref && (
        <Link
          href={backHref}
          className="mt-4 inline-block text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          aria-label={backLabel}
        >
          {backLabel}
        </Link>
      )}
    </div>
  );
}

