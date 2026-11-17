"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ShieldCheck, Sparkles } from "lucide-react";
import { PRICING_PLANS, type PricingPlan } from "@/types/pricing";
import { WashiTape } from "@/components/scrapbook/WashiTape";
import { cn } from "@/lib/utils";

export default function PricingPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    email: string;
    planId: string | null;
    maxCvs: number;
    usedCvs: number;
  } | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/billing")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.ok && data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => { });
  }, []);

  function handleSelectPlan(plan: PricingPlan) {
    // Direct candidate to the official receipt & checkout page for the chosen plan
    router.push(`/pricing/receipt?plan=${plan.id}`);
  }

  const isExhausted = Boolean(
    currentUser && currentUser.maxCvs > 0 && currentUser.usedCvs >= currentUser.maxCvs
  );

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* Header */}
      <section className="text-center space-y-4 pt-2">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1 rounded-full border-2 border-[#111111] dark:border-[#333C52] bg-[#FEF3C7] dark:bg-[#252210] px-3.5 py-1 text-xs font-bold text-[#92400E] dark:text-[#FBBF24] font-tech shadow-sticker-sm">
            <span>●</span>
            <span>CLEAR PRICING TIERS</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border-2 border-[#111111] dark:border-[#333C52] bg-[#D1FAE5] dark:bg-[#0E2E23] px-3.5 py-1 text-xs font-bold text-[#065F46] dark:text-[#34D399] font-tech shadow-sticker-sm">
            <span>✦</span>
            <span>NAIRA &amp; CARDS</span>
          </span>
        </div>

        <div className="pt-2">
          <p className="font-handwriting text-2xl sm:text-3xl text-[#55564E] dark:text-[#CBD5E1] font-semibold -rotate-2">
            invest in your career
          </p>
        </div>

        <div className="relative inline-block mx-auto max-w-full">
          <h1 className="font-tech text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#111111] dark:text-white uppercase">
            PACKAGES &amp; PLANS
          </h1>
        </div>

        <p className="font-tech text-base sm:text-lg text-[#55564E] dark:text-[#CBD5E1] max-w-xl mx-auto">
          2 CVs for ₦6,000 · up to 6 CVs for ₦15,000 · up to 13 CVs for ₦20,000.
        </p>

        {currentUser && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-xl border-2 border-[#111111] dark:border-[#333C52] bg-white dark:bg-[#242A3D] px-4 py-2 text-xs font-tech font-bold text-[#111111] dark:text-white shadow-sticker-sm">
            <span
              className={`h-2 w-2 rounded-full ${isExhausted ? "bg-amber-500 animate-pulse" : "bg-[#10B981]"}`}
            />
            <span className="uppercase text-[#173B30] dark:text-[#34D399]">
              {isExhausted ? "Package Access Exhausted:" : "Your Active Plan:"}
            </span>
            {currentUser.planId ? (
              isExhausted ? (
                <span className="text-[#B45309] dark:text-[#FBBF24]">
                  {currentUser.planId.toUpperCase()} EXHAUSTED ({currentUser.usedCvs} of{" "}
                  {currentUser.maxCvs} CVs used). Pay another premium below to unlock more CV generations.
                </span>
              ) : (
                <span className="capitalize text-[#111111] dark:text-white">
                  {currentUser.planId} ({currentUser.usedCvs} of {currentUser.maxCvs} CVs generated —{" "}
                  {currentUser.maxCvs - currentUser.usedCvs} remaining)
                </span>
              )
            ) : (
              <span className="text-[#B45309] dark:text-[#FBBF24]">
                No active plan yet. Choose an option below.
              </span>
            )}
          </div>
        )}
      </section>

      {/* Pricing Cards Grid */}
      <section className="grid gap-8 lg:grid-cols-3 items-stretch">
        {PRICING_PLANS.map((plan, idx) => {
          const isCurrent = currentUser?.planId === plan.id;
          const isButtonDisabled = loadingPlan === plan.id || (isCurrent && !isExhausted);
          const washiColor = idx === 0 ? "yellow" : idx === 1 ? "mint" : "blue";

          return (
            <div
              key={plan.id}
              className={cn(
                "relative rounded-2xl border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#1E2333] p-6 sm:p-8 flex flex-col justify-between transition-transform duration-200",
                plan.popular
                  ? "shadow-[6px_6px_0px_#173B30] dark:shadow-[6px_6px_0px_rgba(0,0,0,0.8)] -translate-y-1.5"
                  : "shadow-[4px_4px_0px_#111111] dark:shadow-[4px_4px_0px_rgba(0,0,0,0.8)]"
              )}
            >
              {/* Washi Tape Corner (Placed on top-left for cards 0 & 1, top-right for card 2 to avoid any overlap with badges) */}
              <WashiTape
                color={washiColor}
                angle={idx === 2 ? "steep-right" : "steep-left"}
                className={idx === 2 ? "-top-3 right-6" : "-top-3 left-6"}
              />

              {plan.popular && (
                <div className="absolute -top-3.5 right-4 sm:right-6 z-30 rounded-full border-2 border-black dark:border-[#333C52] bg-[#10B981] px-3 py-0.5 text-[10px] sm:text-xs font-bold tracking-wider text-white uppercase font-tech shadow-sticker-sm pointer-events-none select-none">
                  ★ MOST POPULAR
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <span className="inline-block rounded-md border border-black/20 dark:border-white/20 bg-[#F3F4F6] dark:bg-[#242A3D] px-2.5 py-0.5 font-tech text-xs font-bold text-[#111111] dark:text-white">
                    {plan.badge}
                  </span>
                  <h3 className="mt-2 font-tech text-2xl font-bold text-[#111111] dark:text-white">{plan.name}</h3>
                  <p className="mt-1 text-xs text-[#55564E] dark:text-[#CBD5E1] font-medium min-h-[32px] leading-relaxed">
                    {plan.tagline}
                  </p>
                </div>

                <div className="border-t-2 border-b-2 border-black/10 dark:border-white/10 py-4 my-2">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-tech text-3xl sm:text-4xl font-bold text-[#111111] dark:text-white">
                      {plan.formattedPrice}
                    </span>
                    <span className="font-tech text-xs text-[#77786F] dark:text-[#94A3B8]">one-time</span>
                  </div>
                  <p className="mt-1 text-xs font-bold text-[#065F46] dark:text-[#34D399] font-tech">
                    ● Up to {plan.maxCvs} distinct CVs included
                  </p>
                </div>

                <ul className="space-y-2.5 text-xs text-[#252821] dark:text-[#E2E8F0] font-medium">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2">
                      <Check className="h-4 w-4 shrink-0 text-[#10B981] stroke-[2.5]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <button
                  type="button"
                  disabled={isButtonDisabled}
                  onClick={() => handleSelectPlan(plan)}
                  className={cn(
                    "w-full rounded-xl border-2 border-black dark:border-[#333C52] py-3 px-4 font-tech text-xs sm:text-sm font-bold tracking-wider uppercase transition-all duration-150 cursor-pointer shadow-[3px_3px_0px_#111111] dark:shadow-[3px_3px_0px_#000] hover:-translate-y-0.5 hover:shadow-[4.5px_4.5px_0px_#111111] dark:hover:shadow-[4.5px_4.5px_0px_#F59E0B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none active:scale-[0.98] select-none",
                    isCurrent && !isExhausted
                      ? "bg-[#D1FAE5] dark:bg-[#0E2E23] text-[#065F46] dark:text-[#34D399] cursor-default border-[#065F46] shadow-none transform-none"
                      : isCurrent && isExhausted
                        ? "bg-[#F8D849] dark:bg-[#2E220D] text-[#111111] dark:text-amber-200 border-black dark:border-[#F59E0B] hover:bg-[#FACC15]"
                        : plan.popular
                          ? "bg-[#173B30] dark:bg-[#0E2E23] text-white hover:bg-[#244B3E]"
                          : "bg-[#F8D849] dark:bg-[#2E220D] text-[#111111] dark:text-amber-200 hover:bg-[#FACC15]"
                  )}
                >
                  {isCurrent && !isExhausted
                    ? "✓ Active Plan"
                    : isCurrent && isExhausted
                      ? "Renew Plan"
                      : "Select Plan"}
                </button>
              </div>
            </div>
          );
        })}
      </section>

      {/* Explanatory Policy & Limits Box */}
      <section className="rounded-2xl border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#1E2333] p-6 sm:p-8 shadow-sticker space-y-4 relative">
        <WashiTape color="mint" angle="left" className="-top-3 left-8" />

        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-[#173B30] dark:text-[#34D399]" />
          <h2 className="font-tech text-xl font-bold text-[#111111] dark:text-white">
            Clear Policy on CV Allowances &amp; Security
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 text-xs text-[#55564E] dark:text-[#CBD5E1] leading-relaxed">
          <div className="rounded-xl bg-[#FEF9C3] dark:bg-[#252110] p-4 border-2 border-black/10 dark:border-white/10">
            <p className="font-tech font-bold text-[#854D0E] dark:text-[#FBBF24] text-sm">2 CVs: ₦6,000</p>
            <p className="mt-1">
              Full access to create, edit, tailor, and download up to 2 distinct CVs. Perfect for
              creating a standard CV and an alternative targeted version.
            </p>
          </div>
          <div className="rounded-xl bg-[#D1FAE5] dark:bg-[#0E2E23] p-4 border-2 border-black/10 dark:border-white/10">
            <p className="font-tech font-bold text-[#065F46] dark:text-[#34D399] text-sm">3 to 6 CVs: ₦15,000</p>
            <p className="mt-1">
              For anything above 2 CVs up to a maximum of 6 CVs. Ideal for job seekers exploring
              multiple industries or applying across diverse job profiles.
            </p>
          </div>
          <div className="rounded-xl bg-[#E0F2FE] dark:bg-[#0F2942] p-4 border-2 border-black/10 dark:border-white/10">
            <p className="font-tech font-bold text-[#0369A1] dark:text-[#60A5FA] text-sm">7 to 13 CVs: ₦20,000</p>
            <p className="mt-1">
              For anything above 6 CVs up to the absolute cap of 13 CVs. Maximum capacity for
              seasoned leaders, consultants, and multi-track candidates.
            </p>
          </div>
        </div>

        <p className="text-xs text-[#77786F] dark:text-[#94A3B8] pt-2 border-t border-black/10 dark:border-white/10">
          <span className="font-bold text-[#111111] dark:text-white">Notice:</span> Built-in screen capture and
          screenshot protection is active across Vitra to protect document privacy. Verified
          downloads are delivered directly as pristine, high-resolution PDF and Microsoft Word
          (.docx) documents.
        </p>
      </section>
    </div>
  );
}
