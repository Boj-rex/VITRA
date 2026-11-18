"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { FAQ_ITEMS, type FaqItem } from "@/lib/data/faq";

export { FAQ_ITEMS, type FaqItem };

export function FaqAccordion({ items = FAQ_ITEMS }: { items?: typeof FAQ_ITEMS }) {
  // Allow multiple items to be toggled independently for ultra-smooth reading
  const [openIndices, setOpenIndices] = useState<Set<number>>(() => new Set([0]));

  const toggleIndex = (idx: number) => {
    setOpenIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  return (
    <div className="divide-y divide-[#E2DDD2] dark:divide-[#333C52] rounded-xl border border-[#E2DDD2] dark:border-[#333C52] bg-[#FFFEFA] dark:bg-[#1E2333] overflow-hidden shadow-sm">
      {items.map((item, idx) => {
        const isOpen = openIndices.has(idx);
        return (
          <div key={item.question} className="group transition-colors duration-150">
            <button
              type="button"
              onClick={() => toggleIndex(idx)}
              aria-expanded={isOpen}
              className={cn(
                "flex w-full items-center justify-between gap-4 px-5 py-4.5 sm:px-6 sm:py-5 text-left font-medium text-[#252821] dark:text-white transition-all select-none cursor-pointer touch-manipulation focus:outline-none focus-visible:bg-black/5 dark:focus-visible:bg-white/5",
                "hover:bg-[#F9F7F1]/80 dark:hover:bg-[#252B3E]/80 active:bg-[#F2EFE8] dark:active:bg-[#2D344B]",
                isOpen && "bg-[#F9F7F1]/50 dark:bg-[#252B3E]/50"
              )}
            >
              <span className="text-sm sm:text-base font-bold font-tech pr-2 leading-snug text-[#111111] dark:text-[#F1F5F9]">
                {item.question}
              </span>

              {/* Responsive 32-36px circular target for the arrow/chevron */}
              <div
                className={cn(
                  "relative flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full border border-black/10 dark:border-white/10 transition-all duration-200",
                  "group-hover:border-black/30 dark:group-hover:border-white/30 group-active:scale-95",
                  isOpen
                    ? "bg-[#111111] text-white border-black dark:bg-[#34D399] dark:text-[#062419] dark:border-[#34D399] shadow-sm"
                    : "bg-white/80 dark:bg-[#151923] text-[#55564E] dark:text-[#94A3B8] group-hover:bg-white dark:group-hover:bg-[#1E2536]"
                )}
              >
                <ChevronDown
                  className={cn(
                    "h-4 w-4 sm:h-4.5 sm:w-4.5 transition-transform duration-300 ease-out",
                    isOpen ? "rotate-180" : "rotate-0"
                  )}
                  aria-hidden="true"
                />
              </div>
            </button>

            {/* Smooth height transition using CSS Grid 0fr -> 1fr */}
            <div
              className={cn(
                "grid transition-all duration-300 ease-in-out",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <div className="px-5 pb-5 pt-1 sm:px-6 sm:pb-6 text-sm leading-relaxed text-[#55564E] dark:text-[#CBD5E1] font-tech border-t border-black/5 dark:border-white/5">
                  <p>{item.answer}</p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

