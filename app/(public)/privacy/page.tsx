import React from "react";
import { WashiTape } from "@/components/scrapbook/WashiTape";
import { CookiePreferencesTrigger } from "@/components/legal/CookiePreferencesTrigger";
import { BreadcrumbStructuredData } from "@/components/seo/JsonLd";

export const metadata = {
  title: "Privacy Policy — Vitra CV Studio",
  description:
    "Review Vitra's privacy policy, NDPA compliance, zero-data-selling pledge, and bank-grade encryption protocols for candidate CV data.",
  keywords: [
    "Vitra privacy policy",
    "NDPA compliance Nigeria",
    "CV data protection",
    "secure resume builder",
  ],
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Privacy Policy — Vitra Career Studio",
    description:
      "Strict data protection, NDPA compliance, and encryption standards for professional CV generation.",
    url: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <div className="space-y-12 sm:space-y-16">
      <BreadcrumbStructuredData
        items={[
          { name: "Home", url: "/" },
          { name: "Privacy Policy", url: "/privacy" },
        ]}
      />
      {/* Header */}
      <section className="text-center space-y-4 pt-2">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1 rounded-full border-2 border-[#111111] dark:border-[#333C52] bg-[#D1FAE5] dark:bg-[#0E2E23] px-3.5 py-1 text-xs font-bold text-[#065F46] dark:text-[#34D399] font-tech shadow-sticker-sm">
            <span>●</span>
            <span>NDPA COMPLIANT</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border-2 border-[#111111] dark:border-[#333C52] bg-[#FEF3C7] dark:bg-[#252210] px-3.5 py-1 text-xs font-bold text-[#92400E] dark:text-[#FBBF24] font-tech shadow-sticker-sm">
            <span>✦</span>
            <span>STRICT ENCRYPTION</span>
          </span>
        </div>

        <div className="pt-2">
          <p className="font-handwriting text-2xl sm:text-3xl text-[#55564E] dark:text-[#CBD5E1] font-semibold -rotate-2">
            your documents, your control
          </p>
        </div>

        <div className="relative inline-block mx-auto">
          <h1 className="font-tech text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#111111] dark:text-white uppercase">
            PRIVACY POLICY
          </h1>
        </div>

        <p className="font-tech text-base sm:text-lg text-[#55564E] dark:text-[#CBD5E1] max-w-xl mx-auto">
          Designed with the Nigeria Data Protection Act (NDPA) and international privacy standards in mind.
        </p>
      </section>

      {/* Main Document Card */}
      <section className="max-w-4xl mx-auto">
        <div className="relative rounded-2xl border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#1E2333] p-6 sm:p-10 shadow-sticker space-y-8 font-tech text-xs sm:text-sm leading-relaxed text-[#252821] dark:text-[#E2E8F0]">
          <WashiTape color="blue" angle="steep-left" className="-top-3 left-8" />
          <WashiTape color="yellow" angle="steep-right" className="-top-3 right-8" />

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[#111111] dark:text-white flex items-center gap-2">
              <span className="font-pixel text-xs bg-[#F8D849] text-black px-2 py-0.5 rounded border border-black dark:border-[#333C52]">01</span>
              <span>Information We Collect</span>
            </h2>
            <p className="text-[#55564E] dark:text-[#CBD5E1]">
              We collect the account details you provide at registration (full name and email address)
              and the CV information or PDF/DOCX files you choose to create or upload. Vitra does not
              require sensitive personal attributes such as date of birth, religion, marital status, or
              photographs.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[#111111] dark:text-white flex items-center gap-2">
              <span className="font-pixel text-xs bg-[#10B981] text-white px-2 py-0.5 rounded border border-black dark:border-[#333C52]">02</span>
              <span>Private Document Storage &amp; Isolation</span>
            </h2>
            <p className="text-[#55564E] dark:text-[#CBD5E1]">
              Your CVs and original uploaded documents are stored privately and isolated strictly to
              your authenticated account using server-side authorization and database Row Level Security
              policies. Your CV files are never exposed via public URLs.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[#111111] dark:text-white flex items-center gap-2">
              <span className="font-pixel text-xs bg-[#EC4899] text-white px-2 py-0.5 rounded border border-black dark:border-[#333C52]">03</span>
              <span>AI Writing &amp; Processing Integrity</span>
            </h2>
            <p className="text-[#55564E] dark:text-[#CBD5E1]">
              When you click an AI writing or analysis action, relevant CV text is transmitted securely
              to official AI inference endpoints. Vitra does not sell your CV content or use your
              personal CV history to train third-party public foundation models.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[#111111] dark:text-white flex items-center gap-2">
              <span className="font-pixel text-xs bg-[#F8D849] text-black px-2 py-0.5 rounded border border-black dark:border-[#333C52]">04</span>
              <span>Your Right to Deletion (Data Portability)</span>
            </h2>
            <p className="text-[#55564E] dark:text-[#CBD5E1]">
              You can export or permanently delete any CV or your entire account at any time from your
              account settings. Once confirmed, your records, drafts, and uploaded attachments are purged
              completely from our active storage.
            </p>
          </section>

          <section className="space-y-3 pt-2 border-t border-black/10 dark:border-white/10">
            <h2 className="text-base sm:text-lg font-bold text-[#111111] dark:text-white flex items-center gap-2">
              <span className="font-pixel text-xs bg-[#10B981] text-black px-2 py-0.5 rounded border border-black dark:border-[#333C52]">05</span>
              <span>Cookies &amp; Local Storage Transparency</span>
            </h2>
            <p className="text-[#55564E] dark:text-[#CBD5E1]">
              We only use strictly essential cookies for secure login authentication (<code>vitra_session</code>),
              theme preferences (<code>vitra_theme</code>), and cookie consent preferences (<code>vitra_cookie_consent</code>).
              We never use advertising cookies or third-party trackers. You can adjust your cookie settings at any time below:
            </p>
            <div className="pt-2">
              <CookiePreferencesTrigger />
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
