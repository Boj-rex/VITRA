import { NextResponse } from "next/server";
import { z } from "zod";
import { DEV_SESSION_COOKIE, getAuthenticatedUser } from "@/lib/auth/session";
import { isLocalDevModeAllowed, isSupabaseConfigured } from "@/lib/config/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { localDevDb } from "@/lib/data/local-dev-store";
import { cvService } from "@/services/cv-service";

const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  country: z.string().trim().min(2).max(80),
  avatarUrl: z.string().trim().max(2000).nullish(),
});

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const uploads = await cvService.listUploads(user.id);
  return NextResponse.json({ ok: true, user, uploads });
}

export async function PATCH(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message || "Invalid profile details." },
      { status: 400 }
    );
  }

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: "Database unavailable." }, { status: 500 });
    }
    const updatePayload: Record<string, any> = {
      full_name: parsed.data.fullName,
      country: parsed.data.country,
    };
    if (parsed.data.avatarUrl !== undefined) {
      updatePayload.avatar_url = parsed.data.avatarUrl;
    }
    const { error } = await supabase
      .from("profiles")
      .update(updatePayload)
      .eq("id", user.id);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  if (isLocalDevModeAllowed()) {
    localDevDb.updateUserProfile(user.id, parsed.data);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: "No database provider." }, { status: 500 });
}

export async function DELETE() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await cvService.deleteUserAccount(user.id);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error || "Unable to delete account." },
      { status: 400 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.delete(DEV_SESSION_COOKIE);
  return res;
}

