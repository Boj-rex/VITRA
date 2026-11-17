import { NextResponse } from "next/server";
import { registerSchema } from "@/lib/validation/cv-schemas";
import { isLocalDevModeAllowed, isSupabaseConfigured } from "@/lib/config/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { localDevDb } from "@/lib/data/local-dev-store";
import { maskEmail, sendLoginOtpEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message || "Invalid registration details." },
        { status: 400 }
      );
    }

    const { fullName, email, password } = parsed.data;

    if (isSupabaseConfigured()) {
      const supabase = await createSupabaseServerClient();
      if (!supabase) {
        return NextResponse.json({ ok: false, error: "Supabase client unavailable." }, { status: 500 });
      }
      const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, country: "Nigeria" },
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
      }

      const needsVerification = !data.session;
      return NextResponse.json({
        ok: true,
        needsEmailVerification: needsVerification,
        provider: "supabase",
      });
    }

    if (isLocalDevModeAllowed()) {
      // 1. Create account with emailVerified: false (pending one-time verification)
      const user = localDevDb.createUser({
        fullName,
        email,
        password,
        country: "Nigeria",
        emailVerified: false,
      });

      localDevDb.recordAuthEvent({
        eventType: "signup",
        email: user.email,
        userId: user.id,
        details: `Candidate signed up: ${user.fullName} (${user.country})`,
        status: "success",
      });

      // 2. Generate one-time 6-digit email verification OTP
      const { code, expiresAt } = localDevDb.createLoginOtp(user.id, user.email, 15);

      localDevDb.recordAuthEvent({
        eventType: "otp_sent",
        email: user.email,
        userId: user.id,
        details: "Signup email verification OTP dispatched",
        status: "success",
      });

      // 3. Dispatch verification email
      const emailResult = await sendLoginOtpEmail({
        email: user.email,
        fullName: user.fullName,
        code,
        expiresMinutes: 15,
      });

      const isLiveEmailSent = emailResult.success && emailResult.provider !== "local_dev";

      return NextResponse.json({
        ok: true,
        step: "otp_required",
        needsEmailVerification: true,
        provider: "local-dev",
        email: user.email,
        maskedEmail: maskEmail(user.email),
        expiresAt,
        devCode: isLocalDevModeAllowed() ? code : undefined,
        emailDelivery: {
          liveSent: isLiveEmailSent,
          provider: emailResult.provider,
          error: emailResult.error,
        },
      });
    }

    return NextResponse.json(
      { ok: false, error: "Authentication service is not configured." },
      { status: 503 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Registration failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
