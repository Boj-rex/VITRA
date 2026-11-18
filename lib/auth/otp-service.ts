import crypto from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config/env";
import { localDevDb } from "@/lib/data/local-dev-store";
import { maskEmail, sendLoginOtpEmail } from "@/lib/email";

export interface CreateOtpParams {
  email: string;
  fullName?: string;
  userId?: string;
  expiresMinutes?: number;
}

export interface VerifyOtpResult {
  success: boolean;
  userId?: string;
  email?: string;
  error?: string;
}

export const otpService = {
  /**
   * Generates a 6-digit numeric OTP, saves to public.auth_otps, and dispatches via Gmail SMTP
   */
  async createAndSendOtp(params: CreateOtpParams) {
    const email = params.email.trim().toLowerCase();
    const expiresMinutes = params.expiresMinutes || 15;
    const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000).toISOString();

    // 6-digit cryptographically secure numeric code
    const code = crypto.randomInt(100000, 999999).toString();

    // 1. Save to Supabase public.auth_otps if Supabase is active
    if (isSupabaseConfigured()) {
      try {
        const admin = createSupabaseAdminClient();
        if (admin) {
          // Delete any existing OTP for this email
          await admin.from("auth_otps").delete().eq("email", email);
          // Insert new OTP
          await admin.from("auth_otps").insert({
            email,
            code,
            user_id: params.userId || null,
            expires_at: expiresAt,
            attempts: 0,
          });
        }
      } catch (err) {
        console.warn("Failed to persist OTP to Supabase, falling back to local store:", err);
      }
    }

    // Always mirror to local store for resilience
    try {
      localDevDb.createLoginOtp(params.userId || "pending", email, expiresMinutes);
      const existing = (localDevDb as unknown as { data: { loginOtps?: Array<{ email: string; code: string }> } }).data?.loginOtps?.find((o) => o.email === email);
      if (existing) {
        existing.code = code;
      }
    } catch {
      // Local mirror ignored if unavailable
    }

    // 2. Dispatch via direct Gmail SMTP
    const emailResult = await sendLoginOtpEmail({
      email,
      fullName: params.fullName || "Candidate",
      code,
      expiresMinutes,
    });

    return {
      code,
      expiresAt,
      maskedEmail: maskEmail(email),
      emailDelivery: {
        liveSent: emailResult.success && emailResult.provider !== "local_dev",
        provider: emailResult.provider,
        error: emailResult.error,
      },
    };
  },

  /**
   * Verifies an OTP code from public.auth_otps (or local store fallback)
   */
  async verifyOtp(emailRaw: string, codeRaw: string): Promise<VerifyOtpResult> {
    const email = emailRaw.trim().toLowerCase();
    const code = codeRaw.trim();

    if (isSupabaseConfigured()) {
      try {
        const admin = createSupabaseAdminClient();
        if (admin) {
          const { data: record, error } = await admin
            .from("auth_otps")
            .select("*")
            .eq("email", email)
            .maybeSingle();

          if (error || !record) {
            // Check localDevDb as fallback
            const localCheck = localDevDb.verifyLoginOtp(email, code);
            if (localCheck.success) {
              return { success: true, userId: localCheck.user?.id, email };
            }
            return {
              success: false,
              error: "No active verification code found for this email. Please request a new code.",
            };
          }

          if (new Date(record.expires_at).getTime() < Date.now()) {
            await admin.from("auth_otps").delete().eq("id", record.id);
            return {
              success: false,
              error: "Security code has expired. Please click 'Resend code' to get a fresh code.",
            };
          }

          if (record.attempts >= 5) {
            await admin.from("auth_otps").delete().eq("id", record.id);
            return {
              success: false,
              error: "Too many failed attempts. Please click 'Resend code' for a fresh code.",
            };
          }

          if (record.code !== code) {
            await admin
              .from("auth_otps")
              .update({ attempts: record.attempts + 1 })
              .eq("id", record.id);
            return {
              success: false,
              error: "Incorrect 6-digit security code. Please check your inbox and try again.",
            };
          }

          // OTP is valid! Invalidate it immediately to prevent replay
          await admin.from("auth_otps").delete().eq("id", record.id);

          // Confirm the user in Supabase Auth if user_id is present
          let userId = record.user_id;
          if (!userId) {
            const { data: userData } = await admin.auth.admin.listUsers();
            const matchingUser = userData?.users.find((u) => u.email?.toLowerCase() === email);
            if (matchingUser) {
              userId = matchingUser.id;
            }
          }

          if (userId) {
            await admin.auth.admin.updateUserById(userId, {
              email_confirm: true,
            });
          }

          return {
            success: true,
            userId: userId || undefined,
            email,
          };
        }
      } catch (err) {
        console.warn("Supabase verifyOtp error, falling back to localDevDb:", err);
      }
    }

    // Fallback to localDevDb
    const localResult = localDevDb.verifyLoginOtp(email, code);
    if (!localResult.success) {
      return { success: false, error: localResult.error };
    }
    return { success: true, userId: localResult.user?.id, email };
  },

  /**
   * Checks cooldown for resending OTP
   */
  async canResendOtp(emailRaw: string, cooldownSeconds = 60) {
    const email = emailRaw.trim().toLowerCase();
    if (isSupabaseConfigured()) {
      try {
        const admin = createSupabaseAdminClient();
        if (admin) {
          const { data: record } = await admin
            .from("auth_otps")
            .select("created_at")
            .eq("email", email)
            .maybeSingle();

          if (record) {
            const elapsed = (Date.now() - new Date(record.created_at).getTime()) / 1000;
            if (elapsed < cooldownSeconds) {
              return {
                allowed: false,
                waitSeconds: Math.ceil(cooldownSeconds - elapsed),
              };
            }
          }
          return { allowed: true, waitSeconds: 0 };
        }
      } catch {
        // Fallback
      }
    }

    return localDevDb.canResendLoginOtp(email, cooldownSeconds);
  },
};
