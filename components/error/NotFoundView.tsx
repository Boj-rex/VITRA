"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  FileQuestion,
  Home,
  LayoutDashboard,
  LogIn,
  FileText,
  Sparkles,
  CreditCard,
  HelpCircle,
  Search,
} from "lucide-react";
import { ScrapbookNavbar } from "@/components/scrapbook/ScrapbookNavbar";
import { VitraFooterLogo } from "@/components/layout/VitraFooterLogo";
import { WashiTape } from "@/components/scrapbook/WashiTape";
import { InteractiveFloatingCharacter } from "@/components/characters/InteractiveFloatingCharacter";
import { cn } from "@/lib/utils";

interface NotFoundViewProps {
  isAuthenticated?: boolean;
}

const QUICK_LINKS = [
  {
    href: "/templates",
    icon: FileText,
    tag: "Templates",
    title: "ATS-Conscious CV Templates",
    desc: "Browse 9 Nigerian & global professional templates tailored for high ATS pass rates.",
  },
  {
    href: "/upload",
    icon: Sparkles,
    tag: "ATS Checker",
    title: "Instant CV Audit & Score",
    desc: "Upload a PDF or Word document for instant formatting, keyword, and clarity feedback.",
  },
  {
    href: "/pricing",
    icon: CreditCard,
    tag: "Pricing",
    title: "Packages & Quotas",
    desc: "Activate Starter (2 CVs for ₦6,000), Pro (6 CVs for ₦15,000), or Executive plans.",
  },
  {
    href: "/contact",
    icon: HelpCircle,
    tag: "Support",
    title: "Direct Candidate Support",
    desc: "Got a question about your account, payment, or CV export? Our team is on standby.",
  },
];

