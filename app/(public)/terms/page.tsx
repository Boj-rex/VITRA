import React from "react";
import { WashiTape } from "@/components/scrapbook/WashiTape";
import { BreadcrumbStructuredData } from "@/components/seo/JsonLd";

export const metadata = {
  title: "Terms of Service — Vitra CV Studio",
  description:
    "Read Vitra's terms of service, clear pricing rules, candidate quotas, refund policies, and intellectual property rights for generated CVs.",
  keywords: [
    "Vitra terms of service",
    "CV builder terms Nigeria",
    "Paystack payment terms",
    "resume service agreement",
  ],
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    title: "Terms of Service — Vitra Career Studio",
    description:
      "Clear terms, fair usage guidelines, and service level commitments for Vitra CV Studio.",
    url: "/terms",
  },
};

export default function TermsPage() {
  return (
    <div className="space-y-12 sm:space-y-16">
      <BreadcrumbStructuredData
        items={[
          { name: "Home", url: "/" },
          { name: "Terms of Service", url: "/terms" },
        ]}
      />
      {/* Header */}
      <section className="text-center space-y-4 pt-2">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1 rounded-full border-2 border-[#111111] dark:border-[#333C52] bg-[#D1FAE5] dark:bg-[#0E2E23] px-3.5 py-1 text-xs font-bold text-[#065F46] dark:text-[#34D399] font-tech shadow-sticker-sm">
            <span>●</span>
            <span>USER AGREEMENT</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border-2 border-[#111111] dark:border-[#333C52] bg-[#FEF3C7] dark:bg-[#252210] px-3.5 py-1 text-xs font-bold text-[#92400E] dark:text-[#FBBF24] font-tech shadow-sticker-sm">
            <span>✦</span>
            <span>FAIR USE</span>
          </span>
        </div>

        <div className="pt-2">
          <p className="font-handwriting text-2xl sm:text-3xl text-[#55564E] dark:text-[#CBD5E1] font-semibold -rotate-2">
            terms and service commitments
          </p>
        </div>

        <div className="relative inline-block mx-auto">
          <h1 className="font-tech text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#111111] dark:text-white uppercase">
            TERMS OF SERVICE
          </h1>
        </div>

        <p className="font-tech text-base sm:text-lg text-[#55564E] dark:text-[#CBD5E1] max-w-xl mx-auto">
          Please review the clear service terms governing your Vitra account and CV downloads.
        </p>
      </section>

      {/* Main Document Card */}
      <section className="max-w-4xl mx-auto">
        <div className="relative rounded-2xl border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#1E2333] p-6 sm:p-10 shadow-sticker space-y-8 font-tech text-xs sm:text-sm leading-relaxed text-[#252821] dark:text-[#E2E8F0]">
          <WashiTape color="mint" angle="steep-left" className="-top-3 left-8" />
          <WashiTape color="pink" angle="steep-right" className="-top-3 right-8" />

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[#111111] dark:text-white flex items-center gap-2">
              <span className="font-pixel text-xs bg-[#F8D849] text-black px-2 py-0.5 rounded border border-black dark:border-[#333C52]">01</span>
              <span>Paid Service &amp; Tier Allowances</span>
            </h2>
            <p className="text-[#55564E] dark:text-[#CBD5E1]">
              Vitra operates as a paid career document studio. Access is structured according to your selected
              package: Starter (up to 2 CVs for ₦6,000), Professional (up to 6 CVs for ₦15,000), and Executive
              (up to 13 CVs for ₦20,000). Completed CV downloads require an active paid subscription or
              package allowance.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[#111111] dark:text-white flex items-center gap-2">
              <span className="font-pixel text-xs bg-[#10B981] text-white px-2 py-0.5 rounded border border-black dark:border-[#333C52]">02</span>
              <span>Truthfulness &amp; Candidate Accuracy</span>
            </h2>
            <p className="text-[#55564E] dark:text-[#CBD5E1]">
              You retain full ownership and responsibility for the truthfulness and accuracy of your CV.
              While Vitra’s AI writing assistants are engineered never to fabricate employers, credentials,
              or false statistics, you must review and verify all generated wording before submitting your CV
              to any prospective employer.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[#111111] dark:text-white flex items-center gap-2">
              <span className="font-pixel text-xs bg-[#EC4899] text-white px-2 py-0.5 rounded border border-black dark:border-[#333C52]">03</span>
              <span>Screen Capture Restrictions &amp; Protection</span>
            </h2>
            <p className="text-[#55564E] dark:text-[#CBD5E1]">
              To protect the commercial integrity of the platform and customer document security, screen
              captures, screenshots, and unauthorized browser printing are strictly disabled. Legitimate
              document delivery occurs exclusively through the official PDF and DOCX export channels.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[#111111] dark:text-white flex items-center gap-2">
              <span className="font-pixel text-xs bg-[#3B82F6] text-white px-2 py-0.5 rounded border border-black dark:border-[#333C52]">04</span>
              <span>No Employment Guarantee</span>
            </h2>
            <p className="text-[#55564E] dark:text-[#CBD5E1]">
              Vitra optimizes document structure, clarity, and ATS parsing readiness. While our users
              consistently experience significantly higher response rates, Vitra does not guarantee specific
              interview invitations, employer callbacks, or job offers.
            </p>
          </section>
        </div>
      </section>
    </div>
  );
}
