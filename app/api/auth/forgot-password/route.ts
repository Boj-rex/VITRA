import { NextResponse } from "next/server";
import { z } from "zod";
import { isLocalDevModeAllowed, isSupabaseConfigured } from "@/lib/config/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { localDevDb } from "@/lib/data/local-dev-store";

const forgotSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = forgotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message || "Invalid email." },
        { status: 400 }
      );
    }

    if (isSupabaseConfigured()) {
      const supabase = await createSupabaseServerClient();
      if (!supabase) {
        return NextResponse.json({ ok: false, error: "Supabase unavailable." }, { status: 500 });
      }
      const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
      const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
        redirectTo: `${origin}/reset-password`,
      });
      if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
      }
      return NextResponse.json({
        ok: true,
        message: "If an account exists for that email, a password reset link has been sent.",
      });
    }

    if (isLocalDevModeAllowed()) {
      const token = localDevDb.createPasswordResetToken(parsed.data.email);
      return NextResponse.json({
        ok: true,
        localDevResetPath: token ? `/reset-password?token=${token}` : undefined,
        message:
          "Local development mode does not send external emails. Use the direct reset link below if this account exists locally.",
      });
    }

    return NextResponse.json({ ok: false, error: "Auth not configured." }, { status: 503 });
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to process request." }, { status: 400 });
  }
}

