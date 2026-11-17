"use client";

import React from "react";
import Link from "next/link";
import { VitraFooterLogo } from "@/components/layout/VitraFooterLogo";
import { openCookiePreferences } from "@/components/legal/CookieConsentBanner";
import { openSupportModal } from "@/components/support/FloatingSupportWidget";

export function PublicFooter() {
  return (
    <footer className="mt-auto border-t border-[#E2DDD2] dark:border-[#262D3D] bg-[#FFFEFA] dark:bg-[#141722] transition-colors">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <VitraFooterLogo href="/" size="md" />
            <p className="mt-3 max-w-md text-sm leading-relaxed text-[#77786F] dark:text-[#94A3B8]">
              Create, improve and customize professional, ATS-conscious CVs through a simple,
              guided process. Built for Nigeria and international job seekers with transparent pricing.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#252821] dark:text-[#F8FAFC]">
              Platform
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-[#77786F] dark:text-[#94A3B8]">
              <li>
                <Link href="/how-it-works" className="hover:text-[#173B30] dark:hover:text-amber-400">
                  How it works
                </Link>
              </li>
              <li>
                <Link href="/templates" className="hover:text-[#173B30] dark:hover:text-amber-400">
                  CV Templates
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-[#173B30] dark:hover:text-amber-400">
                  Pricing & Packages
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[#173B30] dark:hover:text-amber-400">
                  About Vitra
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-[#173B30] dark:hover:text-amber-400">
                  Frequently Asked Questions
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#252821] dark:text-[#F8FAFC]">
              Legal & Support
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-[#77786F] dark:text-[#94A3B8]">
              <li>
                <button
                  type="button"
                  onClick={() => openSupportModal()}
                  className="text-left hover:text-[#173B30] dark:hover:text-amber-400 cursor-pointer font-medium"
                >
                  Quick Help &amp; Support
                </button>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#173B30] dark:hover:text-amber-400">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[#173B30] dark:hover:text-amber-400">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={openCookiePreferences}
                  className="text-left hover:text-[#173B30] dark:hover:text-amber-400 cursor-pointer"
                >
                  Cookie Preferences
                </button>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#173B30] dark:hover:text-amber-400">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-[#173B30] dark:hover:text-amber-400">
                  Create account
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-[#E2DDD2] dark:border-[#262D3D] pt-6 text-xs text-[#77786F] dark:text-[#94A3B8] sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Vitra. Professional and accessible career tools.</p>
          <p>Privacy-first CV creation & improvement.</p>
        </div>
      </div>
    </footer>
  );
}

