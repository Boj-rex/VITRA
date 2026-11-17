import { NextResponse } from "next/server";
import { z } from "zod";
import { localDevDb, signSessionToken } from "@/lib/data/local-dev-store";
import { DEV_SESSION_COOKIE } from "@/lib/auth/session";

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
    const result = localDevDb.verifyLoginOtp(email, code);

    if (!result.success || !result.user) {
      localDevDb.recordAuthEvent({
        eventType: "otp_failed",
        email,
        details: result.error || "Incorrect security verification code",
        status: "error",
      });
      return NextResponse.json(
        { ok: false, error: result.error || "Verification failed." },
        { status: 400 }
      );
    }

    const user = result.user;
    localDevDb.recordAuthEvent({
      eventType: "otp_verified",
      email: user.email,
      userId: user.id,
      details: "Security code verified. Account access granted.",
      status: "success",
    });

    const token = signSessionToken(user.id, {
      email: user.email,
      role: user.role,
    });

    const res = NextResponse.json({
      ok: true,
      message: "Security code verified successfully.",
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
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

