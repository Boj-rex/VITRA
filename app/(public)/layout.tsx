import React from "react";
import Link from "next/link";
import { ScrapbookNavbar } from "@/components/scrapbook/ScrapbookNavbar";
import { VitraFooterLogo } from "@/components/layout/VitraFooterLogo";
import { WashiTape } from "@/components/scrapbook/WashiTape";
import { InteractiveFloatingCharacter } from "@/components/characters/InteractiveFloatingCharacter";
import { InteractiveBackgroundCanvas } from "@/components/interactive/InteractiveBackgroundCanvas";
import { FlyingClipboard3D } from "@/components/3d/FlyingClipboard3D";
import { getAuthenticatedUser } from "@/lib/auth/session";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthenticatedUser();

  return (
    <div className="bg-drafting-grid min-h-screen pt-20 sm:pt-24 pb-16 sm:pb-12 px-2 sm:px-4 md:px-8 flex flex-col items-center relative overflow-x-clip">
      {/* Top Fixed Sticky Navigation Bar */}
      <ScrapbookNavbar isAuthenticated={Boolean(user)} />

      {/* Background Interactive Canvas (adaptive text, ripples, drawers, mobile dock) */}
      <InteractiveBackgroundCanvas />

      {/* 3D Flying Clipboard floating freely across the screen in the background (Desktop only — permanently disabled on mobile) */}
      <div className="hidden md:block">
        <FlyingClipboard3D />
      </div>

      {/* Interactive Animated Characters on either side, tracking the cursor */}
      <InteractiveFloatingCharacter side="left" character="man" />
      <InteractiveFloatingCharacter side="right" character="woman" />

      {/* Central Ruled Notebook Sheet (Layered strictly in front of the flying clipboard) */}
      <div
        className="w-full max-w-5xl bg-ruled-paper rounded-2xl sm:rounded-3xl shadow-paper border border-[#D5D8DC] dark:border-[#202534] relative z-20 [transform:translate3d(0,0,1px)] isolate"
        style={{ transform: "translate3d(0, 0, 1px)", WebkitTransform: "translate3d(0, 0, 1px)" }}
      >
        {/* Taped Notebook Corners */}
        <WashiTape color="blue" angle="steep-left" className="-top-3 left-6 z-30" />
        <WashiTape color="yellow" angle="steep-right" className="-top-3 right-6 z-30" />

        {/* Main Content Area */}
        <main className="px-4 sm:px-8 md:px-12 py-8 sm:py-12">
          {children}
        </main>

        {/* Scrapbook Notebook Footer */}
        <footer className="border-t-2 border-[#111111] dark:border-[#262D3D] px-4 sm:px-8 md:px-12 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 font-tech text-xs text-[#77786F] dark:text-[#94A3B8] bg-white/40 dark:bg-[#0A0C12]/80">
          <div className="flex items-center gap-3.5">
            <VitraFooterLogo href="/" size="md" />
            <div className="flex flex-col">
              <span className="font-bold text-xs uppercase tracking-wider text-[#111111] dark:text-white">
                Vitra Career Studio
              </span>
              <span className="font-handwriting text-base text-[#111111] dark:text-[#CBD5E1]">
                built for Nigerian &amp; global job seekers
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            {/* Community & Status Dots */}
            <div className="flex items-center gap-1.5 mr-1 select-none">
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F59E0B] text-white text-[9px] font-bold shadow-sm"
                title="Job Seeker Community"
              >
                in
              </span>
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EC4899] text-white text-[9px] font-bold shadow-sm"
                title="Creative Showcase"
              >
                ✦
              </span>
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full bg-[#10B981] text-white text-[9px] font-bold shadow-sm"
                title="System Online"
              >
                ●
              </span>
            </div>
            <Link href="/templates" className="hover:text-black dark:hover:text-white hover:underline">
              Templates
            </Link>
            <Link href="/how-it-works" className="hover:text-black dark:hover:text-white hover:underline">
              How It Works
            </Link>
            <Link href="/pricing" className="hover:text-black dark:hover:text-white hover:underline">
              Packages
            </Link>
            <Link href="/about" className="hover:text-black dark:hover:text-white hover:underline">
              About
            </Link>
            <Link href="/faq" className="hover:text-black dark:hover:text-white hover:underline">
              FAQ
            </Link>
            <Link href="/contact" className="hover:text-black dark:hover:text-white hover:underline">
              Contact
            </Link>
            <Link href="/privacy" className="hover:text-black dark:hover:text-white hover:underline">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-black dark:hover:text-white hover:underline">
              Terms
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
