import { NextResponse } from "next/server";
import { z } from "zod";
import { isLocalDevModeAllowed, isSupabaseConfigured } from "@/lib/config/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { localDevDb } from "@/lib/data/local-dev-store";

const resetSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Za-z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  token: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message || "Invalid password." },
        { status: 400 }
      );
    }

    if (isSupabaseConfigured()) {
      const supabase = await createSupabaseServerClient();
      if (!supabase) {
        return NextResponse.json({ ok: false, error: "Supabase unavailable." }, { status: 500 });
      }
      const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
      if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
      }
      return NextResponse.json({ ok: true });
    }

    if (isLocalDevModeAllowed()) {
      if (!parsed.data.token) {
        return NextResponse.json({ ok: false, error: "Reset token is required." }, { status: 400 });
      }
      const ok = localDevDb.resetPasswordWithToken(parsed.data.token, parsed.data.password);
      if (!ok) {
        return NextResponse.json(
          { ok: false, error: "Reset token is invalid or has expired." },
          { status: 400 }
        );
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Auth not configured." }, { status: 503 });
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to reset password." }, { status: 400 });
  }
}

