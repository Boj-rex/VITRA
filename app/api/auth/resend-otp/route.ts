import { NextResponse } from "next/server";
import { z } from "zod";
import { otpService } from "@/lib/auth/otp-service";

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
    const normalizedEmail = email.trim().toLowerCase();

    const cooldownCheck = await otpService.canResendOtp(normalizedEmail, 60);

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

    const otpResult = await otpService.createAndSendOtp({
      email: normalizedEmail,
      expiresMinutes: 10,
    });

    return NextResponse.json({
      ok: true,
      message: "A fresh 6-digit verification code has been sent to your email.",
      expiresAt: otpResult.expiresAt,
      emailDelivery: otpResult.emailDelivery,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Failed to resend code.";
    return NextResponse.json({ ok: false, error: errorMessage }, { status: 500 });
  }
}
