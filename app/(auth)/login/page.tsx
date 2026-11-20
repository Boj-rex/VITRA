"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, ShieldCheck, RefreshCw, KeyRound } from "lucide-react";
import { FieldLabel, Input } from "@/components/ui/input";
import { LoginLoadingScreen } from "@/components/auth/LoginLoadingScreen";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/dashboard";
  const urlError = searchParams.get("error");

  // Loading Screen & Zoom Transition State
  const [loadingScreen, setLoadingScreen] = useState({ active: false, zooming: false });

  const handleTransitionComplete = () => {
    window.location.href = nextPath.startsWith("/") ? nextPath : "/dashboard";
  };

  // Step 1: Credentials State
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    urlError === "verification_failed"
      ? "Email verification link expired or invalid. Please log in or request a new link."
      : null
  );

  // Step 2: OTP State
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [deliveryInfo, setDeliveryInfo] = useState<{ liveSent?: boolean; provider?: string; error?: string } | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const googleEnabled = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH === "true";

  // Resend cooldown timer
  useEffect(() => {
    if (step !== "otp" || resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, resendCooldown]);

  // Focus first input upon switching to OTP step
  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  // Handle Credentials submission (Step 1)
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setLoadingScreen({ active: true, zooming: false });
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid email or password.");
        setLoadingScreen({ active: false, zooming: false });
        return;
      }

      // Check if server requires OTP verification layer
      if (data.step === "otp_required") {
        setMaskedEmail(data.maskedEmail || email);
        setOtpDigits(["", "", "", "", "", ""]);
        setOtpError(null);
        setDeliveryInfo(data.emailDelivery || null);
        setResendCooldown(60);
        setResendSuccess(null);
        setStep("otp");
        setLoadingScreen({ active: false, zooming: false });
        return;
      }

      // Direct login path - initiate zoom into dashboard
      setLoadingScreen({ active: true, zooming: true });
    } catch {
      setError("Network error while logging in.");
      setLoadingScreen({ active: false, zooming: false });
    } finally {
      setLoading(false);
    }
  }

  // Handle OTP digit changes
  function handleDigitChange(index: number, val: string) {
    // If pasted or multi-char string entered in single box
    if (val.length > 1) {
      handlePastedCode(val);
      return;
    }

    const cleanChar = val.replace(/\D/g, "");
    const newDigits = [...otpDigits];
    newDigits[index] = cleanChar;
    setOtpDigits(newDigits);
    setOtpError(null);

    // Auto-advance to next box
    if (cleanChar && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify if all 6 digits are complete
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

  // Handle OTP Verification submission (Step 2)
  async function handleVerifyOtp(codeToVerify?: string) {
    const code = (codeToVerify || otpDigits.join("")).trim();
    if (code.length < 6) {
      setOtpError("Please enter all 6 digits of the verification code.");
      return;
    }

    setOtpError(null);
    setOtpLoading(true);
    setLoadingScreen({ active: true, zooming: false });

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();

      if (!res.ok) {
        setOtpError(data.error || "Invalid security code. Please try again.");
        setLoadingScreen({ active: false, zooming: false });
        return;
      }

      // Success! Session cookie set by server - initiate zoom into dashboard
      setLoadingScreen({ active: true, zooming: true });
    } catch {
      setOtpError("Network error while verifying security code.");
      setLoadingScreen({ active: false, zooming: false });
    } finally {
      setOtpLoading(false);
    }
  }

  // Handle Resend OTP Code
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
      setResendSuccess("A new security code has been sent to your email!");
      if (data.emailDelivery) {
        setDeliveryInfo(data.emailDelivery);
      }
      setOtpDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch {
      setOtpError("Network error while requesting a new code.");
    } finally {
      setResendLoading(false);
    }
  }

  function handleBackToLogin() {
    setStep("credentials");
    setOtpError(null);
    setResendSuccess(null);
    setDeliveryInfo(null);
    setOtpDigits(["", "", "", "", "", ""]);
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
  // STEP 2: OTP VERIFICATION VIEW
  // --------------------------------------------------------------------------
  if (step === "otp") {
    const isCodeComplete = otpDigits.join("").length === 6 && !otpDigits.includes("");

    return (
      <>
        <LoginLoadingScreen
          active={loadingScreen.active}
          isZooming={loadingScreen.zooming}
          onTransitionComplete={handleTransitionComplete}
        />
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="space-y-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#10B981] bg-[#10B981]/10 px-2.5 py-0.5 font-tech text-[11px] font-bold text-[#065F46] dark:text-[#34D399]">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>EMAIL OTP SECURITY LAYER</span>
          </div>
          <h1 className="font-tech text-2xl sm:text-3xl font-bold text-[#111111] dark:text-white pt-1">
            Check Your Email
          </h1>
          <p className="text-xs text-[#55564E] dark:text-[#CBD5E1] leading-relaxed">
            We sent a 6-digit security code to{" "}
            <strong className="font-mono text-[#111111] dark:text-white font-bold">{maskedEmail}</strong>.
            Enter it below to sign in.
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
                aria-label={`Security code digit ${idx + 1}`}
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

          {/* Delivery Note if Live Email Sent */}
          {deliveryInfo?.liveSent && (
            <p className="mt-2 text-center text-[11px] text-[#55564E] dark:text-[#94A3B8]">
              Security code dispatched via email. Check your inbox and spam folder.
            </p>
          )}
        </div>

        {/* Verify & Sign In Action */}
        <button
          type="button"
          onClick={() => handleVerifyOtp()}
          disabled={otpLoading || !isCodeComplete}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-black dark:border-[#333C52] bg-[#111111] dark:bg-[#1A202C] py-3.5 font-tech text-xs sm:text-sm font-bold text-white shadow-[3px_3px_0px_#1B3AFF] hover:-translate-y-0.5 hover:shadow-[4.5px_4.5px_0px_#1B3AFF] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 select-none"
        >
          {otpLoading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>VERIFYING CODE...</span>
            </>
          ) : (
            <>
              <KeyRound className="h-4 w-4" />
              <span>VERIFY & SIGN IN</span>
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
            onClick={handleBackToLogin}
            className="inline-flex items-center gap-1 text-[#77786F] hover:text-[#111111] dark:hover:text-white transition-colors cursor-pointer select-none"
          >
            <span>Use different account</span>
          </button>
        </div>
      </div>
    </>
  );
}

  // --------------------------------------------------------------------------
  // STEP 1: CREDENTIALS VIEW
  // --------------------------------------------------------------------------
  return (
    <>
      <LoginLoadingScreen
        active={loadingScreen.active}
        isZooming={loadingScreen.zooming}
        onTransitionComplete={handleTransitionComplete}
      />
      <div>
        <div className="space-y-1 text-center sm:text-left">
        <span className="font-tech text-xs font-bold text-[#1845E8] uppercase tracking-wider">
          ● CANDIDATE ACCESS
        </span>
        <h1 className="font-tech text-2xl sm:text-3xl font-bold text-[#111111] dark:text-white">
          Welcome Back
        </h1>
        <p className="text-xs text-[#55564E] dark:text-[#CBD5E1] leading-relaxed">
          Log in with your email & password to access your CV workspace.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 font-tech text-xs">
        <div>
          <FieldLabel htmlFor="login-email" required>
            Email address
          </FieldLabel>
          <Input
            id="login-email"
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
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="login-password" className="text-xs font-bold text-[#111111] dark:text-white uppercase tracking-wider">
              Password <span className="text-[#8F2424]">*</span>
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-bold text-[#1845E8] hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
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
          {loading ? "LOGGING IN..." : "LOG IN"}
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
        New to Vitra?{" "}
        <Link href="/register" className="font-bold text-[#1845E8] hover:underline">
          Create an account
        </Link>
      </p>
    </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-tech text-[#77786F]">Loading...</div>}>
      <LoginFormInner />
    </Suspense>
  );
}
