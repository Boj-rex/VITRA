"use client";

import React, { useEffect, useState } from "react";
import { LifeBuoy } from "lucide-react";
import { SupportModal } from "@/components/support/SupportModal";

export function openSupportModal(category?: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("vitra:open-support", {
        detail: { category },
      })
    );
  }
}

export function FloatingSupportWidget() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);

  useEffect(() => {
    setMounted(true);

    const handleCustomOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{ category?: string }>;
      if (customEvent.detail?.category) {
        setActiveCategory(customEvent.detail.category);
      }
      setIsOpen(true);
    };

    window.addEventListener("vitra:open-support", handleCustomOpen);
    return () => window.removeEventListener("vitra:open-support", handleCustomOpen);
  }, []);

  if (!mounted) return null;

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-24 right-3 sm:bottom-5 sm:right-5 z-40 print:hidden select-none">
        <button
          type="button"
          onClick={() => {
            setActiveCategory(undefined);
            setIsOpen(true);
          }}
          className="group flex items-center gap-2 rounded-full border-2 border-black dark:border-[#333C52] bg-[#F8D849] dark:bg-[#252210] px-3.5 py-2 text-xs font-tech font-bold text-[#111111] dark:text-[#FEF08A] shadow-[3px_3px_0px_#111111] dark:shadow-[3px_3px_0px_#000000] hover:bg-[#FACC15] dark:hover:bg-[#383216] hover:-translate-y-1 hover:shadow-[4.5px_4.5px_0px_#111111] dark:hover:shadow-[4.5px_4.5px_0px_#F59E0B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-150 cursor-pointer"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-label="Open support inquiry form"
        >
          <div className="relative flex items-center justify-center">
            <LifeBuoy className="h-4 w-4 transition-transform group-hover:rotate-45 duration-300" />
            <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-[#10B981] animate-ping" />
            <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-[#10B981]" />
          </div>
          <span className="hidden sm:inline">Support</span>
        </button>
      </div>

      {/* Support Popup Modal */}
      <SupportModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        defaultCategory={activeCategory}
      />
    </>
  );
}
