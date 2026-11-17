import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isLocalDevModeAllowed, isSupabaseConfigured } from "@/lib/config/env";
import { localDevDb, verifySessionToken } from "@/lib/data/local-dev-store";

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
    if (!supabase) return null;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

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
      planId: (profile?.plan_id as "starter" | "pro" | "executive") || null,
      maxCvs: Number(profile?.max_cvs || 0),
      generatedCvsCount: Number(profile?.generated_cvs_count || 0),
      planPurchasedAt: profile?.plan_purchased_at || null,
      avatarUrl: (profile?.avatar_url as string | undefined) || (user.user_metadata?.avatar_url as string | undefined) || null,
    };
  }

  if (isLocalDevModeAllowed()) {
    const cookieStore = await cookies();
    const token = cookieStore.get(DEV_SESSION_COOKIE)?.value;
    if (!token) return null;
    const userId = verifySessionToken(token);
    if (!userId) return null;
    const user = localDevDb.getUserById(userId);
    if (!user) return null;

    const normalizedEmail = user.email.trim().toLowerCase();
    const isOwner = SUPERUSER_EMAILS.has(normalizedEmail);
    const assignedRole: "user" | "admin" =
      user.role === "admin" || isOwner ? "admin" : "user";

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      country: user.country,
      emailVerified: user.emailVerified,
      role: assignedRole,
      provider: "local-dev",
      planId: user.planId || null,
      maxCvs: user.maxCvs ?? 0,
      generatedCvsCount: localDevDb.getGeneratedCvsCount(user.id),
      planPurchasedAt: user.planPurchasedAt || null,
      avatarUrl: user.avatarUrl || null,
    };
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

