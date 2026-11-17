import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Check, Heart, Sparkles } from "lucide-react";
import { WashiTape } from "@/components/scrapbook/WashiTape";
import { HandDrawnArrow } from "@/components/scrapbook/HandDrawnArrow";
import { PolaroidFrame } from "@/components/scrapbook/PolaroidFrame";
import { BreadcrumbStructuredData } from "@/components/seo/JsonLd";

export const metadata = {
  title: "About Vitra — Accessible, Ethical Career Storytelling in Nigeria & Worldwide",
  description:
    "Founded in 2026, Vitra empowers Nigerian professionals and global applicants with accessible, transparent, and non-hallucinating CV crafting tools.",
  keywords: [
    "about Vitra",
    "career studio Nigeria",
    "ethical AI CV builder",
    "Lagos career studio",
    "African job seekers CV platform",
  ],
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Vitra Career Studio — Mission & Values",
    description:
      "Empowering African talent and global job seekers with honest, high-impact CV tools.",
    url: "/about",
  },
};

export default function AboutPage() {
  return (
    <div className="space-y-12 sm:space-y-16">
      <BreadcrumbStructuredData
        items={[
          { name: "Home", url: "/" },
          { name: "About", url: "/about" },
        ]}
      />
      {/* Hero Heading Banner */}
      <section className="text-center space-y-4 pt-2">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1 rounded-full border-2 border-[#111111] dark:border-[#333C52] bg-[#D1FAE5] dark:bg-[#0E2E23] px-3.5 py-1 text-xs font-bold text-[#065F46] dark:text-[#34D399] font-tech shadow-sticker-sm">
            <span>●</span>
            <span>FOUNDED 2026</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border-2 border-[#111111] dark:border-[#333C52] bg-[#FEF3C7] dark:bg-[#252210] px-3.5 py-1 text-xs font-bold text-[#92400E] dark:text-[#FBBF24] font-tech shadow-sticker-sm">
            <span>✦</span>
            <span>HUMAN FIRST</span>
          </span>
        </div>

        <div className="pt-2">
          <p className="font-handwriting text-2xl sm:text-3xl text-[#55564E] dark:text-[#CBD5E1] font-semibold -rotate-2">
            who we are &amp; why we build
          </p>
        </div>

        <div className="relative inline-block mx-auto max-w-full">
          <h1 className="font-tech text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#111111] dark:text-white uppercase">
            ABOUT VITRA
          </h1>
        </div>

        <p className="font-tech text-base sm:text-xl font-bold text-[#111111] dark:text-white max-w-2xl mx-auto leading-snug">
          Accessible career storytelling for every ambitious job seeker. 🎯
        </p>
      </section>

      {/* Manifesto Note */}
      <section className="relative max-w-2xl mx-auto text-center">
        <div className="rounded-2xl border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#1E2333] p-6 sm:p-8 shadow-sticker relative">
          <WashiTape color="mint" angle="steep-left" className="-top-3 left-6" />
          <WashiTape color="pink" angle="steep-right" className="-top-3 right-6" />

          <p className="font-handwriting text-2xl sm:text-3xl text-[#1E2022] dark:text-[#F1F5F9] leading-relaxed">
            Too many qualified candidates are overlooked simply because they have never been taught
            how to organize a CV, phrase everyday work clearly, or format documents for modern
            recruitment systems. Vitra exists to close that gap. ✨
          </p>
        </div>
      </section>

      {/* Three Scrapbook Index Cards */}
      <section className="space-y-6">
        <div className="text-center space-y-1">
          <p className="font-handwriting text-xl text-[#77786F] dark:text-[#94A3B8]">our foundation</p>
          <h2 className="font-tech text-2xl font-bold text-[#111111] dark:text-white">Our Guiding Principles</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Card 1: Nigeria & Global */}
          <div className="relative rounded-2xl border-2 border-black dark:border-[#333C52] bg-[#FEF9C3] dark:bg-[#252110] p-6 shadow-sticker flex flex-col justify-between">
            <WashiTape color="yellow" angle="left" className="-top-2.5 left-4" />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-tech text-xs font-bold text-[#854D0E] dark:text-[#FBBF24] uppercase tracking-wider">
                  01 · LOCAL CONTEXT
                </span>
                <span className="text-xl">🇳🇬</span>
              </div>
              <h3 className="font-tech text-xl font-bold text-[#111111] dark:text-white">
                Built with Nigeria in Mind
              </h3>
              <p className="text-xs sm:text-sm text-[#55564E] dark:text-[#CBD5E1] leading-relaxed">
                Native recognition for Nigerian education (SSCE, ND, HND, NCE, BSc, MSc), industrial
                training (SIWES), and National Youth Service Corps (NYSC), formatted to pass both
                Lagos tech boards and European ATS parsers.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-black/10 dark:border-white/10 flex items-center gap-1.5 text-[11px] font-bold font-tech text-[#854D0E] dark:text-[#FBBF24]">
              <Check className="h-3.5 w-3.5" />
              <span>+234 phone &amp; state localization</span>
            </div>
          </div>

          {/* Card 2: AI Integrity */}
          <div className="relative rounded-2xl border-2 border-black dark:border-[#333C52] bg-[#E0F2FE] dark:bg-[#0C2438] p-6 shadow-sticker flex flex-col justify-between">
            <WashiTape color="blue" angle="right" className="-top-2.5 right-4" />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-tech text-xs font-bold text-[#0369A1] dark:text-[#60A5FA] uppercase tracking-wider">
                  02 · HONESTY FIRST
                </span>
                <span className="text-xl">🛡️</span>
              </div>
              <h3 className="font-tech text-xl font-bold text-[#111111] dark:text-white">
                AI That Never Fabricates
              </h3>
              <p className="text-xs sm:text-sm text-[#55564E] dark:text-[#CBD5E1] leading-relaxed">
                Our writing assistance never invents employers, fake certificates, or inflated
                metrics. It transforms your real-world contributions into punchy, metric-driven
                accomplishments with verified integrity.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-black/10 dark:border-white/10 flex items-center gap-1.5 text-[11px] font-bold font-tech text-[#0369A1] dark:text-[#60A5FA]">
              <Check className="h-3.5 w-3.5" />
              <span>Zero hallucinated credentials</span>
            </div>
          </div>

          {/* Card 3: ATS Readability */}
          <div className="relative rounded-2xl border-2 border-black dark:border-[#333C52] bg-[#FCE7F3] dark:bg-[#2B1020] p-6 shadow-sticker flex flex-col justify-between">
            <WashiTape color="pink" angle="left" className="-top-2.5 left-4" />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-tech text-xs font-bold text-[#9D174D] dark:text-[#F472B6] uppercase tracking-wider">
                  03 · ATS COMPLIANCE
                </span>
                <span className="text-xl">⚡</span>
              </div>
              <h3 className="font-tech text-xl font-bold text-[#111111] dark:text-white">
                Engineered for Screeners
              </h3>
              <p className="text-xs sm:text-sm text-[#55564E] dark:text-[#CBD5E1] leading-relaxed">
                Every template is stress-tested against leading Applicant Tracking Systems (Workday,
                Greenhouse, Lever) using standard single-column text layers, Calibri and Times New
                Roman fonts, and clean bullet hierarchies.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-black/10 dark:border-white/10 flex items-center gap-1.5 text-[11px] font-bold font-tech text-[#9D174D] dark:text-[#F472B6]">
              <Check className="h-3.5 w-3.5" />
              <span>Clean PDF &amp; DOCX exports</span>
            </div>
          </div>
        </div>
      </section>

      {/* Polaroid Gallery Section */}
      <section className="rounded-2xl border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#1E2333] p-6 sm:p-10 shadow-sticker space-y-6">
        <div className="text-center space-y-1">
          <p className="font-handwriting text-xl text-[#77786F] dark:text-[#94A3B8]">every applicant matters</p>
          <h2 className="font-tech text-2xl font-bold text-[#111111] dark:text-white">The Candidates We Serve</h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 pt-2">
          <PolaroidFrame caption="New Graduate · NYSC Complete" tapeColor="yellow" rotation="left">
            <Image
              src="/man_frame_0.jpg"
              alt="Young Nigerian university graduate and NYSC corp member preparing an entry-level CV"
              width={260}
              height={260}
              className="h-full w-full object-cover object-top"
            />
          </PolaroidFrame>

          <PolaroidFrame caption="Mid-Level · Tech & Product" tapeColor="blue" rotation="right">
            <Image
              src="/woman_frame_0.jpg"
              alt="Mid-level tech and product professional tailoring a CV for competitive roles"
              width={260}
              height={260}
              className="h-full w-full object-cover object-top"
            />
          </PolaroidFrame>

          <PolaroidFrame caption="Senior Executive · Leadership" tapeColor="mint" rotation="left">
            <div className="w-full h-full bg-[#173B30] text-white flex flex-col items-center justify-center p-4 text-center">
              <span className="font-pixel text-2xl text-[#F8D849]">100%</span>
              <span className="font-tech text-xs mt-1 text-[#E2DDD2]">
                ATS Compliant Documents
              </span>
            </div>
          </PolaroidFrame>
        </div>
      </section>

      {/* CTA Box */}
      <section className="text-center pt-4">
        <div className="inline-flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/create"
            className="inline-flex items-center gap-2 rounded-[6px] border-2 border-black dark:border-[#333C52] bg-[#111111] dark:bg-[#1A202C] px-7 py-3.5 font-tech text-xs sm:text-sm font-bold text-white shadow-[4px_4px_0px_#1B3AFF] hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer"
          >
            <span className="h-2 w-2 rounded-full bg-[#10B981]" />
            <span>START CRAFTING YOUR CV — FROM ₦6,000</span>
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 rounded-[6px] border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#1E2333] px-5 py-3 font-tech text-xs sm:text-sm font-bold text-[#111111] dark:text-white shadow-[3px_3px_0px_#111111] dark:shadow-[3px_3px_0px_rgba(0,0,0,0.8)] hover:bg-[#F8D849] dark:hover:bg-[#F8D849] dark:hover:text-black transition-all"
          >
            <span>VIEW PRICING</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
