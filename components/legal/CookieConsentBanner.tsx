"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, ShieldCheck, ChevronDown, ChevronUp, Check, X } from "lucide-react";
import { WashiTape } from "@/components/scrapbook/WashiTape";

export interface CookiePreferences {
  essential: true;
  analytics: boolean;
  decidedAt: string;
}

const STORAGE_KEY = "vitra_cookie_consent";
const COOKIE_NAME = "vitra_cookie_consent";

export function openCookiePreferences() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("vitra:open-cookie-settings"));
  }
}

function setConsentCookie(value: string) {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 365; // 1 year
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(
    value
  )}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function CookieConsentBanner() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analyticsAllowed, setAnalyticsAllowed] = useState(true);

  useEffect(() => {
    setMounted(true);

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        // Show banner after brief delay for smooth entrance
        const timer = setTimeout(() => setIsOpen(true), 600);
        return () => clearTimeout(timer);
      } else {
        const parsed: CookiePreferences = JSON.parse(saved);
        setAnalyticsAllowed(parsed.analytics ?? true);
      }
    } catch {
      setIsOpen(true);
    }

    const handleOpen = () => {
      setIsOpen(true);
      setShowDetails(true);
    };

    window.addEventListener("vitra:open-cookie-settings", handleOpen);
    return () => window.removeEventListener("vitra:open-cookie-settings", handleOpen);
  }, []);

  const saveConsent = (analytics: boolean) => {
    const prefs: CookiePreferences = {
      essential: true,
      analytics,
      decidedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // Ignore localStorage errors
    }

    setConsentCookie(analytics ? "all" : "essential");
    setAnalyticsAllowed(analytics);
    setIsOpen(false);
  };

  if (!mounted || !isOpen) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Cookie consent banner"
      className="fixed bottom-4 left-4 right-4 z-[9999] sm:left-auto sm:right-6 sm:max-w-lg transition-all animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="relative rounded-2xl border-2 border-black dark:border-[#333C52] bg-[#FFFEFA] dark:bg-[#1E2333] p-5 sm:p-6 shadow-[4px_4px_0px_#111111] dark:shadow-[4px_4px_0px_#000000] font-tech text-xs text-[#252821] dark:text-[#E2E8F0]">
        <WashiTape color="yellow" angle="left" className="-top-3 left-6" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black dark:border-[#333C52] bg-[#FEF9C3] dark:bg-[#252110] text-[#854D0E] dark:text-[#FBBF24]">
              <Cookie className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111111] dark:text-white flex items-center gap-1.5">
                <span>Cookie Confirmation</span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border border-[#065F46]/30 bg-[#D1FAE5] dark:bg-[#0E2E23] text-[#065F46] dark:text-[#34D399]">
                  Privacy First
                </span>
              </h3>
              <p className="text-[11px] text-[#55564E] dark:text-[#94A3B8]">
                Respecting your privacy under the NDPA and international standards
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-[#77786F] hover:text-[#111111] dark:hover:text-white p-1 rounded-md transition-colors"
            aria-label="Dismiss cookie notice"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <p className="mt-3 text-xs leading-relaxed text-[#55564E] dark:text-[#CBD5E1]">
          Vitra uses strictly essential cookies to maintain secure sessions and keep your dark mode
          choice. With your permission, we also use anonymous performance diagnostics to improve CV
          generation speed. We never sell your personal data or document contents.
        </p>

        {/* Expandable Details Drawer */}
        {showDetails && (
          <div className="mt-4 space-y-3 rounded-xl border border-black/15 dark:border-white/15 bg-[#F9FAFB] dark:bg-[#181C28] p-3 text-[11px]">
            {/* Essential Cookies */}
            <div className="flex items-start justify-between gap-2 border-b border-black/10 dark:border-white/10 pb-2.5">
              <div>
                <div className="flex items-center gap-1.5 font-bold text-[#111111] dark:text-white">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#065F46] dark:text-[#34D399]" />
                  <span>Strictly Essential (Required)</span>
                </div>
                <p className="mt-0.5 text-[10px] text-[#77786F] dark:text-[#94A3B8] leading-normal">
                  Authentication session (<code className="text-[9px]">vitra_session</code>), theme
                  state (<code className="text-[9px]">vitra_theme</code>), and CSRF protection. Cannot
                  be turned off.
                </p>
              </div>
              <span className="shrink-0 text-[10px] font-bold text-[#065F46] dark:text-[#34D399] bg-[#D1FAE5] dark:bg-[#0E2E23] px-2 py-0.5 rounded border border-[#065F46]/20">
                Always Active
              </span>
            </div>

            {/* Analytics Cookies */}
            <div className="flex items-start justify-between gap-2 pt-0.5">
              <div>
                <span className="font-bold text-[#111111] dark:text-white">
                  Performance &amp; Diagnostics
                </span>
                <p className="mt-0.5 text-[10px] text-[#77786F] dark:text-[#94A3B8] leading-normal">
                  Anonymous metrics tracking rendering speeds and PDF export reliability.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={analyticsAllowed}
                  onChange={(e) => setAnalyticsAllowed(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#173B30] dark:peer-checked:bg-[#10B981]"></div>
              </label>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-1 border-t border-black/10 dark:border-white/10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowDetails((prev) => !prev)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1845E8] dark:text-[#60A5FA] hover:underline cursor-pointer"
            >
              <span>{showDetails ? "Hide details" : "Customize cookies"}</span>
              {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            <Link
              href="/privacy"
              className="text-[11px] text-[#77786F] dark:text-[#94A3B8] hover:underline"
            >
              Privacy Policy
            </Link>
          </div>

          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            {showDetails ? (
              <button
                type="button"
                onClick={() => saveConsent(analyticsAllowed)}
                className="inline-flex items-center gap-1 rounded-lg border-2 border-black dark:border-[#333C52] bg-[#111111] dark:bg-[#10B981] px-3.5 py-1.5 text-xs font-bold text-white dark:text-black shadow-[2px_2px_0px_#1B3AFF] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Save Choices</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => saveConsent(false)}
                  className="rounded-lg border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#242A3D] px-3 py-1.5 text-xs font-bold text-[#111111] dark:text-white shadow-[2px_2px_0px_#111111] dark:shadow-[2px_2px_0px_#000000] hover:bg-[#F3F4F6] dark:hover:bg-[#2D3548] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
                >
                  Essential Only
                </button>
                <button
                  type="button"
                  onClick={() => saveConsent(true)}
                  className="rounded-lg border-2 border-black dark:border-[#333C52] bg-[#111111] dark:bg-[#10B981] px-3.5 py-1.5 text-xs font-bold text-white dark:text-black shadow-[2px_2px_0px_#1B3AFF] dark:shadow-[2px_2px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
                >
                  Accept All
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

