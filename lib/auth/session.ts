import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isLocalDevModeAllowed, isSupabaseConfigured } from "@/lib/config/env";
import { localDevDb, verifySessionToken, verifySessionTokenFull } from "@/lib/data/local-dev-store";

export const DEV_SESSION_COOKIE = "vitra_dev_session";

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  country: string;
  emailVerified: boolean;
  role: "user" | "admin";
  provider: "supabase" | "local-dev";
  planId?: "starter" | "pro" | "executive" | null;
  maxCvs: number;
  generatedCvsCount: number;
  planPurchasedAt?: string | null;
  avatarUrl?: string | null;
}

import { isSuperUser, SUPERUSER_EMAILS } from "./is-superuser";
export { isSuperUser, SUPERUSER_EMAILS };

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, country, plan_id, max_cvs, plan_purchased_at, generated_cvs_count, role, avatar_url")
          .eq("id", user.id)
          .maybeSingle();

        const normalizedEmail = (user.email || "").trim().toLowerCase();
        const isOwner = SUPERUSER_EMAILS.has(normalizedEmail);
        const assignedRole: "user" | "admin" =
          profile?.role === "admin" || isOwner ? "admin" : "user";

        return {
          id: user.id,
          email: user.email || "",
          fullName:
            profile?.full_name ||
            (user.user_metadata?.full_name as string | undefined) ||
            user.email?.split("@")[0] ||
            "Vitra User",
          country: profile?.country || "Nigeria",
          emailVerified: Boolean(user.email_confirmed_at),
          role: assignedRole,
          provider: "supabase",
          planId: (profile?.plan_id as "starter" | "pro" | "executive") || (isOwner ? "executive" : null),
          maxCvs: isOwner ? 999 : Number(profile?.max_cvs || 0),
          generatedCvsCount: Number(profile?.generated_cvs_count || 0),
          planPurchasedAt: profile?.plan_purchased_at || (isOwner ? new Date().toISOString() : null),
          avatarUrl: (profile?.avatar_url as string | undefined) || (user.user_metadata?.avatar_url as string | undefined) || null,
        };
      }
    }
  }

  // Fallback to companion or local session token
  const cookieStore = await cookies();
  const token = cookieStore.get(DEV_SESSION_COOKIE)?.value;
  if (token) {
    const sessionData = verifySessionTokenFull(token);
    if (sessionData?.userId) {
      const user = localDevDb.getUserById(sessionData.userId);
      const email = user?.email || sessionData.email || "";
      const normalizedEmail = email.trim().toLowerCase();
      const isOwner = SUPERUSER_EMAILS.has(normalizedEmail);
      const assignedRole: "user" | "admin" =
        user?.role === "admin" || sessionData.role === "admin" || isOwner ? "admin" : "user";

      return {
        id: sessionData.userId,
        email,
        fullName: user?.fullName || email.split("@")[0] || "Vitra User",
        country: user?.country || "Nigeria",
        emailVerified: user?.emailVerified ?? true,
        role: assignedRole,
        provider: "local-dev",
        planId: user?.planId || (isOwner ? "executive" : null),
        maxCvs: isOwner ? 999 : (user?.maxCvs ?? 0),
        generatedCvsCount: localDevDb.getGeneratedCvsCount(sessionData.userId),
        planPurchasedAt: user?.planPurchasedAt || (isOwner ? new Date().toISOString() : null),
        avatarUrl: user?.avatarUrl || null,
      };
    }
  }

  return null;
}

export async function requireAuthenticatedUser(redirectTo = "/login"): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect(redirectTo);
  }
  return user;
}

export async function requireSuperUser(
  redirectTo = "/login?next=/backoffice"
): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect(redirectTo);
  }
  if (!isSuperUser(user)) {
    notFound();
  }
  return user;
}

