"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  ArrowLeft,
  RefreshCw,
  KeyRound,
} from "lucide-react";
import { FieldLabel, Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

function RegisterFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const intent = searchParams.get("intent");

  // Step state: "register" | "otp"
  const [step, setStep] = useState<"register" | "otp">("register");

  // Step 1: Registration Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 2: OTP Verification State
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [deliveryInfo, setDeliveryInfo] = useState<{ liveSent?: boolean; provider?: string; error?: string } | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const googleEnabled = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH === "true";

  const strength = useMemo(() => {
    const hasMin = password.length >= 8;
    const hasLetter = /[A-Za-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasUpperOrSym = /[A-Z]/.test(password) && /[^A-Za-z0-9]/.test(password);
    const score = [hasMin, hasLetter, hasNumber, hasUpperOrSym].filter(Boolean).length;
    const label =
      password.length === 0
        ? ""
        : score <= 2
          ? "Weak"
          : score === 3
            ? "Good"
            : "Strong";
    return { hasMin, hasLetter, hasNumber, score, label };
  }, [password]);

  // Resend cooldown countdown
  useEffect(() => {
    if (step !== "otp" || resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, resendCooldown]);

  // Focus first OTP box upon entering step 2
  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  // Handle Initial Registration Submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password, confirmPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Unable to register.");
        return;
      }

      // One-time signup email verification OTP layer
      if (data.step === "otp_required" || data.needsEmailVerification) {
        setMaskedEmail(data.maskedEmail || email);
        setOtpDigits(["", "", "", "", "", ""]);
        setOtpError(null);
        setDevCode(data.devCode || null);
        setDeliveryInfo(data.emailDelivery || null);
        setResendCooldown(60);
        setResendSuccess(null);
        setStep("otp");
        return;
      }

      // Direct navigation if verification was bypassed
      const target =
        intent === "upload" ? "/upload" : intent === "create" ? "/create" : "/dashboard";
      router.push(target);
      router.refresh();
    } catch {
      setError("Network error during registration. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Handle OTP digit changes
  function handleDigitChange(index: number, val: string) {
    if (val.length > 1) {
      handlePastedCode(val);
      return;
    }

    const cleanChar = val.replace(/\D/g, "");
    const newDigits = [...otpDigits];
    newDigits[index] = cleanChar;
    setOtpDigits(newDigits);
    setOtpError(null);

    // Auto-advance
    if (cleanChar && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    const fullCode = newDigits.join("");
    if (fullCode.length === 6 && !newDigits.includes("")) {
      handleVerifyOtp(fullCode);
    }
  }

  function handleDigitKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (otpDigits[index] === "" && index > 0) {
        const newDigits = [...otpDigits];
        newDigits[index - 1] = "";
        setOtpDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newDigits = [...otpDigits];
        newDigits[index] = "";
        setOtpDigits(newDigits);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePastedCode(pastedText: string) {
    const digits = pastedText.replace(/\D/g, "").slice(0, 6);
    if (!digits) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = digits[i] || "";
    }
    setOtpDigits(newDigits);
    setOtpError(null);

    if (digits.length === 6) {
      inputRefs.current[5]?.focus();
      handleVerifyOtp(digits);
    } else {
      inputRefs.current[Math.min(digits.length, 5)]?.focus();
    }
  }

  // Verify OTP & Complete First-Time Signup
  async function handleVerifyOtp(codeToVerify?: string) {
    const code = (codeToVerify || otpDigits.join("")).trim();
    if (code.length < 6) {
      setOtpError("Please enter all 6 digits of your security code.");
      return;
    }

    setOtpError(null);
    setOtpLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();

      if (!res.ok) {
        setOtpError(data.error || "Invalid security code. Please check and try again.");
        return;
      }

      // Email verified! Session established
      const target =
        intent === "upload" ? "/upload" : intent === "create" ? "/create" : "/dashboard";
      router.push(target);
      router.refresh();
    } catch {
      setOtpError("Network error while verifying security code.");
    } finally {
      setOtpLoading(false);
    }
  }

  // Resend OTP Code
  async function handleResendOtp() {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setOtpError(null);
    setResendSuccess(null);

    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setOtpError(data.error || "Unable to resend code right now.");
        return;
      }

      setResendCooldown(60);
      setResendSuccess("A fresh verification code has been sent to your email!");
      if (data.devCode) setDevCode(data.devCode);
      if (data.emailDelivery) setDeliveryInfo(data.emailDelivery);
      setOtpDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch {
      setOtpError("Network error while requesting a new code.");
    } finally {
      setResendLoading(false);
    }
  }

  async function handleGoogleAuth() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  // --------------------------------------------------------------------------
  // STEP 2: ONE-TIME SIGNUP EMAIL VERIFICATION OTP VIEW
  // --------------------------------------------------------------------------
  if (step === "otp") {
    const isCodeComplete = otpDigits.join("").length === 6 && !otpDigits.includes("");

    return (
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="space-y-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#10B981] bg-[#10B981]/10 px-2.5 py-0.5 font-tech text-[11px] font-bold text-[#065F46] dark:text-[#34D399]">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>VERIFY & SIGNUP (ONE-TIME)</span>
          </div>
          <h1 className="font-tech text-2xl sm:text-3xl font-bold text-[#111111] dark:text-white pt-1">
            Verify and Signup
          </h1>
          <p className="text-xs text-[#55564E] dark:text-[#CBD5E1] leading-relaxed">
            We sent a 6-digit confirmation code to{" "}
            <strong className="font-mono text-[#111111] dark:text-white font-bold">{maskedEmail}</strong>.
            Verify once to activate your candidate account.
          </p>
        </div>

        {/* 6 Segmented Digit Input Boxes */}
        <div className="my-6">
          <div className="flex items-center justify-between gap-1.5 sm:gap-2.5">
            {otpDigits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                onPaste={(e) => {
                  e.preventDefault();
                  handlePastedCode(e.clipboardData.getData("text"));
                }}
                disabled={otpLoading}
                className={cn(
                  "w-10 h-12 sm:w-12 sm:h-14 text-center font-mono text-xl sm:text-2xl font-black rounded-lg border-2 border-black dark:border-[#3A4256] bg-white dark:bg-[#1E2333] text-[#111111] dark:text-white shadow-[2px_2px_0px_#111111] dark:shadow-[2px_2px_0px_#000] focus:border-[#1845E8] focus:ring-2 focus:ring-[#1845E8]/20 focus:outline-none transition-all select-none",
                  digit ? "bg-[#FEF08A]/30 dark:bg-[#FEF08A]/10 border-[#111111]" : ""
                )}
                aria-label={`Verification code digit ${idx + 1}`}
              />
            ))}
          </div>

          {/* Feedback Alerts */}
          {otpError && (
            <div className="mt-3 rounded-lg border-2 border-red-500 bg-red-50 dark:bg-red-950/40 px-3.5 py-2.5 text-xs font-bold text-red-800 dark:text-red-200">
              {otpError}
            </div>
          )}

          {resendSuccess && (
            <div className="mt-3 rounded-lg border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-2.5 text-xs font-bold text-emerald-800 dark:text-emerald-200">
              {resendSuccess}
            </div>
          )}

          {/* Local Dev Helper Notice */}
          {devCode && (
            <div className="mt-4 rounded-xl border-2 border-black dark:border-[#3A4256] bg-[#FEF08A] dark:bg-[#252210] p-3 text-xs font-tech text-[#111111] dark:text-[#FEF08A] shadow-[2.5px_2.5px_0px_#111111] dark:shadow-[2.5px_2.5px_0px_#000]">
              <div className="flex items-center justify-between">
                <span className="font-extrabold uppercase tracking-wider text-[10px] bg-black text-[#FEF08A] px-2 py-0.5 rounded">
                  🛠️ LOCAL DEV CODE
                </span>
                <button
                  type="button"
                  onClick={() => handlePastedCode(devCode)}
                  className="font-bold text-xs text-[#1845E8] dark:text-amber-300 hover:underline cursor-pointer"
                >
                  Click to auto-fill code
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between bg-white dark:bg-[#151922] p-2 rounded-lg border border-black/20">
                <span className="text-[11px] text-[#55564E] dark:text-[#94A3B8]">
                  Your verification code:
                </span>
                <span className="font-mono text-lg font-black tracking-widest text-[#111111] dark:text-white">
                  {devCode}
                </span>
              </div>
              {!deliveryInfo?.liveSent && (
                <p className="mt-2 text-[10px] text-[#55564E] dark:text-[#CBD5E1] leading-tight">
                  Gmail requires a 16-character App Password to deliver live emails. To receive codes in your Gmail inbox, paste your Google App Password into <code className="font-mono bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded font-bold">SMTP_PASS</code> in <code className="font-mono bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded font-bold">.env.local</code>.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Verify and Signup Action */}
        <button
          type="button"
          onClick={() => handleVerifyOtp()}
          disabled={otpLoading || !isCodeComplete}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-black dark:border-[#333C52] bg-[#111111] dark:bg-[#1A202C] py-3.5 font-tech text-xs sm:text-sm font-bold text-white shadow-[3px_3px_0px_#1B3AFF] hover:-translate-y-0.5 hover:shadow-[4.5px_4.5px_0px_#1B3AFF] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 select-none"
        >
          {otpLoading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>VERIFYING & SIGNING UP...</span>
            </>
          ) : (
            <>
              <KeyRound className="h-4 w-4" />
              <span>VERIFY AND SIGNUP</span>
            </>
          )}
        </button>

        {/* Resend & Back Controls */}
        <div className="mt-5 flex items-center justify-between text-xs font-tech pt-2 border-t border-black/10 dark:border-white/10">
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={resendCooldown > 0 || resendLoading}
            className={cn(
              "font-bold transition-colors cursor-pointer select-none",
              resendCooldown > 0 || resendLoading
                ? "text-[#888880] cursor-not-allowed"
                : "text-[#1845E8] hover:underline"
            )}
          >
            {resendLoading
              ? "Sending..."
              : resendCooldown > 0
                ? `Resend code in ${resendCooldown}s`
                : "Resend security code"}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep("register");
              setOtpError(null);
              setResendSuccess(null);
              setOtpDigits(["", "", "", "", "", ""]);
            }}
            className="inline-flex items-center gap-1 text-[#77786F] hover:text-[#111111] dark:hover:text-white transition-colors cursor-pointer select-none"
          >
            <span>Edit details</span>
          </button>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // STEP 1: INITIAL REGISTRATION FORM
  // --------------------------------------------------------------------------
  return (
    <div>
      <div className="space-y-1 text-center sm:text-left">
        <span className="font-tech text-xs font-bold text-[#10B981] uppercase tracking-wider">
          ● NEW CANDIDATE
        </span>
        <h1 className="font-tech text-2xl sm:text-3xl font-bold text-[#111111] dark:text-white">
          Create Your Account
        </h1>
        <p className="text-xs text-[#55564E] dark:text-[#CBD5E1] leading-relaxed">
          Your CV drafts and uploaded files remain private and encrypted.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 font-tech text-xs">
        <div>
          <FieldLabel htmlFor="reg-name" required>
            Full name
          </FieldLabel>
          <Input
            id="reg-name"
            required
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Chinedu Emmanuel Okafor"
            className="border-2 border-black bg-[#F9FAFB] dark:bg-[#1E2333] text-base sm:text-sm text-[#111111] dark:text-white focus:border-[#1845E8]"
          />
        </div>

        <div>
          <FieldLabel htmlFor="reg-email" required>
            Email address
          </FieldLabel>
          <Input
            id="reg-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="border-2 border-black bg-[#F9FAFB] dark:bg-[#1E2333] text-base sm:text-sm text-[#111111] dark:text-white focus:border-[#1845E8]"
          />
        </div>

        <div>
          <FieldLabel htmlFor="reg-password" required>
            Password
          </FieldLabel>
          <div className="relative">
            <Input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters with letters & numbers"
              className="border-2 border-black bg-[#F9FAFB] dark:bg-[#1E2333] pr-10 text-base sm:text-sm text-[#111111] dark:text-white focus:border-[#1845E8]"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#77786F] hover:text-[#252821] dark:hover:text-white cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {password.length > 0 && (
            <div className="mt-2 space-y-1.5 rounded-lg border border-black/10 dark:border-white/10 bg-[#F9FAFB] dark:bg-[#1E2333] p-2.5 text-[11px]">
              <div className="flex items-center justify-between font-bold">
                <span className="text-[#55564E] dark:text-[#CBD5E1]">Strength</span>
                <span className={strength.score >= 3 ? "text-[#065F46] dark:text-[#34D399]" : "text-[#B45309] dark:text-[#FBBF24]"}>
                  {strength.label}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-[#55564E] dark:text-[#CBD5E1]">
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2
                    className={`h-3 w-3 ${strength.hasMin ? "text-[#065F46] dark:text-[#34D399]" : "text-[#D1D5DB]"}`}
                  />
                  8+ chars
                </span>
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2
                    className={`h-3 w-3 ${strength.hasLetter ? "text-[#065F46] dark:text-[#34D399]" : "text-[#D1D5DB]"}`}
                  />
                  Letter
                </span>
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2
                    className={`h-3 w-3 ${strength.hasNumber ? "text-[#065F46] dark:text-[#34D399]" : "text-[#D1D5DB]"}`}
                  />
                  Number
                </span>
              </div>
            </div>
          )}
        </div>

        <div>
          <FieldLabel htmlFor="reg-confirm" required>
            Confirm password
          </FieldLabel>
          <Input
            id="reg-confirm"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your password"
            className="border-2 border-black bg-[#F9FAFB] dark:bg-[#1E2333] text-base sm:text-sm text-[#111111] dark:text-white focus:border-[#1845E8]"
          />
        </div>

        {error && (
          <div className="rounded-lg border-2 border-red-500 bg-red-50 dark:bg-red-950/40 px-3.5 py-2.5 text-xs font-bold text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center rounded-xl border-2 border-black dark:border-[#333C52] bg-[#111111] dark:bg-[#1A202C] py-3.5 font-tech text-xs sm:text-sm font-bold text-white shadow-[3px_3px_0px_#1B3AFF] hover:-translate-y-0.5 hover:shadow-[4.5px_4.5px_0px_#1B3AFF] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 select-none"
        >
          {loading ? "SENDING VERIFICATION CODE..." : "VERIFY AND SIGNUP"}
        </button>
      </form>

      {googleEnabled && (
        <div className="mt-4 border-t-2 border-black/10 dark:border-white/10 pt-4">
          <button
            type="button"
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#1E2333] py-3 font-tech text-xs font-bold text-[#111111] dark:text-white shadow-[2.5px_2.5px_0px_#111111] dark:shadow-[2.5px_2.5px_0px_#000] hover:bg-[#F3F4F6] dark:hover:bg-[#252D3F] hover:-translate-y-0.5 hover:shadow-[3.5px_3.5px_0px_#111111] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none active:scale-[0.98] transition-all cursor-pointer select-none"
            onClick={handleGoogleAuth}
          >
            Continue with Google
          </button>
        </div>
      )}

      <p className="mt-6 text-center text-xs font-tech text-[#55564E] dark:text-[#CBD5E1]">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-[#1845E8] hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-tech text-[#77786F]">Loading...</div>}>
      <RegisterFormInner />
    </Suspense>
  );
}
