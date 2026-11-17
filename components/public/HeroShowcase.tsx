"use client";

import React, { useState } from "react";
import { CvDocumentPreview } from "@/components/templates/CvDocumentPreview";
import { WashiTape } from "@/components/scrapbook/WashiTape";
import {
  SAMPLE_SHOWCASE_CV,
  TEMPLATE_METADATA,
  createDefaultEditorSettings,
} from "@/lib/cv/defaults";
import { cn } from "@/lib/utils";
import type { StructuredCvContent, TemplateId } from "@/types/cv";

const GRADUATE_SHOWCASE_CV: StructuredCvContent = {
  personalInfo: {
    fullName: "Chisom Blessing Nwosu",
    professionalTitle: "Biochemistry Graduate & Quality Lab Trainee",
    email: "chisom.nwosu@example.com",
    phone: "+234 809 000 0218",
    city: "Enugu",
    country: "Nigeria",
    linkedinUrl: "linkedin.com/in/chisom-nwosu",
    portfolioUrl: "",
    websiteUrl: "",
  },
  summary:
    "Detail-oriented Biochemistry graduate with practical laboratory and quality documentation exposure gained through 6-month SIWES industrial training and NYSC community health service. Skilled in sample logging, safety compliance, and Excel reporting.",
  hasFormalExperience: false,
  experience: [],
  alternativeExperience: [
    {
      id: "alt-demo-1",
      category: "nysc",
      title: "NYSC Laboratory & Records Assistant",
      organization: "General Hospital Enugu",
      location: "Enugu, Nigeria",
      startDate: "Nov 2024",
      endDate: "Oct 2025",
      isCurrent: false,
      description:
        "Logged patient sample records accurately, maintained daily reagent stock counts, and supported community health awareness outreach.",
    },
    {
      id: "alt-demo-2",
      category: "siwes",
      title: "SIWES Industrial Trainee",
      organization: "Eastern Diagnostics Lab",
      location: "Enugu, Nigeria",
      startDate: "May 2023",
      endDate: "Oct 2023",
      isCurrent: false,
      description:
        "Assisted senior analysts with routine bench preparation, glassware sterilization, and quality assurance checklists.",
    },
  ],
  education: [
    {
      id: "edu-demo-1",
      institution: "University of Nigeria, Nsukka",
      qualification: "BSc",
      fieldOfStudy: "Biochemistry",
      startDate: "2019",
      endDate: "2024",
      isCurrent: false,
      achievements: "Second Class Honours (Upper Division)",
    },
  ],
  skills: [
    { id: "gs-1", name: "Laboratory Safety", category: "technical" },
    { id: "gs-2", name: "Sample Logging", category: "technical" },
    { id: "gs-3", name: "Microsoft Excel", category: "digital" },
    { id: "gs-4", name: "Report Writing", category: "communication" },
    { id: "gs-5", name: "English", category: "languages" },
  ],
  certifications: [],
  projects: [
    {
      id: "proj-demo-1",
      title: "Final-Year Water Quality Assessment Study",
      role: "Undergraduate Researcher",
      description:
        "Collected and compared borehole water pH and microbial indicators across three local communities.",
      technologies: ["Spectrophotometry", "Excel"],
      outcome: "Presented findings to departmental seminar panel.",
      projectUrl: "",
    },
  ],
  additional: {
    memberships: [],
    publications: [],
    awards: [],
    volunteerSummary: "",
    languages: ["English (Fluent)", "Igbo (Native)"],
    interests: [],
    references: [],
    omitReferences: true,
  },
};

export function HeroShowcase() {
  const [templateId, setTemplateId] = useState<TemplateId>("modern-minimal");
  const [persona, setPersona] = useState<"experienced" | "graduate">("experienced");

  const cv = persona === "experienced" ? SAMPLE_SHOWCASE_CV : GRADUATE_SHOWCASE_CV;
  const settings = createDefaultEditorSettings(
    persona === "graduate" ? "recent-graduate" : "experienced-professional"
  );

  return (
    <div className="relative rounded-2xl border-2 border-[#111111] dark:border-[#333C52] bg-[#FAF8F5] dark:bg-[#1E2333] p-3 sm:p-5 shadow-[5px_5px_0px_#111111] dark:shadow-[5px_5px_0px_rgba(0,0,0,0.8)] select-none">
      {/* Top Left Washi Tape */}
      <WashiTape color="blue" angle="steep-left" className="-top-3 left-6" />
      {/* Top Right Washi Tape */}
      <WashiTape color="yellow" angle="steep-right" className="-top-3 right-6" />

      {/* Floating handwritten note badge */}
      <div className="absolute -top-3.5 right-24 hidden sm:inline-flex items-center gap-1 rounded-full bg-[#111111] dark:bg-[#1A202C] px-3 py-0.5 text-[10px] font-bold text-white font-tech shadow-sm border border-white/10">
        <span>● LIVE INTERACTIVE PREVIEW</span>
      </div>

      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2 px-1 pt-1">
        <div className="flex items-center gap-1 rounded-xl border-2 border-[#111111] dark:border-[#333C52] bg-white dark:bg-[#242A3D] p-1 text-[11px] shadow-[2px_2px_0px_#111111] dark:shadow-[2px_2px_0px_#000] font-tech select-none">
          <button
            type="button"
            onClick={() => setPersona("experienced")}
            className={cn(
              "rounded-lg px-3 py-1.5 font-bold transition-all duration-150 cursor-pointer select-none",
              "hover:-translate-y-0.5 active:translate-y-0.5 active:scale-95",
              persona === "experienced"
                ? "bg-[#111111] dark:bg-[#1E2536] text-white shadow-[1px_1px_0px_rgba(0,0,0,0.3)]"
                : "text-[#55564E] dark:text-[#CBD5E1] hover:text-black dark:hover:text-white"
            )}
          >
            Experienced Pro
          </button>
          <button
            type="button"
            onClick={() => {
              setPersona("graduate");
              setTemplateId("graduate-entry");
            }}
            className={cn(
              "rounded-lg px-3 py-1.5 font-bold transition-all duration-150 cursor-pointer select-none",
              "hover:-translate-y-0.5 active:translate-y-0.5 active:scale-95",
              persona === "graduate"
                ? "bg-[#111111] dark:bg-[#1E2536] text-white shadow-[1px_1px_0px_rgba(0,0,0,0.3)]"
                : "text-[#55564E] dark:text-[#CBD5E1] hover:text-black dark:hover:text-white"
            )}
          >
            Graduate / NYSC
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 font-tech select-none">
          {TEMPLATE_METADATA.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTemplateId(t.id)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all duration-150 cursor-pointer border-2",
                "hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none active:scale-95",
                templateId === t.id
                  ? "bg-[#F8D849] text-[#111111] border-black shadow-[2px_2px_0px_#111] dark:shadow-[2px_2px_0px_#000]"
                  : "bg-white dark:bg-[#242A3D] text-[#77786F] dark:text-[#CBD5E1] border-black/20 dark:border-white/20 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white shadow-[1px_1px_0px_rgba(0,0,0,0.1)]"
              )}
            >
              {t.name.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-[460px] overflow-y-auto rounded-xl border border-black/15 dark:border-[#333C52] bg-[#F3F4F6] dark:bg-[#141722] p-2 sm:p-3 shadow-inner">
        <CvDocumentPreview
          cv={cv}
          templateId={templateId}
          settings={settings}
          className="shadow-sm text-[10px] sm:text-[10.5px] p-5 sm:p-6"
        />
      </div>
    </div>
  );
}

