import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Check,
} from "lucide-react";
import { ScrapbookNavbar } from "@/components/scrapbook/ScrapbookNavbar";
import { VitraFooterLogo } from "@/components/layout/VitraFooterLogo";
import { WashiTape } from "@/components/scrapbook/WashiTape";
import { HandDrawnArrow } from "@/components/scrapbook/HandDrawnArrow";
import { PolaroidFrame } from "@/components/scrapbook/PolaroidFrame";
import { FolderTabCard } from "@/components/scrapbook/FolderTabCard";
import { InteractiveFloatingCharacter } from "@/components/characters/InteractiveFloatingCharacter";
import { InteractiveBackgroundCanvas } from "@/components/interactive/InteractiveBackgroundCanvas";
import { FlyingClipboard3D } from "@/components/3d/FlyingClipboard3D";
import { HeroShowcase } from "@/components/public/HeroShowcase";
import { FaqAccordion } from "@/components/public/FaqAccordion";
import { PRICING_PLANS } from "@/types/pricing";
import { HomePageStructuredData } from "@/components/seo/JsonLd";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Vitra — #1 ATS CV Builder in Nigeria | Create Professional CVs Online",
  description:
    "Create job-winning, ATS-compliant CVs online in 5 minutes with Vitra. Tailored for Nigerian professionals, NYSC graduates, and global remote opportunities. Includes 9 ATS templates, ethical Gemini AI writing, and instant PDF & Word (.docx) downloads.",
  keywords: [
    "CV builder",
    "CV maker",
    "create CV online",
    "CV builder Nigeria",
    "ATS resume builder",
    "free CV maker online",
    "best CV builder in Nigeria",
    "NYSC CV format",
    "Nigerian graduate CV template",
    "curriculum vitae builder",
    "download CV Word docx Nigeria",
    "PDF CV maker Lagos",
  ],
  alternates: {
    canonical: "/",
  },
};

