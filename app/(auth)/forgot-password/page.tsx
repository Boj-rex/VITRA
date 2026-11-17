"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FieldLabel, Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [localResetPath, setLocalResetPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setLocalResetPath(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Request failed.");
      } else {
        setMessage(data.message);
        if (data.localDevResetPath) {
          setLocalResetPath(data.localDevResetPath);
        }
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="space-y-1 text-center sm:text-left">
        <span className="font-tech text-xs font-bold text-[#92400E] uppercase tracking-wider">
          ● ACCOUNT RECOVERY
        </span>
        <h1 className="font-tech text-2xl sm:text-3xl font-bold text-[#111111]">
          Reset Password
        </h1>
        <p className="text-xs text-[#55564E] leading-relaxed">
          Enter the email address linked to your Vitra studio account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 font-tech text-xs">
        <div>
          <FieldLabel htmlFor="forgot-email" required>
            Email address
          </FieldLabel>
          <Input
            id="forgot-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="border-2 border-black bg-[#F9FAFB] text-base sm:text-sm text-[#111111] focus:border-[#1845E8]"
          />
        </div>

        {error && (
          <div className="rounded-lg border-2 border-red-500 bg-red-50 px-3.5 py-2.5 text-xs font-bold text-red-800">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-lg border-2 border-[#10B981] bg-[#D1FAE5] p-3 text-xs font-bold text-[#065F46]">
            <p>{message}</p>
            {localResetPath && (
              <Link href={localResetPath} className="mt-2 inline-block underline">
                Open local development password reset
              </Link>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center rounded-[6px] border-2 border-black bg-[#111111] py-3 font-tech text-xs font-bold text-white shadow-[3px_3px_0px_#1B3AFF] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer disabled:opacity-60"
        >
          {loading ? "SENDING..." : "SEND RESET INSTRUCTIONS"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs font-tech text-[#55564E]">
        Remembered your password?{" "}
        <Link href="/login" className="font-bold text-[#1845E8] hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}
