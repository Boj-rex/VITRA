import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/validation/cv-schemas";
import { isLocalDevModeAllowed, isSupabaseConfigured } from "@/lib/config/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { localDevDb, signSessionToken } from "@/lib/data/local-dev-store";
import { DEV_SESSION_COOKIE } from "@/lib/auth/session";
import { maskEmail, sendLoginOtpEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message || "Invalid login credentials." },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const otpEnabled = process.env.LOGIN_OTP_ENABLED !== "false";

    if (isSupabaseConfigured()) {
      const supabase = await createSupabaseServerClient();
      if (!supabase) {
        return NextResponse.json({ ok: false, error: "Supabase client unavailable." }, { status: 500 });
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 401 });
      }

      if (otpEnabled && data.user) {
        // Sign out temporary Supabase session until OTP verification completes
        await supabase.auth.signOut();
        const fullName =
          (data.user.user_metadata?.full_name as string) ||
          data.user.email?.split("@")[0] ||
          "Candidate";
        const { code, expiresAt } = localDevDb.createLoginOtp(data.user.id, email, 10);

        await sendLoginOtpEmail({
          email,
          fullName,
          code,
          expiresMinutes: 10,
        });

        return NextResponse.json({
          ok: true,
          step: "otp_required",
          email,
          maskedEmail: maskEmail(email),
          expiresAt,
        });
      }

      return NextResponse.json({ ok: true, provider: "supabase" });
    }

    if (isLocalDevModeAllowed()) {
      const user = localDevDb.authenticateUser(email, password);
      if (!user) {
        localDevDb.recordAuthEvent({
          eventType: "login_failed",
          email,
          details: "Failed password attempt or non-existent email",
          status: "warning",
        });
        return NextResponse.json(
          { ok: false, error: "Invalid email address or password." },
          { status: 401 }
        );
      }

      // Require one-time email verification if candidate has not verified their email yet
      if (!user.emailVerified) {
        const { code, expiresAt } = localDevDb.createLoginOtp(user.id, user.email, 15);

        localDevDb.recordAuthEvent({
          eventType: "otp_sent",
          email: user.email,
          userId: user.id,
          details: "One-time account verification OTP code dispatched",
          status: "success",
        });

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

      // Verified candidate: direct password login
      localDevDb.recordAuthEvent({
        eventType: "login_success",
        email: user.email,
        userId: user.id,
        details: "Candidate logged in successfully with password",
        status: "success",
      });

      const token = signSessionToken(user.id, {
        email: user.email,
        role: user.role,
      });
      const res = NextResponse.json({
        ok: true,
        provider: "local-dev",
        user: { id: user.id, email: user.email, fullName: user.fullName },
      });
      res.cookies.set(DEV_SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });
      return res;
    }

    return NextResponse.json(
      { ok: false, error: "Authentication service is not configured." },
      { status: 503 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Login failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
