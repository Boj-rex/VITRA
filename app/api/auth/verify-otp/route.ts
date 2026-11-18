import { NextResponse } from "next/server";
import { z } from "zod";
import { signSessionToken } from "@/lib/data/local-dev-store";
import { DEV_SESSION_COOKIE, isSuperUser } from "@/lib/auth/session";
import { otpService } from "@/lib/auth/otp-service";
import { localDevDb } from "@/lib/data/local-dev-store";

const verifyOtpSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
  code: z.string().trim().min(6, "Security code must be at least 6 characters.").max(10),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = verifyOtpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message || "Invalid verification code." },
        { status: 400 }
      );
    }

    const { email, code } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();

    const result = await otpService.verifyOtp(normalizedEmail, code);

    if (!result.success) {
      localDevDb.recordAuthEvent({
        eventType: "otp_failed",
        email: normalizedEmail,
        details: result.error || "Incorrect security verification code",
        status: "error",
      });
      return NextResponse.json(
        { ok: false, error: result.error || "Verification failed." },
        { status: 400 }
      );
    }

    const isSuper = isSuperUser({ email: normalizedEmail });
    const assignedRole: "admin" | "user" = isSuper ? "admin" : "user";
    const userId = result.userId || "user_" + Date.now();

    localDevDb.recordAuthEvent({
      eventType: "otp_verified",
      email: normalizedEmail,
      userId,
      details: "Security code verified. Account access granted.",
      status: "success",
    });

    const token = signSessionToken(userId, {
      email: normalizedEmail,
      role: assignedRole,
    });

    const res = NextResponse.json({
      ok: true,
      message: "Security code verified successfully.",
      user: {
        id: userId,
        email: normalizedEmail,
      },
    });

    res.cookies.set(DEV_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Verification error.";
    return NextResponse.json({ ok: false, error: errorMessage }, { status: 500 });
  }
}