export default async function HomePage() {
  const user = await getAuthenticatedUser();
  const createHref = user ? "/create" : "/register?intent=create";
  const uploadHref = user ? "/upload" : "/register?intent=upload";

  return (
    <div className="bg-drafting-grid min-h-screen pt-20 sm:pt-24 pb-16 sm:pb-12 px-2 sm:px-4 md:px-8 flex flex-col items-center relative overflow-x-clip">
      {/* Schema.org Rich Snippets for Google (FAQPage + HowTo) */}
      <HomePageStructuredData />
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
        className="w-full max-w-5xl bg-ruled-paper rounded-2xl sm:rounded-3xl shadow-paper border border-[#D5D8DC] dark:border-[#2D3548] relative z-20 [transform:translate3d(0,0,1px)] isolate"
        style={{ transform: "translate3d(0, 0, 1px)", WebkitTransform: "translate3d(0, 0, 1px)" }}
      >
        {/* Taped Notebook Corners */}
        <WashiTape color="blue" angle="steep-left" className="-top-3 left-6 z-30" />
        <WashiTape color="yellow" angle="steep-right" className="-top-3 right-6 z-30" />

        <main className="px-4 sm:px-8 md:px-12 py-8 sm:py-14 space-y-16 sm:space-y-24">
          {/* SECTION 1: HERO CENTERPIECE (MATCHING EXACT REFERENCE IMAGE) */}
          <section className="relative text-center pt-2 sm:pt-6 space-y-7">
            {/* Top Pill Badges */}
            <div className="flex items-center justify-center gap-3 sm:gap-6 flex-wrap">
              <span className="inline-flex items-center gap-1 rounded-full border-2 border-[#111111] dark:border-[#333C52] bg-[#D1FAE5] dark:bg-[#0E291F] px-3.5 py-1 text-xs font-bold text-[#065F46] dark:text-[#34D399] font-tech shadow-sticker-sm interactive-tap cursor-pointer active:scale-95">
                <span>●</span>
                <span>MADE FOR JOB SEEKERS</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border-2 border-[#111111] dark:border-[#333C52] bg-[#FEF3C7] dark:bg-[#252210] px-3.5 py-1 text-xs font-bold text-[#92400E] dark:text-[#FBBF24] font-tech shadow-sticker-sm interactive-tap cursor-pointer active:scale-95">
                <span>✦</span>
                <span>SWEAT THE DETAILS</span>
              </span>
            </div>

            {/* Handwritten "my name is" Annotation */}
            <div className="pt-2">
              <div className="inline-block relative">
                <p className="font-handwriting text-2xl sm:text-3xl text-[#55564E] dark:text-[#CBD5E1] font-semibold -rotate-2 select-none">
                  my name is
                </p>
                {/* Wavy Underline */}
                <svg
                  className="w-24 sm:w-28 h-2.5 mx-auto text-[#111111] dark:text-[#CBD5E1] -mt-1"
                  viewBox="0 0 100 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M2 5C18 1 34 7 50 4C66 1 82 7 98 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            {/* Centerpiece: Chunky Pixel Nameplate & Sketched Box */}
            <div className="relative inline-block mx-auto">
              {/* Left Post-it Tag with Arrow */}
              <div className="absolute -left-12 sm:-left-36 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1.5 z-20">
                <span className="rounded-md border-2 border-[#111111] dark:border-[#333C52] bg-[#FEF08A] dark:bg-[#252210] px-3 py-1.5 font-handwriting text-lg sm:text-xl font-bold text-[#111111] dark:text-[#FEF08A] shadow-sticker-sm -rotate-6 interactive-tap cursor-pointer active:scale-95">
                  Career Platform
                </span>
                <HandDrawnArrow direction="curve-right" className="text-[#111111] dark:text-[#CBD5E1]" />
              </div>

              {/* Center Box with Hand-Drawn Red Outline */}
              <div className="border-sketch bg-white dark:bg-[#1E2333] px-7 sm:px-14 py-4 sm:py-6 shadow-sm inline-block interactive-tap cursor-pointer active:scale-95">
                <span className="font-pixel text-4xl sm:text-6xl text-[#111111] dark:text-white tracking-widest uppercase select-none">
                  VITRA
                </span>
              </div>

              {/* Right Post-it Tag with Arrow */}
              <div className="absolute -right-12 sm:-right-36 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1.5 z-20">
                <HandDrawnArrow direction="curve-left" className="text-[#111111] dark:text-[#CBD5E1]" />
                <span className="rounded-md border-2 border-[#111111] dark:border-[#333C52] bg-[#A7F3D0] dark:bg-[#0E291F] px-3 py-1.5 font-handwriting text-lg sm:text-xl font-bold text-[#065F46] dark:text-[#34D399] shadow-sticker-sm rotate-6 interactive-tap cursor-pointer active:scale-95">
                  Nigeria & Global
                </span>
              </div>
            </div>

            {/* Status Bullet Subtitle */}
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#252821] dark:text-[#E2E8F0] font-tech uppercase tracking-wider select-none">
              <span className="h-2 w-2 rounded-full bg-[#1845E8] dark:bg-[#60A5FA]" />
              <span>OPEN TO DREAM OFFERS AND NEW HORIZONS</span>
              <span className="h-2 w-2 rounded-full bg-[#1845E8] dark:bg-[#60A5FA]" />
            </div>

            {/* Punchy Hero Headline (with Flanking Avatar Badges) */}
            <div className="relative max-w-2xl mx-auto pt-2">
              {/* Left Avatar Sticker */}
              <div className="absolute -left-4 sm:-left-16 top-1/2 -translate-y-1/2 hidden lg:block">
                <div className="h-14 w-14 rounded-full border-2 border-[#F97316] p-0.5 bg-white dark:bg-[#1E2333] shadow-sticker-sm overflow-hidden rotate-[-6deg]">
                  <Image
                    src="/man_frame_0.jpg"
                    alt="Vitra candidate avatar representing Nigerian and global professionals"
                    width={56}
                    height={56}
                    priority
                    className="h-full w-full rounded-full object-cover object-top"
                  />
                </div>
              </div>

              {/* Headline */}
              <h1 className="font-tech text-3xl sm:text-5xl font-bold tracking-tight text-[#111111] dark:text-white leading-[1.15]">
                I build CVs that <span className="inline-block text-[#10B981]">🎯</span>
                <br />
                get out of your way. <span className="inline-block text-[#EC4899]">🌸</span>
              </h1>

              {/* Right Avatar Sticker */}
              <div className="absolute -right-4 sm:-right-16 top-1/2 -translate-y-1/2 hidden lg:block">
                <div className="h-14 w-14 rounded-full border-2 border-[#F97316] p-0.5 bg-white dark:bg-[#1E2333] shadow-sticker-sm overflow-hidden rotate-[6deg]">
                  <Image
                    src="/woman_frame_0.jpg"
                    alt="Vitra candidate avatar representing executive and corporate leaders"
                    width={56}
                    height={56}
                    priority
                    className="h-full w-full rounded-full object-cover object-top"
                  />
                </div>
              </div>
            </div>

            {/* Central High-Contrast Tactile Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={createHref}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-black dark:border-[#333C52] bg-[#111111] dark:bg-[#1A202C] px-6 sm:px-8 py-3.5 font-tech text-xs sm:text-sm font-bold text-white shadow-[4px_4px_0px_#1B3AFF] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#1B3AFF] hover:scale-[1.01] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none active:scale-[0.98] transition-all duration-150 cursor-pointer select-none"
              >
                <span className="inline-block h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
                <span>BUILD MY CV — FROM ₦6,000</span>
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1.5 rounded-xl border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#1E2333] px-5 py-3.5 font-tech text-xs sm:text-sm font-bold text-[#111111] dark:text-white shadow-[3px_3px_0px_#111111] dark:shadow-[3px_3px_0px_#000] hover:bg-[#F8D849] dark:hover:bg-[#F8D849] dark:hover:text-black hover:-translate-y-1 hover:shadow-[5px_5px_0px_#111111] dark:hover:shadow-[5px_5px_0px_#F59E0B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none active:scale-[0.98] transition-all duration-150 cursor-pointer select-none"
              >
                <span>VIEW PACKAGES</span>
              </Link>
            </div>
          </section>

          {/* SECTION 2: HANDWRITTEN DIVIDER & "about us!" / "what's up" */}
          <section className="relative pt-6">
            {/* Soft Curved Pencil Divider */}
            <div className="relative py-2 flex justify-center overflow-hidden">
              <svg
                className="w-full max-w-3xl h-6 text-[#BAC7D5] dark:text-[#374158]"
                viewBox="0 0 1000 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M0 12C250 24 750 0 1000 12"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeDasharray="4 4"
                />
              </svg>
            </div>

            <div className="relative mt-6">
              {/* Handwritten "about us!" tag */}
              <div className="absolute left-0 -top-6 sm:-top-4">
                <span className="font-handwriting text-2xl sm:text-3xl font-bold text-[#55564E] dark:text-[#CBD5E1] -rotate-6 inline-block">
                  about us!
                </span>
              </div>

              {/* Framed "what's up" Badge */}
              <div className="text-center">
                <div className="inline-block rounded-md border-2 border-[#111111] dark:border-[#333C52] bg-white dark:bg-[#1E2333] px-5 py-1.5 font-tech text-sm font-bold text-[#111111] dark:text-white shadow-sticker-sm">
                  what&apos;s up
                </div>
              </div>

              {/* Main Scrapbook Grid: Polaroids on sides, handwritten manifesto in center */}
              <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-center">
                {/* Left Polaroid */}
                <div className="hidden lg:block lg:col-span-3">
                  <PolaroidFrame
                    caption="2026 applicant"
                    tapeColor="blue"
                    rotation="left"
                    className="max-w-[190px] mx-auto"
                  >
                    <Image
                      src="/man_frame_0.jpg"
                      alt="Young candidate preparing an ATS-compliant professional CV"
                      width={280}
                      height={280}
                      className="w-full h-full object-cover object-top"
                    />
                  </PolaroidFrame>
                </div>

                {/* Center Handwritten Manifesto */}
                <div className="lg:col-span-6 text-center space-y-6">
                  <p className="font-handwriting text-2xl sm:text-3xl text-[#1E2022] dark:text-[#F1F5F9] leading-relaxed max-w-lg mx-auto">
                    We&apos;re a CV platform that gets a little too excited about making
                    complicated job histories feel simple.{" "}
                    <span className="text-[#F59E0B]">✨</span> We care about the small
                    details, the edge cases applicant tracking systems drop, and shipping
                    applications that genuinely make someone&apos;s day easier.{" "}
                    <span className="text-[#EC4899]">🎨</span>
                  </p>

                  {/* Colorful Stamped Pills (Matching Reference Image - Interactive on Mobile & PC) */}
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <span className="inline-flex items-center rounded-lg border-2 border-[#111111] dark:border-[#262D3D] bg-[#F8D849] dark:bg-[#252210] px-3.5 py-1.5 font-tech text-xs font-bold text-[#111111] dark:text-[#FEF08A] shadow-sticker-sm interactive-tap cursor-pointer active:scale-95">
                      ATS Readability 100%
                    </span>
                    <span className="text-xs">✦</span>
                    <span className="inline-flex items-center rounded-lg border-2 border-[#111111] dark:border-[#262D3D] bg-[#10B981] px-3.5 py-1.5 font-tech text-xs font-bold text-white shadow-sticker-sm interactive-tap cursor-pointer active:scale-95">
                      Instant PDF &amp; DOCX
                    </span>
                    <span className="text-xs">🎯</span>
                    <span className="inline-flex items-center rounded-lg border-2 border-[#111111] dark:border-[#262D3D] bg-[#EC4899] px-3.5 py-1.5 font-tech text-xs font-bold text-white shadow-sticker-sm interactive-tap cursor-pointer active:scale-95">
                      Nigerian &amp; International (+234)
                    </span>
                    <span className="text-xs">🧩</span>
                    <span className="inline-flex items-center rounded-lg border-2 border-[#111111] dark:border-[#262D3D] bg-[#3B82F6] px-3.5 py-1.5 font-tech text-xs font-bold text-white shadow-sticker-sm interactive-tap cursor-pointer active:scale-95">
                      Smart Role Tailoring
                    </span>
                    <span className="text-xs">👀</span>
                  </div>
                </div>

                {/* Right Polaroid */}
                <div className="hidden lg:block lg:col-span-3">
                  <PolaroidFrame
                    caption="interview ready"
                    tapeColor="blue"
                    rotation="right"
                    className="max-w-[190px] mx-auto"
                  >
                    <Image
                      src="/woman_frame_0.jpg"
                      alt="Corporate professional with an interview-ready ATS CV"
                      width={280}
                      height={280}
                      className="w-full h-full object-cover object-top"
                    />
                  </PolaroidFrame>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 3: FOLDER-TAB PROJECT / FEATURE CARDS (THE EXACT CARDS FROM THE IMAGE) */}
          <section className="space-y-6 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-handwriting text-xl text-[#77786F] dark:text-[#94A3B8]">crafted for you</p>
                <h2 className="font-tech text-2xl sm:text-3xl font-bold text-[#111111] dark:text-white">
                  Featured Systems
                </h2>
              </div>
              <span className="font-tech text-xs text-[#77786F] dark:text-[#94A3B8]">● 03 PACKAGES</span>
            </div>

            {/* CARD 01: TANDEM STYLE (COBALT BLUE TAB, BLACK CARD) */}
            <FolderTabCard
              tabLabel="FEATURE 01  ●  ATS OPTIMIZATION"
              tabColor="blue"
              theme="dark"
              date="MAR 2, 2026"
              title="ATS Precision Engine"
              description="From 'who knows if anyone even reads it' to high-ranking CVs that pass every modern applicant tracking filter. Formatted cleanly with Calibri body or Times New Roman."
              linkText="EXPLORE ATS CHECKS"
              linkHref={uploadHref}
            >
              <div className="space-y-3 font-tech text-xs text-white">
                <div className="flex items-center justify-between border-b border-white/20 pb-2">
                  <span className="text-[#A7F3D0] font-bold">● READABILITY SCORE</span>
                  <span className="rounded bg-[#10B981] px-2 py-0.5 text-[11px] font-bold text-white">
                    98 / 100
                  </span>
                </div>
                <div className="space-y-1.5 text-white/80">
                  <p className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#10B981]" />
                    <span>Clean hanging-indent bullets</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#10B981]" />
                    <span>No unreadable multi-column tables</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#10B981]" />
                    <span>Supported across Workday, Taleo &amp; Greenhouse</span>
                  </p>
                </div>
              </div>
            </FolderTabCard>

            {/* CARD 02: FORGE STYLE (YELLOW TAB, YELLOW CARD) */}
            <FolderTabCard
              tabLabel="FEATURE 02  ●  GUIDED CREATION"
              tabColor="yellow"
              theme="yellow"
              date="JAN 2, 2026"
              title="The No-Panic Builder"
              description="Getting you from a blank screen to a finished executive-ready CV in 15 calm minutes. Dedicated paths for university graduates, NYSC, SIWES, and seasoned managers."
              linkText="START GUIDED BUILDER"
              linkHref={createHref}
            >
              <div className="space-y-3 font-tech text-xs text-black dark:text-white">
                <div className="flex items-center justify-between border-b border-black/20 dark:border-white/20 pb-2">
                  <span className="font-bold">● STEP-BY-STEP PROGRESS</span>
                  <span className="rounded bg-black dark:bg-[#F8D849] px-2 py-0.5 text-[11px] font-bold text-white dark:text-black">
                    8 Calibrated Steps
                  </span>
                </div>
                <div className="space-y-1.5 text-black/80 dark:text-white/80 font-medium">
                  <p>1. Career profile &amp; template matching</p>
                  <p>2. Plain-English prompts (no design stress)</p>
                  <p>3. AI polish that never invents fake claims</p>
                  <p>4. Instant preview &amp; download in PDF / DOCX</p>
                </div>
              </div>
            </FolderTabCard>

            {/* CARD 03: EMERALD FOREST TAB (TRANSPARENT PACKAGES & SECURITY) */}
            <FolderTabCard
              tabLabel="FEATURE 03  ●  TRANSPARENT PACKAGES"
              tabColor="forest"
              theme="forest"
              date="VERIFIED PRICING"
              title="Pay-As-You-Go, No Traps"
              description="Packages start at ₦6,000 for 2 CVs. Activate your authentic package: 2 CVs for ₦6,000, up to 6 for ₦15,000, or up to 13 for ₦20,000 with lifetime access and instant downloads."
              linkText="VIEW ALL PACKAGES"
              linkHref="/pricing"
            >
              <div className="space-y-2.5 font-tech text-xs text-white">
                <div className="rounded-lg bg-white/10 p-2.5 flex items-center justify-between">
                  <span>Starter (2 CVs)</span>
                  <span className="font-bold text-[#F8D849]">₦6,000</span>
                </div>
                <div className="rounded-lg bg-white/15 p-2.5 flex items-center justify-between border border-[#F8D849]/50">
                  <span>Standard Pro (Up to 6 CVs)</span>
                  <span className="font-bold text-[#F8D849]">₦15,000</span>
                </div>
                <div className="rounded-lg bg-white/10 p-2.5 flex items-center justify-between">
                  <span>Executive (Up to 13 CVs)</span>
                  <span className="font-bold text-[#F8D849]">₦20,000</span>
                </div>
              </div>
            </FolderTabCard>
          </section>

          {/* SECTION 4: INTERACTIVE LIVE CV SHOWCASE */}
          <section className="space-y-6 pt-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <p className="font-handwriting text-xl text-[#77786F] dark:text-[#94A3B8]">try it right here</p>
                <h2 className="font-tech text-2xl sm:text-3xl font-bold text-[#111111] dark:text-white">
                  Live Template Studio
                </h2>
              </div>
              <Link
                href="/templates"
                className="font-tech text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-[#CBD5E1] hover:underline flex items-center gap-1"
              >
                <span>Browse all layouts</span>
              </Link>
            </div>

            <HeroShowcase />
          </section>

          {/* SECTION 5: PRICING PACKAGES SNAPSHOT */}
          <section className="space-y-6 pt-6">
            <div className="text-center space-y-2">
              <span className="inline-block font-handwriting text-2xl text-[#55564E] dark:text-[#CBD5E1] -rotate-1">
                simple &amp; transparent
              </span>
              <h2 className="font-tech text-3xl sm:text-4xl font-bold text-[#111111] dark:text-white">
                Choose Your CV Package
              </h2>
              <p className="text-xs text-[#77786F] dark:text-[#94A3B8] font-tech">
                Packages start at ₦6,000 · Transparent one-time pricing via Paystack
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {PRICING_PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className="relative rounded-2xl border-2 border-[#111111] dark:border-[#333C52] bg-white dark:bg-[#1E2333] p-6 shadow-sticker flex flex-col justify-between"
                >
                  {plan.badge && (
                    <div className="absolute -top-3 right-4 rounded-full bg-[#1845E8] px-3 py-0.5 text-[10px] font-bold text-white uppercase font-tech shadow-sm">
                      {plan.badge}
                    </div>
                  )}

                  <div>
                    <h3 className="font-tech text-xs font-bold uppercase tracking-wider text-[#77786F] dark:text-[#94A3B8]">
                      {plan.name}
                    </h3>
                    <p className="mt-2 font-tech text-3xl font-bold text-[#111111] dark:text-white">
                      {plan.formattedPrice}
                    </p>
                    <p className="mt-1 font-tech text-xs font-bold text-[#10B981]">
                      Up to {plan.maxCvs} Completed CVs
                    </p>
                    <p className="mt-2 text-xs text-[#55564E] dark:text-[#CBD5E1] leading-relaxed">
                      {plan.tagline}
                    </p>

                    <div className="mt-4 border-t border-[#E5E7EB] dark:border-[#333C52] pt-4 space-y-2 text-xs text-[#252821] dark:text-[#E2E8F0]">
                      {plan.features.map((f, i) => (
                        <p key={i} className="flex items-center gap-2">
                          <Check className="h-3.5 w-3.5 text-[#10B981] shrink-0" />
                          <span>{f}</span>
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6">
                    <Link
                      href={`/pricing/receipt?plan=${plan.id}`}
                      className={cn(
                        "block w-full text-center rounded-xl border-2 border-black dark:border-[#333C52] py-3 font-tech text-xs sm:text-sm font-bold tracking-wider uppercase transition-all duration-150 select-none cursor-pointer shadow-[3px_3px_0px_#111111] dark:shadow-[3px_3px_0px_#000] hover:-translate-y-0.5 hover:shadow-[4.5px_4.5px_0px_#111111] dark:hover:shadow-[4.5px_4.5px_0px_#F59E0B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none active:scale-[0.98]",
                        plan.popular
                          ? "bg-[#F8D849] text-[#111111] hover:bg-[#FACC15]"
                          : "bg-[#111111] dark:bg-[#1A202C] text-white hover:bg-[#F8D849] hover:text-black"
                      )}
                    >
                      <span>SELECT PLAN</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 6: FAQ ACCORDION */}
          <section className="space-y-6 pt-6">
            <div>
              <p className="font-handwriting text-xl text-[#77786F] dark:text-[#94A3B8]">got questions?</p>
              <h2 className="font-tech text-2xl sm:text-3xl font-bold text-[#111111] dark:text-white">
                Frequently Asked Questions
              </h2>
            </div>
            <div className="rounded-2xl border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#1E2333] p-6 shadow-sticker">
              <FaqAccordion />
            </div>
          </section>

          {/* SECTION 7: NOTEBOOK FOOTER */}
          <footer className="border-t-2 border-[#111111] dark:border-[#333C52] pt-8 pb-6 flex flex-col sm:flex-row items-center justify-between gap-6 font-tech text-xs text-[#77786F] dark:text-[#94A3B8]">
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
        </main>
      </div>
    </div>
  );
}
