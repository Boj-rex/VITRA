import React from "react";
import Link from "next/link";
import { HelpCircle, MessageSquare } from "lucide-react";
import { FaqAccordion, FAQ_ITEMS } from "@/components/public/FaqAccordion";
import { WashiTape } from "@/components/scrapbook/WashiTape";
import { JsonLd, BreadcrumbStructuredData } from "@/components/seo/JsonLd";

export const metadata = {
  title: "Frequently Asked Questions — ATS CV Studio, NYSC, AI & Pricing",
  description:
    "Find answers to frequently asked questions about Vitra's pricing packages in Naira, ATS-conscious formatting, NYSC alignment, anti-fabrication AI policies, and PDF/DOCX downloads.",
  keywords: [
    "ATS CV questions Nigeria",
    "Vitra pricing FAQ",
    "NYSC CV FAQ",
    "ATS resume questions and answers",
    "how to download CV Word docx",
  ],
  alternates: {
    canonical: "/faq",
  },
  openGraph: {
    title: "Vitra Frequently Asked Questions & Knowledge Base",
    description:
      "Clear, honest answers about creating CVs, ATS screening, Gemini AI writing assistance, and Paystack payments.",
    url: "/faq",
  },
};

export default function FaqPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <div className="space-y-12 sm:space-y-16">
      <BreadcrumbStructuredData
        items={[
          { name: "Home", url: "/" },
          { name: "FAQ", url: "/faq" },
        ]}
      />
      <JsonLd data={faqSchema} />
      {/* Header */}
      <section className="text-center space-y-4 pt-2">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1 rounded-full border-2 border-[#111111] dark:border-[#333C52] bg-[#D1FAE5] dark:bg-[#0E2E23] px-3.5 py-1 text-xs font-bold text-[#065F46] dark:text-[#34D399] font-tech shadow-sticker-sm">
            <span>●</span>
            <span>KNOWLEDGE BASE</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border-2 border-[#111111] dark:border-[#333C52] bg-[#FEF3C7] dark:bg-[#252210] px-3.5 py-1 text-xs font-bold text-[#92400E] dark:text-[#FBBF24] font-tech shadow-sticker-sm">
            <span>✦</span>
            <span>TRANSPARENCY</span>
          </span>
        </div>

        <div className="pt-2">
          <p className="font-handwriting text-2xl sm:text-3xl text-[#55564E] dark:text-[#CBD5E1] font-semibold -rotate-2">
            answers to everything you might wonder
          </p>
        </div>

        <div className="relative inline-block mx-auto">
          <h1 className="font-tech text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#111111] dark:text-white uppercase">
            FREQUENTLY ASKED
          </h1>
        </div>

        <p className="font-tech text-base sm:text-lg text-[#55564E] dark:text-[#CBD5E1] max-w-xl mx-auto">
          Clear answers about creating CVs, uploading documents, AI integrity, payment packages, and
          privacy.
        </p>
      </section>

      {/* Accordion Container */}
      <section className="max-w-3xl mx-auto">
        <div className="relative rounded-2xl border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#1E2333] p-6 sm:p-8 shadow-sticker">
          <WashiTape color="yellow" angle="steep-left" className="-top-3 left-8" />
          <WashiTape color="blue" angle="steep-right" className="-top-3 right-8" />

          <FaqAccordion />
        </div>
      </section>

      {/* Help Note & CTA */}
      <section className="max-w-2xl mx-auto text-center space-y-4">
        <div className="rounded-xl border-2 border-black/10 dark:border-white/10 bg-[#E0F2FE] dark:bg-[#0C2438] p-5">
          <p className="font-tech text-xs font-bold text-[#0369A1] dark:text-[#60A5FA] uppercase tracking-wider">
            STILL HAVE A QUESTION?
          </p>
          <p className="font-handwriting text-xl text-[#111111] dark:text-white mt-1">
            We are always here to help you get your CV right.
          </p>
          <div className="mt-3 flex items-center justify-center gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 rounded-[6px] border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#1E2333] px-4 py-2 font-tech text-xs font-bold text-[#111111] dark:text-white shadow-[2px_2px_0px_#111111] dark:shadow-[2px_2px_0px_rgba(0,0,0,0.8)] hover:bg-[#F8D849] dark:hover:bg-[#F8D849] dark:hover:text-black transition-all"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>CONTACT SUPPORT</span>
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 rounded-[6px] border-2 border-black dark:border-[#333C52] bg-[#111111] dark:bg-[#1A202C] px-4 py-2 font-tech text-xs font-bold text-white shadow-[2px_2px_0px_#1B3AFF] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
            >
              <span>VIEW PACKAGES</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
