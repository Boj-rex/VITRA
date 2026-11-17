import React from "react";
import Link from "next/link";
import { Check, FileText, Sparkles, UploadCloud, Zap } from "lucide-react";
import { WashiTape } from "@/components/scrapbook/WashiTape";
import { FolderTabCard } from "@/components/scrapbook/FolderTabCard";
import { JsonLd, BreadcrumbStructuredData } from "@/components/seo/JsonLd";

export const metadata = {
  title: "How It Works — ATS Scoring & Step-by-Step CV Crafting",
  description:
    "Learn how Vitra guides you from blank page to recruiter-ready CV. Discover our deterministic ATS engine, ethical Gemini AI assistance, NYSC alignment, and vector exports.",
  keywords: [
    "how ATS works Nigeria",
    "pass ATS resume scanner",
    "CV tailoring process",
    "NYSC CV guidance",
    "how to write an ATS CV",
  ],
  alternates: {
    canonical: "/how-it-works",
  },
  openGraph: {
    title: "How Vitra Works — Step-by-Step ATS CV Crafting",
    description:
      "A guided, transparent methodology for building CVs that recruiters read and ATS software indexes accurately.",
    url: "/how-it-works",
  },
};

export default function HowItWorksPage() {
  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Build an ATS-Friendly CV with Vitra",
    description:
      "Step-by-step methodology to create a professional, recruiter-ready CV tailored for Nigerian and international job markets.",
    totalTime: "PT15M",
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Register your secure Vitra account",
        text: "Sign up with encrypted personal data and candidate privacy.",
        url: "https://vitra.app/register",
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Select your candidate pathway",
        text: "Choose from graduate, NYSC corp member, first-time job seeker, or seasoned executive.",
        url: "https://vitra.app/create",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Fill structured credentials",
        text: "Input SSCE, ND, HND, BSc, MSc, SIWES, NYSC, and verified professional certifications.",
        url: "https://vitra.app/create",
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "Refine with ethical AI writing",
        text: "Transform daily job duties into punchy, metric-driven accomplishments without fabricated details.",
        url: "https://vitra.app/create",
      },
      {
        "@type": "HowToStep",
        position: 5,
        name: "Preview & export instantly",
        text: "Switch between 9 ATS templates and export clean PDF and Word (.docx) files.",
        url: "https://vitra.app/templates",
      },
    ],
  };

  return (
    <div className="space-y-12 sm:space-y-16">
      <BreadcrumbStructuredData
        items={[
          { name: "Home", url: "/" },
          { name: "How It Works", url: "/how-it-works" },
        ]}
      />
      <JsonLd data={howToSchema} />
      {/* Header */}
      <section className="text-center space-y-4 pt-2">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1 rounded-full border-2 border-[#111111] dark:border-[#333C52] bg-[#D1FAE5] dark:bg-[#0E2E23] px-3.5 py-1 text-xs font-bold text-[#065F46] dark:text-[#34D399] font-tech shadow-sticker-sm">
            <span>●</span>
            <span>STRUCTURED METHOD</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border-2 border-[#111111] dark:border-[#333C52] bg-[#FEF3C7] dark:bg-[#252210] px-3.5 py-1 text-xs font-bold text-[#92400E] dark:text-[#FBBF24] font-tech shadow-sticker-sm">
            <span>✦</span>
            <span>ATS SCREENER READY</span>
          </span>
        </div>

        <div className="pt-2">
          <p className="font-handwriting text-2xl sm:text-3xl text-[#55564E] dark:text-[#CBD5E1] font-semibold -rotate-2">
            a guided path to interview success
          </p>
        </div>

        <div className="relative inline-block mx-auto max-w-full">
          <h1 className="font-tech text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#111111] dark:text-white uppercase">
            HOW IT WORKS
          </h1>
        </div>

        <p className="font-tech text-base sm:text-lg text-[#55564E] dark:text-[#CBD5E1] max-w-xl mx-auto">
          Two deliberate workflows designed to turn raw career history into verified interview offers.
        </p>
      </section>

      {/* Two Main Pathways */}
      <section className="grid gap-8 md:grid-cols-2 items-stretch">
        {/* Pathway 1: Wizard */}
        <div className="relative rounded-2xl border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#1E2333] p-6 sm:p-8 shadow-sticker flex flex-col justify-between">
          <WashiTape color="blue" angle="steep-left" className="-top-3 left-6" />

          <div className="space-y-6">
            <div className="flex items-center justify-between border-b-2 border-black/10 dark:border-white/10 pb-4">
              <div>
                <span className="font-tech text-xs font-bold text-[#1845E8] dark:text-[#60A5FA] uppercase tracking-wider">
                  PATH A · STARTING FRESH
                </span>
                <h2 className="font-tech text-2xl font-bold text-[#111111] dark:text-white mt-0.5">
                  Step-by-Step CV Wizard
                </h2>
              </div>
              <div className="h-10 w-10 rounded-xl border-2 border-black dark:border-[#333C52] bg-[#E0F2FE] dark:bg-[#0C2438] flex items-center justify-center text-xl">
                📝
              </div>
            </div>

            <ol className="space-y-4 text-xs sm:text-sm text-[#252821] dark:text-[#E2E8F0]">
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-black dark:border-[#333C52] bg-[#F8D849] font-tech text-xs font-bold text-black">
                  1
                </span>
                <div>
                  <h3 className="font-bold text-[#111111] dark:text-white text-xs sm:text-sm">Register your secure Vitra account</h3>
                  <p className="text-[#55564E] dark:text-[#CBD5E1] text-xs mt-0.5">
                    Your personal data is encrypted, strictly private, and isolated.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-black dark:border-[#333C52] bg-[#F8D849] font-tech text-xs font-bold text-black">
                  2
                </span>
                <div>
                  <h3 className="font-bold text-[#111111] dark:text-white text-xs sm:text-sm">Select your candidate pathway</h3>
                  <p className="text-[#55564E] dark:text-[#CBD5E1] text-xs mt-0.5">
                    Recent graduate, NYSC corp member, first-time job seeker, or seasoned professional.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-black dark:border-[#333C52] bg-[#F8D849] font-tech text-xs font-bold text-black">
                  3
                </span>
                <div>
                  <h3 className="font-bold text-[#111111] dark:text-white text-xs sm:text-sm">Fill structured credentials</h3>
                  <p className="text-[#55564E] dark:text-[#CBD5E1] text-xs mt-0.5">
                    SSCE, ND, HND, BSc, MSc, SIWES, NYSC, volunteering, and verified certifications.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-black dark:border-[#333C52] bg-[#F8D849] font-tech text-xs font-bold text-black">
                  4
                </span>
                <div>
                  <h3 className="font-bold text-[#111111] dark:text-white text-xs sm:text-sm">Refine with ethical AI writing</h3>
                  <p className="text-[#55564E] dark:text-[#CBD5E1] text-xs mt-0.5">
                    Turn loose job duties into high-impact action bullets with quantifiable results.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-black dark:border-[#333C52] bg-[#F8D849] font-tech text-xs font-bold text-black">
                  5
                </span>
                <div>
                  <h3 className="font-bold text-[#111111] dark:text-white text-xs sm:text-sm">Preview &amp; export instantly</h3>
                  <p className="text-[#55564E] dark:text-[#CBD5E1] text-xs mt-0.5">
                    Switch between 4 ATS templates and download clean PDF and Word (.docx) formats.
                  </p>
                </div>
              </li>
            </ol>
          </div>

          <div className="pt-6 border-t-2 border-black/10 dark:border-white/10 mt-6">
            <Link
              href="/create"
              className="inline-flex w-full items-center justify-center gap-2 rounded-[6px] border-2 border-black dark:border-[#333C52] bg-[#111111] dark:bg-[#1A202C] py-3 text-xs font-tech font-bold text-white shadow-[3px_3px_0px_#1B3AFF] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
            >
              <span>LAUNCH CV CREATOR — FROM ₦6,000</span>
            </Link>
          </div>
        </div>

        {/* Pathway 2: Upload */}
        <div className="relative rounded-2xl border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#1E2333] p-6 sm:p-8 shadow-sticker flex flex-col justify-between">
          <WashiTape color="yellow" angle="steep-right" className="-top-3 right-6" />

          <div className="space-y-6">
            <div className="flex items-center justify-between border-b-2 border-black/10 dark:border-white/10 pb-4">
              <div>
                <span className="font-tech text-xs font-bold text-[#92400E] dark:text-[#FBBF24] uppercase tracking-wider">
                  PATH B · EXISTING CV
                </span>
                <h2 className="font-tech text-2xl font-bold text-[#111111] dark:text-white mt-0.5">
                  Upload &amp; Improve Workflow
                </h2>
              </div>
              <div className="h-10 w-10 rounded-xl border-2 border-black dark:border-[#333C52] bg-[#FEF3C7] dark:bg-[#252210] flex items-center justify-center text-xl">
                📂
              </div>
            </div>

            <ol className="space-y-4 text-xs sm:text-sm text-[#252821] dark:text-[#E2E8F0]">
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-black dark:border-[#333C52] bg-[#10B981] font-tech text-xs font-bold text-white">
                  1
                </span>
                <div>
                  <h3 className="font-bold text-[#111111] dark:text-white text-xs sm:text-sm">Upload your PDF or Word document</h3>
                  <p className="text-[#55564E] dark:text-[#CBD5E1] text-xs mt-0.5">
                    Supports existing .pdf and .docx files up to 10 MB.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-black dark:border-[#333C52] bg-[#10B981] font-tech text-xs font-bold text-white">
                  2
                </span>
                <div>
                  <h3 className="font-bold text-[#111111] dark:text-white text-xs sm:text-sm">Intelligent section parsing</h3>
                  <p className="text-[#55564E] dark:text-[#CBD5E1] text-xs mt-0.5">
                    Extracts work experience, education, skills, and dates into editable fields.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-black dark:border-[#333C52] bg-[#10B981] font-tech text-xs font-bold text-white">
                  3
                </span>
                <div>
                  <h3 className="font-bold text-[#111111] dark:text-white text-xs sm:text-sm">Audit ATS &amp; grammar readiness</h3>
                  <p className="text-[#55564E] dark:text-[#CBD5E1] text-xs mt-0.5">
                    Flags passive verbs, missing metrics, and formatting red flags.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-black dark:border-[#333C52] bg-[#10B981] font-tech text-xs font-bold text-white">
                  4
                </span>
                <div>
                  <h3 className="font-bold text-[#111111] dark:text-white text-xs sm:text-sm">Target a specific job description</h3>
                  <p className="text-[#55564E] dark:text-[#CBD5E1] text-xs mt-0.5">
                    Paste employer job requirements for a side-by-side keyword match audit.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-black dark:border-[#333C52] bg-[#10B981] font-tech text-xs font-bold text-white">
                  5
                </span>
                <div>
                  <h3 className="font-bold text-[#111111] dark:text-white text-xs sm:text-sm">Export improved &amp; verified CV</h3>
                  <p className="text-[#55564E] dark:text-[#CBD5E1] text-xs mt-0.5">
                    Download perfectly structured, screener-proof PDF and Word (.docx) files.
                  </p>
                </div>
              </li>
            </ol>
          </div>

          <div className="pt-6 border-t-2 border-black/10 dark:border-white/10 mt-6">
            <Link
              href="/upload"
              className="inline-flex w-full items-center justify-center gap-2 rounded-[6px] border-2 border-black dark:border-[#333C52] bg-[#F8D849] py-3 text-xs font-tech font-bold text-[#111111] shadow-[3px_3px_0px_#111111] hover:bg-[#FACC15] transition-all"
            >
              <span>UPLOAD YOUR CURRENT CV</span>
              <UploadCloud className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Technical Integrity Badge Section */}
      <section className="rounded-2xl border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#1E2333] p-6 sm:p-8 shadow-sticker space-y-4">
        <div className="text-center space-y-2">
          <p className="font-handwriting text-xl text-[#77786F] dark:text-[#94A3B8]">built for real results</p>
          <h2 className="font-tech text-2xl font-bold text-[#111111] dark:text-white">
            Why Vitra CVs Pass Recruitment Systems
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-4 pt-2 text-center">
          <div className="rounded-xl border-2 border-black/10 dark:border-white/10 bg-[#FEF9C3] dark:bg-[#252110] p-4">
            <span className="font-pixel text-xl text-[#111111] dark:text-white">01</span>
            <p className="font-tech text-xs font-bold text-[#111111] dark:text-white mt-2">Single Column</p>
            <p className="text-[11px] text-[#55564E] dark:text-[#CBD5E1] mt-1">Parsers read left-to-right without column jams.</p>
          </div>

          <div className="rounded-xl border-2 border-black/10 dark:border-white/10 bg-[#D1FAE5] dark:bg-[#0E2E23] p-4">
            <span className="font-pixel text-xl text-[#111111] dark:text-white">02</span>
            <p className="font-tech text-xs font-bold text-[#111111] dark:text-white mt-2">Standard Fonts</p>
            <p className="text-[11px] text-[#55564E] dark:text-[#CBD5E1] mt-1">Calibri body &amp; Times New Roman TrueType embedded.</p>
          </div>

          <div className="rounded-xl border-2 border-black/10 dark:border-white/10 bg-[#E0F2FE] dark:bg-[#0C2438] p-4">
            <span className="font-pixel text-xl text-[#111111] dark:text-white">03</span>
            <p className="font-tech text-xs font-bold text-[#111111] dark:text-white mt-2">Hanging Bullets</p>
            <p className="text-[11px] text-[#55564E] dark:text-[#CBD5E1] mt-1">Clear indentation prevents multi-line text collisions.</p>
          </div>

          <div className="rounded-xl border-2 border-black/10 dark:border-white/10 bg-[#FCE7F3] dark:bg-[#2B1020] p-4">
            <span className="font-pixel text-xl text-[#111111] dark:text-white">04</span>
            <p className="font-tech text-xs font-bold text-[#111111] dark:text-white mt-2">Dual Export</p>
            <p className="text-[11px] text-[#55564E] dark:text-[#CBD5E1] mt-1">Identical layout across PDF and Microsoft Word .docx.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
