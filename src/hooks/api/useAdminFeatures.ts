"use client";

import { useAuth, isRealUser } from "@/contexts/AuthContext";
import { isAdminUserId } from "@/lib/auth/admin-user-ids";
import { useAiLibraryAccess } from "./useAiLibraryAccess";

/**
 * Centraliza regras de UI para biblioteca de áudio + IA (NEXT_USER_ADMIN / NEXT_PUBLIC_USER_ADMIN)
 * e reutiliza o probe de API (`useAiLibraryAccess`) para páginas que carregam dados.
 */
export function useAdminFeatures() {
  const { user } = useAuth();
  const realUser = isRealUser(user);
  const isAdmin = Boolean(user && realUser && isAdminUserId(user.uid));

  const aiLibraryAccess = useAiLibraryAccess();
  const { allowed } = aiLibraryAccess;
  /** UI da biblioteca/IA: env público OU probe da API (evita só ter NEXT_USER_ADMIN sem NEXT_PUBLIC). */
  const showAudioLibraryUi = Boolean(isAdmin || allowed);

  return {
    user,
    realUser,
    /** Usuário atual está na lista de admin (env no cliente, NEXT_PUBLIC_USER_ADMIN). */
    isAdmin,
    /** Navbar + cena: mesma regra que o acesso real à API GET /api/library. */
    showAudioLibraryNav: showAudioLibraryUi,
    showMyAudioLibraryLink: showAudioLibraryUi,
    showSaveToLibraryOnScene: showAudioLibraryUi,
    ...aiLibraryAccess,
  };
}
