"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FieldLabel, Input } from "@/components/ui/input";

function ResetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || undefined;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to reset password.");
      } else {
        setDone(true);
        setTimeout(() => router.push("/login"), 1500);
      }
    } catch {
      setError("Network error while resetting password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="space-y-1 text-center sm:text-left">
        <span className="font-tech text-xs font-bold text-[#10B981] uppercase tracking-wider">
          ● SECURITY UPDATE
        </span>
        <h1 className="font-tech text-2xl sm:text-3xl font-bold text-[#111111]">
          Choose New Password
        </h1>
        <p className="text-xs text-[#55564E] leading-relaxed">
          Use at least 8 characters with letters and numbers.
        </p>
      </div>

      {done ? (
        <div className="mt-6 rounded-lg border-2 border-[#10B981] bg-[#D1FAE5] p-4 text-xs font-tech font-bold text-[#065F46]">
          Password updated successfully. Redirecting to login...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 font-tech text-xs">
          <div>
            <FieldLabel htmlFor="new-pass" required>
              New password
            </FieldLabel>
            <Input
              id="new-pass"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-2 border-black bg-[#F9FAFB] text-base sm:text-sm text-[#111111] focus:border-[#1845E8]"
            />
          </div>

          <div>
            <FieldLabel htmlFor="confirm-new-pass" required>
              Confirm new password
            </FieldLabel>
            <Input
              id="confirm-new-pass"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="border-2 border-black bg-[#F9FAFB] text-base sm:text-sm text-[#111111] focus:border-[#1845E8]"
            />
          </div>

          {error && (
            <div className="rounded-lg border-2 border-red-500 bg-red-50 px-3.5 py-2.5 text-xs font-bold text-red-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center rounded-[6px] border-2 border-black bg-[#111111] py-3 font-tech text-xs font-bold text-white shadow-[3px_3px_0px_#1B3AFF] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer disabled:opacity-60"
          >
            {loading ? "UPDATING..." : "UPDATE PASSWORD"}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-xs font-tech text-[#55564E]">
        <Link href="/login" className="font-bold text-[#1845E8] hover:underline">
          Return to login
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-tech text-[#77786F]">Loading...</div>}>
      <ResetPasswordInner />
    </Suspense>
  );
}
