import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { VitraLogo } from "@/components/layout/VitraLogo";
import { VitraFooterLogo } from "@/components/layout/VitraFooterLogo";
import { WashiTape } from "@/components/scrapbook/WashiTape";
import { InteractiveFloatingCharacter } from "@/components/characters/InteractiveFloatingCharacter";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-drafting-grid min-h-screen py-8 px-4 flex flex-col justify-between items-center relative">
      {/* Interactive Characters on either side */}
      <InteractiveFloatingCharacter side="left" character="man" />
      <InteractiveFloatingCharacter side="right" character="woman" />

      {/* Top Brand Stamp */}
      <div className="w-full max-w-md text-center pt-2 pb-4 flex flex-col items-center">
        <VitraLogo href="/" size="lg" />
        <p className="font-handwriting text-xl text-[#55564E] dark:text-[#CBD5E1] mt-2 -rotate-1">
          candidate studio &amp; account access
        </p>
      </div>

      {/* Central Ruled Paper Auth Box */}
      <div className="w-full max-w-md relative z-20">
        <div className="relative rounded-2xl sm:rounded-3xl border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#1E2333] p-6 sm:p-8 shadow-paper text-[#111111] dark:text-white">
          <WashiTape color="blue" angle="steep-left" className="-top-3 left-6 z-30" />
          <WashiTape color="yellow" angle="steep-right" className="-top-3 right-6 z-30" />

          {children}
        </div>
      </div>

      {/* Footer Note */}
      <footer className="w-full max-w-md text-center pt-8 pb-4 text-xs font-tech text-[#77786F] dark:text-[#94A3B8] flex flex-col items-center gap-2">
        <VitraFooterLogo href="/" size="sm" />
        <p>
          Vitra · Paid professional CV studio for Nigerian &amp; global job seekers.
        </p>
      </footer>
    </div>
  );
}
