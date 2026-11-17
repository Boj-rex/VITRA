"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Sparkles } from "lucide-react";
import { CvDocumentPreview } from "@/components/templates/CvDocumentPreview";
import {
  SAMPLE_SHOWCASE_CV,
  TEMPLATE_METADATA,
  createDefaultEditorSettings,
} from "@/lib/cv/defaults";
import type { TemplateId } from "@/types/cv";
import { WashiTape } from "@/components/scrapbook/WashiTape";
import { cn } from "@/lib/utils";

function TemplatesGalleryInner() {
  const searchParams = useSearchParams();
  const initialParam = searchParams.get("preview") as TemplateId | null;
  const validInitial = TEMPLATE_METADATA.some((t) => t.id === initialParam)
    ? (initialParam as TemplateId)
    : "classic-professional";

  const [selectedId, setSelectedId] = useState<TemplateId>(validInitial);
  const selectedMeta =
    TEMPLATE_METADATA.find((t) => t.id === selectedId) || TEMPLATE_METADATA[0];

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* Header */}
      <section className="text-center space-y-4 pt-2">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1 rounded-full border-2 border-[#111111] dark:border-[#333C52] bg-[#D1FAE5] dark:bg-[#0E2E23] px-3.5 py-1 text-xs font-bold text-[#065F46] dark:text-[#34D399] font-tech shadow-sticker-sm">
            <span>●</span>
            <span>4 PROVEN LAYOUTS</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border-2 border-[#111111] dark:border-[#333C52] bg-[#FEF3C7] dark:bg-[#252210] px-3.5 py-1 text-xs font-bold text-[#92400E] dark:text-[#FBBF24] font-tech shadow-sticker-sm">
            <span>✦</span>
            <span>100% ATS PARSED</span>
          </span>
        </div>

        <div className="pt-2">
          <p className="font-handwriting text-2xl sm:text-3xl text-[#55564E] dark:text-[#CBD5E1] font-semibold -rotate-2">
            clean typography &amp; zero fluff
          </p>
        </div>

        <div className="relative inline-block mx-auto max-w-full">
          <h1 className="font-tech text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#111111] dark:text-white uppercase">
            TEMPLATE GALLERY
          </h1>
        </div>

        <p className="font-tech text-base sm:text-lg text-[#55564E] dark:text-[#CBD5E1] max-w-xl mx-auto">
          Every template preserves your structured content when switching layouts, with Calibri and
          Times New Roman TrueType font embedding.
        </p>
      </section>

      {/* Main Interactive Gallery Grid */}
      <section className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Left Column: Template Selection Cards */}
        <div className="space-y-4 lg:col-span-4">
          <div className="space-y-3">
            {TEMPLATE_METADATA.map((tpl, idx) => {
              const active = tpl.id === selectedId;
              const tapeColor = idx === 0 ? "yellow" : idx === 1 ? "blue" : idx === 2 ? "mint" : "pink";

              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setSelectedId(tpl.id)}
                  className={cn(
                    "w-full rounded-2xl border-2 border-black dark:border-[#333C52] p-4 text-left transition-all duration-150 cursor-pointer relative select-none",
                    "hover:-translate-y-0.5 active:translate-x-[1.5px] active:translate-y-[1.5px] active:scale-[0.98]",
                    active
                      ? "bg-white dark:bg-[#242A3D] shadow-[4px_4px_0px_#111111] dark:shadow-[4px_4px_0px_rgba(0,0,0,0.8)] -translate-y-0.5"
                      : "bg-[#FFFEFA]/80 dark:bg-[#1E2333]/80 hover:bg-white dark:hover:bg-[#242A3D] shadow-[2px_2px_0px_#111111] dark:shadow-[2px_2px_0px_rgba(0,0,0,0.8)]"
                  )}
                >
                  {active && (
                    <WashiTape
                      color={tapeColor}
                      angle="left"
                      className="-top-2.5 right-4 z-20"
                    />
                  )}

                  <div className="flex items-center justify-between">
                    <span className="font-tech text-base font-bold text-[#111111] dark:text-white">
                      {tpl.name}
                    </span>
                    {active ? (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#10B981] text-white text-xs font-bold">
                        ✓
                      </span>
                    ) : (
                      <span className="text-xs font-tech text-[#77786F] dark:text-[#94A3B8]">● PREVIEW</span>
                    )}
                  </div>
                  <p className="mt-1 text-xs font-bold text-[#1845E8] dark:text-[#60A5FA] font-tech">{tpl.tagline}</p>
                  <p className="mt-1.5 text-xs text-[#55564E] dark:text-[#CBD5E1] leading-relaxed">
                    {tpl.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Template Details Card */}
          <div className="relative rounded-2xl border-2 border-black dark:border-[#333C52] bg-[#FEF9C3] dark:bg-[#252110] p-5 shadow-sticker space-y-3">
            <WashiTape color="yellow" angle="right" className="-top-3 left-4" />
            <span className="font-tech text-xs font-bold text-[#854D0E] dark:text-[#FBBF24] uppercase tracking-wider">
              Selected Layout Details
            </span>
            <p className="text-xs text-[#111111] dark:text-white leading-relaxed">
              <span className="font-bold">Target audience:</span> {selectedMeta.bestFor}
            </p>
            <p className="text-xs text-[#55564E] dark:text-[#CBD5E1] leading-relaxed">{selectedMeta.atsNote}</p>

            <div className="pt-3 border-t border-black/10 dark:border-white/10">
              <Link
                href="/create"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-black dark:border-[#333C52] bg-[#111111] dark:bg-[#1A202C] py-3.5 text-xs font-tech font-bold text-white shadow-[3px_3px_0px_#1B3AFF] hover:-translate-y-0.5 hover:shadow-[4.5px_4.5px_0px_#1B3AFF] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none active:scale-[0.98] transition-all cursor-pointer select-none"
              >
                <span>USE THIS TEMPLATE — FROM ₦6,000</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Live Document Preview Canvas */}
        <div className="lg:col-span-8">
          <div className="relative rounded-2xl border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#1E2333] p-4 sm:p-8 shadow-sticker overflow-hidden">
            <WashiTape color="blue" angle="steep-left" className="-top-2 left-6 z-20" />
            <WashiTape color="mint" angle="steep-right" className="-top-2 right-6 z-20" />

            <div className="mb-4 flex items-center justify-between border-b-2 border-black/10 dark:border-white/10 pb-3 font-tech text-xs">
              <span className="font-bold text-[#111111] dark:text-white">
                ● LIVE DOCUMENT PREVIEW: {selectedMeta.name.toUpperCase()}
              </span>
              <span className="text-[#065F46] dark:text-[#34D399] font-bold">CALIBRI &amp; TIMES NEW ROMAN EMBEDDED</span>
            </div>

            <div className="max-h-[800px] overflow-y-auto rounded-xl border border-black/10 dark:border-white/10 bg-[#F3F4F6] dark:bg-[#242A3D] p-2 sm:p-4">
              <CvDocumentPreview
                cv={SAMPLE_SHOWCASE_CV}
                templateId={selectedId}
                settings={createDefaultEditorSettings(
                  selectedId === "graduate-entry"
                    ? "recent-graduate"
                    : "experienced-professional"
                )}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function TemplatesPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-20 font-tech font-bold text-sm text-[#111111]">
          Loading templates...
        </div>
      }
    >
      <TemplatesGalleryInner />
    </Suspense>
  );
}
