import { NextResponse } from "next/server";
import { registerSchema } from "@/lib/validation/cv-schemas";
import { isLocalDevModeAllowed, isSupabaseConfigured } from "@/lib/config/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { localDevDb } from "@/lib/data/local-dev-store";
import { otpService } from "@/lib/auth/otp-service";

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
    const normalizedEmail = email.trim().toLowerCase();

    let userId: string | undefined;

    if (isSupabaseConfigured()) {
      const admin = createSupabaseAdminClient();
      if (!admin) {
        return NextResponse.json({ ok: false, error: "Authentication service unavailable." }, { status: 500 });
      }

      // 1. Create candidate user in Supabase Auth via Admin API (email_confirm: false, DOES NOT send Supabase email link)
      const { data: createData, error: createError } = await admin.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: false,
        user_metadata: { full_name: fullName, country: "Nigeria" },
      });

      if (createError) {
        // If already registered, check if they are unconfirmed and update their password
        if (
          createError.message.toLowerCase().includes("already registered") ||
          createError.message.toLowerCase().includes("already exists")
        ) {
          const { data: userList } = await admin.auth.admin.listUsers();
          const existingUser = userList?.users.find((u) => u.email?.toLowerCase() === normalizedEmail);
          if (existingUser) {
            userId = existingUser.id;
            await admin.auth.admin.updateUserById(existingUser.id, {
              password,
              user_metadata: { full_name: fullName, country: "Nigeria" },
            });
          } else {
            return NextResponse.json({ ok: false, error: createError.message }, { status: 400 });
          }
        } else {
          return NextResponse.json({ ok: false, error: createError.message }, { status: 400 });
        }
      } else if (createData?.user) {
        userId = createData.user.id;
      }
    }

    if (isLocalDevModeAllowed()) {
      try {
        localDevDb.createUser({
          fullName,
          email: normalizedEmail,
          password,
          country: "Nigeria",
          emailVerified: false,
        });
      } catch {
        // Already exists in local fallback
      }
    }

    // 2. Generate and dispatch official 6-digit OTP verification email via Gmail SMTP
    const otpResult = await otpService.createAndSendOtp({
      email: normalizedEmail,
      fullName,
      userId,
      expiresMinutes: 15,
    });

    return NextResponse.json({
      ok: true,
      step: "otp_required",
      needsEmailVerification: true,
      email: normalizedEmail,
      maskedEmail: otpResult.maskedEmail,
      expiresAt: otpResult.expiresAt,
      emailDelivery: otpResult.emailDelivery,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Registration failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
