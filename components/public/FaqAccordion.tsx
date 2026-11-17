"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const FAQ_ITEMS = [
  {
    question: "How does Vitra's pricing work?",
    answer:
      "Vitra offers transparent, value-based packages: 2 CVs attract a fee of ₦6,000; anything above 2 up to 6 CVs attracts a fee of ₦15,000; and anything above 6 up to 13 CVs attracts a fee of ₦20,000 (with 13 CVs being the maximum allowance). Every package includes all 4 ATS-conscious templates, Gemini AI writing assistance, job tailoring, and unlimited PDF & Word (.docx) downloads.",
  },
  {
    question: "Why is screen capture restricted on the website?",
    answer:
      "Vitra incorporates built-in anti-screenshot and browser print protection to safeguard your personal career details and intellectual property from unauthorized screen grabs, background recorders, and automated scrapers. Official documents are cleanly exported using the secure Download PDF and Download DOCX features.",
  },
  {
    question: "Can I create a strong CV if I have never held a formal job?",
    answer:
      "Yes. Vitra includes a dedicated No-Experience pathway designed for students, recent graduates, NYSC corps members, SIWES trainees, and first-time job seekers. You can highlight academic projects, volunteering, practical training, and leadership roles clearly.",
  },
  {
    question: "Does Vitra's AI make up experience or fake achievements?",
    answer:
      "No. Vitra is strictly configured never to fabricate employers, qualifications, employment dates, skills, or numerical metrics. AI helps refine the clarity and professional tone of the facts you provide, and asks you if key details are missing.",
  },
  {
    question: "What does ATS-conscious formatting mean?",
    answer:
      "Applicant Tracking Systems (ATS) parse text from your CV into structured candidate profiles. Vitra exports clean, selectable text with clear standard headings and logical reading order so recruiting software and human reviewers can read your CV easily.",
  },
  {
    question: "What happens to an existing CV when I upload it?",
    answer:
      "Your original PDF or DOCX file is stored safely in private storage and is never overwritten. Vitra extracts the text into editable structured sections so you can review, accept, or edit recommendations before generating an improved version.",
  },
  {
    question: "Can I download my CV in both PDF and Word formats?",
    answer:
      "Yes. From the CV editor you can download an up-to-date, multi-page vector PDF with clickable links or an editable Microsoft Word (.docx) file using your selected template.",
  },
  {
    question: "How is my personal information protected?",
    answer:
      "Registration is required so your documents belong strictly to your private account. Uploaded CVs and saved drafts are isolated per user, and you can delete individual files, CVs, or your entire account at any time from Settings.",
  },
];

export function FaqAccordion({ items = FAQ_ITEMS }: { items?: typeof FAQ_ITEMS }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-[#E2DDD2] dark:divide-[#333C52] rounded-xl border border-[#E2DDD2] dark:border-[#333C52] bg-[#FFFEFA] dark:bg-[#1E2333]">
      {items.map((item, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div key={item.question} className="px-5 py-4 sm:px-6">
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : idx)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 text-left font-medium text-[#252821] dark:text-white focus:outline-none cursor-pointer"
            >
              <span className="text-sm sm:text-base">{item.question}</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-[#77786F] dark:text-[#94A3B8] transition-transform duration-200",
                  isOpen && "rotate-180 text-[#173B30] dark:text-[#34D399]"
                )}
              />
            </button>
            {isOpen && (
              <p className="mt-3 text-sm leading-relaxed text-[#77786F] dark:text-[#CBD5E1]">
                {item.answer}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