export function NotFoundView({ isAuthenticated = false }: NotFoundViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mountedPath, setMountedPath] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setMountedPath(window.location.pathname || pathname || "");
    }
  }, [pathname]);

  const handleGoBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <div className="bg-drafting-grid min-h-screen pt-20 sm:pt-24 pb-16 px-3 sm:px-6 md:px-8 flex flex-col items-center justify-between relative overflow-x-clip">
      {/* Top Fixed Sticky Navigation Bar */}
      <ScrapbookNavbar isAuthenticated={isAuthenticated} />

      {/* Interactive Characters on left & right margins */}
      <InteractiveFloatingCharacter side="left" character="man" />
      <InteractiveFloatingCharacter side="right" character="woman" />

      {/* Central Ruled Notebook 404 Sheet */}
      <main className="w-full max-w-3xl my-auto relative z-20 py-4 sm:py-8">
        <div className="relative rounded-2xl sm:rounded-3xl border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#1E2333] p-6 sm:p-10 md:p-12 shadow-paper text-[#111111] dark:text-white">
          {/* Washi Tape Accents */}
          <WashiTape color="blue" angle="steep-left" className="-top-3 left-6 z-30" />
          <WashiTape color="yellow" angle="steep-right" className="-top-3 right-6 z-30" />

          {/* Header Tag / Stamp */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-black/10 dark:border-white/10">
            <div className="inline-flex items-center gap-2 rounded-md border border-black bg-[#FEF08A] px-2.5 py-1 text-[11px] font-mono font-bold uppercase tracking-wider text-black shadow-[1.5px_1.5px_0px_#000]">
              <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
              ERROR 404 · DOCUMENT NOT FOUND
            </div>
            <span className="font-mono text-xs text-[#77786F] dark:text-[#94A3B8]">
              STATUS: HTTP_404_PAGE_MISSING
            </span>
          </div>

          {/* Big Visual 404 Display */}
          <div className="text-center pt-8 pb-4">
            <div className="inline-flex items-baseline gap-2 sm:gap-4 flex-wrap justify-center">
              <span className="font-tech text-7xl sm:text-9xl font-black tracking-tight text-[#111111] dark:text-white select-none">
                404
              </span>
              <span className="font-handwriting text-2xl sm:text-3xl text-[#1845E8] dark:text-[#93C5FD] -rotate-6 inline-block">
                wrong turn!
              </span>
            </div>

            <h1 className="font-tech text-2xl sm:text-3xl font-extrabold text-[#111111] dark:text-white mt-3">
              We Couldn&apos;t Find That Page
            </h1>

            <p className="mt-2 text-xs sm:text-sm text-[#55564E] dark:text-[#CBD5E1] max-w-lg mx-auto leading-relaxed">
              The link you followed may be mistyped, broken, or the page may have been moved or archived. Don&apos;t worry—your account, saved drafts, and generated CVs are completely safe.
            </p>

            {/* Display Attempted Path */}
            {mountedPath && mountedPath !== "/" && (
              <div className="mt-4 inline-flex items-center gap-2 max-w-full rounded-lg border border-black/15 dark:border-white/15 bg-[#F9FAFB] dark:bg-[#151922] px-3 py-1.5 font-mono text-xs text-[#55564E] dark:text-[#CBD5E1] shadow-[1.5px_1.5px_0px_rgba(0,0,0,0.06)] overflow-hidden">
                <Search className="h-3.5 w-3.5 flex-shrink-0 text-[#77786F]" />
                <span className="truncate">
                  Target: <strong className="text-[#111111] dark:text-white">{mountedPath}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Primary Action Buttons (NO ARROWS beside button text) */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-black dark:border-[#333C52] bg-[#111111] dark:bg-[#1A202C] px-5 py-3 font-tech text-xs sm:text-sm font-bold text-white shadow-[3px_3px_0px_#1B3AFF] hover:-translate-y-0.5 hover:shadow-[4.5px_4.5px_0px_#1B3AFF] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none active:scale-[0.98] transition-all cursor-pointer select-none"
            >
              <Home className="h-4 w-4" />
              <span>RETURN HOME</span>
            </Link>

            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#1E2333] px-5 py-3 font-tech text-xs sm:text-sm font-bold text-[#111111] dark:text-white shadow-[3px_3px_0px_#111111] dark:shadow-[3px_3px_0px_#000] hover:bg-[#F3F4F6] dark:hover:bg-[#252D3F] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#111111] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none active:scale-[0.98] transition-all cursor-pointer select-none"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>MY DASHBOARD</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#1E2333] px-5 py-3 font-tech text-xs sm:text-sm font-bold text-[#111111] dark:text-white shadow-[3px_3px_0px_#111111] dark:shadow-[3px_3px_0px_#000] hover:bg-[#F3F4F6] dark:hover:bg-[#252D3F] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#111111] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none active:scale-[0.98] transition-all cursor-pointer select-none"
              >
                <LogIn className="h-4 w-4" />
                <span>CANDIDATE LOGIN</span>
              </Link>
            )}

            <button
              type="button"
              onClick={handleGoBack}
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-black/30 dark:border-white/20 bg-transparent px-4 py-3 font-tech text-xs sm:text-sm font-bold text-[#55564E] dark:text-[#CBD5E1] hover:border-black hover:text-[#111111] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98] transition-all cursor-pointer select-none"
            >
              <span>PREVIOUS PAGE</span>
            </button>
          </div>

          {/* Quick Helpful Destinations Grid */}
          <div className="mt-10 border-t-2 border-black/10 dark:border-white/10 pt-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#55564E] dark:text-[#94A3B8] mb-4 text-center sm:text-left">
              Popular Pages &amp; Tools
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {QUICK_LINKS.map((link) => {
                const IconComponent = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group rounded-xl border-2 border-black/15 dark:border-white/15 bg-[#FAFAFA] dark:bg-[#161B26] p-4 transition-all duration-150 hover:-translate-y-0.5 hover:border-black dark:hover:border-white/40 hover:shadow-[3px_3px_0px_#111111] dark:hover:shadow-[3px_3px_0px_#000] cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg border border-black/15 dark:border-white/15 bg-white dark:bg-[#202736] p-2 text-[#1845E8] dark:text-[#60A5FA] group-hover:scale-105 transition-transform">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-tech text-xs font-bold text-[#111111] dark:text-white truncate">
                            {link.title}
                          </span>
                          <span className="rounded bg-black/5 dark:bg-white/10 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-[#55564E] dark:text-[#94A3B8]">
                            {link.tag}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-[#77786F] dark:text-[#94A3B8] line-clamp-2">
                          {link.desc}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Assistance Footer Note */}
          <div className="mt-8 rounded-xl border border-black/15 dark:border-white/15 bg-[#F9FAFB] dark:bg-[#151922] p-4 text-center text-xs text-[#55564E] dark:text-[#94A3B8]">
            <p>
              Looking for a specific CV or believe this is a technical issue? Contact us directly at{" "}
              <Link href="/contact" className="font-bold text-[#1845E8] dark:text-[#60A5FA] hover:underline">
                support@vitra.app
              </Link>{" "}
              or message us via the support widget at the bottom right.
            </p>
          </div>
        </div>
      </main>

      {/* Page Footer Stamp */}
      <footer className="w-full max-w-3xl text-center pt-6 pb-2 text-xs font-tech text-[#77786F] dark:text-[#94A3B8] flex flex-col items-center gap-2 relative z-20">
        <VitraFooterLogo href="/" size="sm" />
        <p>Vitra · Paid professional CV studio for Nigerian &amp; global job seekers.</p>
      </footer>
    </div>
  );
}

