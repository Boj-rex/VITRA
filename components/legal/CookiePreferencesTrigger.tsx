"use client";

import React from "react";
import { Cookie } from "lucide-react";
import { openCookiePreferences } from "@/components/legal/CookieConsentBanner";

export function CookiePreferencesTrigger({
  className = "",
  label = "Manage Cookie Preferences",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={openCookiePreferences}
      className={
        className ||
        "inline-flex items-center gap-2 rounded-xl border-2 border-black dark:border-[#333C52] bg-[#F8D849] dark:bg-[#252210] px-4 py-2 font-tech text-xs font-bold text-[#111111] dark:text-[#FEF08A] shadow-[2px_2px_0px_#111111] dark:shadow-[2px_2px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
      }
    >
      <Cookie className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}

