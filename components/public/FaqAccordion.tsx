"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { FAQ_ITEMS, type FaqItem } from "@/lib/data/faq";

export { FAQ_ITEMS, type FaqItem };

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

