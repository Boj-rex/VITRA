import { NextResponse } from "next/server";
import { z } from "zod";
import { localDevDb } from "@/lib/data/local-dev-store";
import { sendLoginOtpEmail } from "@/lib/email";

const resendOtpSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resendOtpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message || "Invalid email address." },
        { status: 400 }
      );
    }

    const { email } = parsed.data;
    const cooldownCheck = localDevDb.canResendLoginOtp(email, 60);

    if (!cooldownCheck.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: `Please wait ${cooldownCheck.waitSeconds} seconds before requesting another code.`,
          waitSeconds: cooldownCheck.waitSeconds,
        },
        { status: 429 }
      );
    }

    if (!cooldownCheck.userId) {
      return NextResponse.json(
        { ok: false, error: "No active login session found for this email. Please log in again." },
        { status: 404 }
      );
    }

    const user = localDevDb.getUserById(cooldownCheck.userId);
    const { code, expiresAt } = localDevDb.createLoginOtp(cooldownCheck.userId, email, 10);

    const emailResult = await sendLoginOtpEmail({
      email,
      fullName: user?.fullName || "Candidate",
      code,
      expiresMinutes: 10,
    });

    const isLiveEmailSent = emailResult.success && emailResult.provider !== "local_dev";

    return NextResponse.json({
      ok: true,
      message: isLiveEmailSent
        ? "A new 6-digit security code has been sent to your email."
        : "A new security code has been generated.",
      expiresAt,
      emailDelivery: {
        liveSent: isLiveEmailSent,
        provider: emailResult.provider,
        error: emailResult.error,
      },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Failed to resend code.";
    return NextResponse.json({ ok: false, error: errorMessage }, { status: 500 });
  }
}

