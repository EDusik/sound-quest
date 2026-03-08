/**
 * Extracts a user-friendly error message from an unknown error.
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err)
    return String((err as { message: string }).message);
  return fallback;
}
