"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { SignOutIcon } from "@/components/icons";

interface NavbarProps {
  /** Logo content (e.g. <SoundTableLogo />). If logoHref is set, logo is wrapped in a link. */
  logo: React.ReactNode;
  /** If provided, logo is a link (e.g. to /dashboard). */
  logoHref?: string;
}

export function Navbar({ logo, logoHref }: NavbarProps) {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-10 w-full border-b border-border bg-background backdrop-blur" role="banner">
      <div className="flex w-full items-center">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-4">
          <h1 className="text-base font-semibold text-foreground sm:text-xl">
            {logoHref ? (
              <Link
                href={logoHref}
                className="flex items-center gap-1 hover:opacity-90 transition-opacity"
                aria-label="Back to Dashboard"
              >
                {logo}
              </Link>
            ) : (
              logo
            )}
          </h1>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => signOut()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border text-foreground transition hover:bg-card sm:h-auto sm:w-auto sm:px-3 sm:py-2.5 sm:text-sm"
              aria-label="Sign out"
              title="Sign out"
            >
              <span className="sm:hidden" aria-hidden>
                <SignOutIcon className="h-5 w-5" />
              </span>
              <span className="hidden sm:inline">Sign out</span>
            </button>
            {user ? (
              <span className="flex items-center gap-2 rounded-lg border border-border bg-card/80 px-1.5 py-1.5 sm:px-3 sm:py-1.5 text-sm text-foreground min-w-0">
                {user.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt=""
                    width={28}
                    height={28}
                    className="h-7 w-7 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft/50 text-xs font-medium text-accent">
                    {(user.displayName ?? user.email ?? "?")[0].toUpperCase()}
                  </span>
                )}
                <span className="max-w-[140px] truncate hidden sm:inline">
                  {user.displayName ?? user.email ?? "User"}
                </span>
              </span>
            ) : null}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
