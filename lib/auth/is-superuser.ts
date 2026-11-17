/**
 * Server-only Super User Authorization Service.
 * This file is guarded against being imported in client-side bundles.
 */

if (typeof window !== "undefined") {
  throw new Error("Security Violation: is-superuser is a server-only module.");
}

export const SUPERUSER_EMAILS = new Set([
  "bolajim@gmail.com",
  "dawodubolajim@gmail.com",
]);

export interface SimpleUserIdentity {
  email?: string | null;
  role?: string | null;
}

export function isSuperUser(user: SimpleUserIdentity | null | undefined): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;

  const envSuper = process.env.SUPERUSER_EMAIL?.trim().toLowerCase();
  const envAdmin = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const normalizedEmail = (user.email || "").trim().toLowerCase();

  return (
    SUPERUSER_EMAILS.has(normalizedEmail) ||
    Boolean(envSuper && normalizedEmail === envSuper) ||
    Boolean(envAdmin && normalizedEmail === envAdmin)
  );
}
