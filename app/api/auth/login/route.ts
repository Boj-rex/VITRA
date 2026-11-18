import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { loginSchema } from "@/lib/validation/cv-schemas";
import { isLocalDevModeAllowed, isSupabaseConfigured } from "@/lib/config/env";
import { localDevDb, signSessionToken } from "@/lib/data/local-dev-store";
import { DEV_SESSION_COOKIE, isSuperUser } from "@/lib/auth/session";
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

    if (isSupabaseConfigured()) {
      const response = NextResponse.json({ ok: true, provider: "supabase" });
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim();
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim();
      const cookieStore = await cookies();

      const supabase = createServerClient(url, anonKey, {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
              response.cookies.set(name, value, options);
            });
          },
        },
      });

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 401 });
      }

      // Attach companion session cookie for guaranteed middleware recognition
      if (data.user) {
        const isSuper = isSuperUser({ email: data.user.email });
        const token = signSessionToken(data.user.id, {
          email: data.user.email || email,
          role: isSuper ? "admin" : "user",
        });
        response.cookies.set(DEV_SESSION_COOKIE, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 7 * 24 * 60 * 60,
        });
      }

      return response;
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
