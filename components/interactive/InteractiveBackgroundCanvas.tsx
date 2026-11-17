"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Check, Sparkles, X, Sliders, ShieldCheck, Palette, FileText, Volume2 } from "lucide-react";
import { TEMPLATE_METADATA, FONT_METADATA } from "@/lib/cv/defaults";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { cn } from "@/lib/utils";
import type { TemplateId } from "@/types/cv";

interface Ripple {
  id: number;
  x: number;
  y: number;
}

const ATS_CHECKLIST_ITEMS = [
  {
    id: "layout",
    title: "Single-Column Linear Hierarchy",
    desc: "No multi-column tables, sidebars, or floating text boxes that confuse Taleo and Workday.",
    checked: true,
  },
  {
    id: "typography",
    title: "Standard System Typography",
    desc: "Uses universally supported fonts (Calibri, Arial, Times New Roman, Georgia, Garamond).",
    checked: true,
  },
  {
    id: "sections",
    title: "Standard Semantic Section Headings",
    desc: "Exact recognized labels: 'Professional Experience', 'Education', 'Skills', 'Certifications'.",
    checked: true,
  },
  {
    id: "metrics",
    title: "Action-Driven Quantifiable Metrics",
    desc: "Every bullet combines strong action verbs with tangible impact (+35% revenue, ₦15M budget).",
    checked: true,
  },
  {
    id: "encoding",
    title: "Clean Unicode Text Parsing",
    desc: "Zero unparsable glyphs, broken icons, or rasterized images pretending to be text.",
    checked: true,
  },
];

export function InteractiveBackgroundCanvas() {
  const [activeDrawer, setActiveDrawer] = useState<"none" | "checklist" | "templates" | "ambient">("none");
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [checklist, setChecklist] = useState(ATS_CHECKLIST_ITEMS);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>("modern-minimal");
  const [selectedFont, setSelectedFont] = useState<string>("calibri");
  const [ambientMood, setAmbientMood] = useState<"classic" | "golden" | "nordic">("classic");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Background Ripple Handler: creates expanding wave where user clicks or taps
  const handleBackgroundInteraction = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    // Only trigger if interacting directly with the background or margin rails
    const target = e.target as HTMLElement;
    if (target.closest("[data-no-ripple]") || target.closest("a") || target.closest("button") || target.closest("input")) {
      return;
    }

    let clientX = 0;
    let clientY = 0;

    if ("touches" in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ("clientX" in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const newRipple: Ripple = {
      id: Date.now() + Math.random(),
      x: clientX,
      y: clientY,
    };

    setRipples((prev) => [...prev.slice(-4), newRipple]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 1200);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleChecklist = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleTriggerCharacters = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("vitra:trigger-character-speech", {
          detail: { character: "both" },
        })
      );
      showToast("💬 Stylist & Executive are sharing advice!");
    }
  };

  const handleCycleAmbientMood = () => {
    const nextMood = ambientMood === "classic" ? "golden" : ambientMood === "golden" ? "nordic" : "classic";
    setAmbientMood(nextMood);
    const body = document.body;
    if (nextMood === "golden") {
      body.style.setProperty("--vitra-moon-white", "#FFFBF0");
      body.style.setProperty("--vitra-sand", "#EAD8B7");
      showToast("🌓 Ambient Palette: Golden Hour Sand");
    } else if (nextMood === "nordic") {
      body.style.setProperty("--vitra-moon-white", "#F7FAFC");
      body.style.setProperty("--vitra-sand", "#D9E2EC");
      showToast("❄️ Ambient Palette: Nordic Moon Mist");
    } else {
      body.style.removeProperty("--vitra-moon-white");
      body.style.removeProperty("--vitra-sand");
      showToast("🌕 Ambient Palette: Classic Moon White & Sand");
    }
  };

  // Close drawers with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveDrawer("none");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const checkedCount = checklist.filter((item) => item.checked).length;
  const atsScore = Math.round((checkedCount / checklist.length) * 100);

  return (
    <>
      {/* ==============================================================
          1. BACKGROUND INTERACTION CANVAS (RIPPLES & TOUCH LISTENER)
          ============================================================== */}
      <div
        onClick={handleBackgroundInteraction}
        onTouchStart={handleBackgroundInteraction}
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
        aria-hidden="true"
      >
        {ripples.map((ripple) => (
          <div
            key={ripple.id}
            className="absolute rounded-full border-2 border-white/60 pointer-events-none animate-ping"
            style={{
              left: ripple.x - 75,
              top: ripple.y - 75,
              width: 150,
              height: 150,
              mixBlendMode: "difference",
              animationDuration: "1.1s",
              animationTimingFunction: "cubic-bezier(0, 0, 0.2, 1)",
            }}
          />
        ))}
      </div>

      {/* ==============================================================
          2. RIGHT-SIDE FLOATING ACTION BUTTONS (COMPACT & NEAR TOP)
          ============================================================== */}
      <aside
        aria-label="Vitra quick action buttons"
        className="hidden sm:flex fixed right-2.5 sm:right-5 top-20 sm:top-24 z-40 flex-col items-end gap-2 pointer-events-auto select-none"
      >
        {/* 1. Click to Open / ATS Checklist Button */}
        <button
          type="button"
          onClick={() => setActiveDrawer("checklist")}
          title="Click to open Live ATS Compliance Checklist"
          className="group flex items-center gap-1.5 rounded-full border border-black dark:border-[#333C52] bg-white dark:bg-[#1E2333] px-2.5 py-1 sm:px-3 sm:py-1.5 font-tech text-[11px] font-bold text-[#111111] dark:text-white shadow-[2px_2px_0px_#111111] dark:shadow-[2px_2px_0px_#000] hover:bg-[#D1FAE5] dark:hover:bg-[#152B22] hover:translate-x-[-1px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer focus:outline-none"
        >
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#10B981] text-white">
            <ShieldCheck className="h-2.5 w-2.5 stroke-[2.5]" />
          </span>
          <span className="whitespace-nowrap">ATS Checklist</span>
          <span className="rounded-full bg-[#D1FAE5] dark:bg-[#143326] px-1.5 py-0.2 text-[9px] text-[#065F46] dark:text-[#34D399] font-bold border border-[#065F46]/30">
            {atsScore}%
          </span>
        </button>

        {/* 2. Explore Templates & Fonts Button */}
        <button
          type="button"
          onClick={() => setActiveDrawer("templates")}
          title="Explore 9 ATS Templates & 8 Typography Fonts"
          className="group flex items-center gap-1.5 rounded-full border border-black dark:border-[#4D3914] bg-[#FEF08A] dark:bg-[#252210] px-2.5 py-1 sm:px-3 sm:py-1.5 font-tech text-[11px] font-bold text-[#111111] dark:text-amber-200 shadow-[2px_2px_0px_#111111] dark:shadow-[2px_2px_0px_#000] hover:bg-[#FDE047] dark:hover:bg-[#342F16] hover:translate-x-[-1px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer focus:outline-none"
        >
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-black dark:bg-amber-400 text-[#FEF08A] dark:text-black">
            <Palette className="h-2.5 w-2.5 stroke-[2.5]" />
          </span>
          <span className="whitespace-nowrap">Explore Templates</span>
          <span className="rounded-full bg-white dark:bg-[#242A3D] px-1.5 py-0.2 text-[9px] text-black dark:text-white font-bold border border-black/20 dark:border-white/20">
            9
          </span>
        </button>
      </aside>


      {/* ==============================================================
          5. TOAST NOTIFICATION
          ============================================================== */}
      {toastMessage && (
        <aside
          aria-live="polite"
          className="fixed top-16 left-1/2 -translate-x-1/2 z-50 rounded-full border-2 border-black bg-white px-4 py-2 font-tech text-xs font-bold text-black shadow-[3px_3px_0px_#111] animate-in fade-in slide-in-from-top-3 duration-200"
        >
          {toastMessage}
        </aside>
      )}

      {/* ==============================================================
          6. INTERACTIVE ATS COMPLIANCE CHECKLIST DRAWER / MODAL
          ============================================================== */}
      {activeDrawer === "checklist" && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ats-checklist-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            data-no-ripple
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border-2 border-black dark:border-[#333C52] bg-[#FFFEFA] dark:bg-[#1E2333] shadow-[8px_8px_0px_#111111] dark:shadow-[8px_8px_0px_rgba(0,0,0,0.8)] max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="bg-[#173B30] p-4 sm:p-5 text-white flex items-center justify-between border-b-2 border-black dark:border-[#333C52]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 border border-white/20">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h3 id="ats-checklist-title" className="font-tech text-base sm:text-lg font-bold text-white leading-tight">
                    ATS Compliance Checklist
                  </h3>
                  <p className="font-tech text-xs text-white/70">
                    5 Critical Standards for Nigerian &amp; Global Job Applications
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveDrawer("none")}
                className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors focus:outline-none"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Score Bar */}
            <div className="bg-[#D1FAE5] dark:bg-[#0A261B] px-4 py-3 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-600 animate-ping" />
                <span className="font-tech text-xs font-bold text-[#065F46] dark:text-[#34D399]">
                  Live Readiness Score: {atsScore}%
                </span>
              </div>
              <span className="font-tech text-[11px] font-bold text-[#065F46] dark:text-[#34D399]">
                {checkedCount} / {checklist.length} Passed
              </span>
            </div>

            {/* Checklist Items */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1 font-tech">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleToggleChecklist(item.id)}
                  className={cn(
                    "rounded-xl border-2 p-3 sm:p-3.5 transition-all cursor-pointer flex items-start gap-3 select-none",
                    item.checked
                      ? "border-emerald-600/60 dark:border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                      : "border-black/20 dark:border-white/10 bg-white dark:bg-[#242A3D] hover:bg-gray-50 dark:hover:bg-[#283046] opacity-60"
                  )}
                >
                  <div
                    className={cn(
                      "h-5 w-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                      item.checked
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-gray-400 bg-white dark:bg-[#1A1F2C]"
                    )}
                  >
                    {item.checked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#111111] dark:text-white">
                      {item.title}
                    </h4>
                    <p className="mt-0.5 text-xs text-[#55564E] dark:text-[#CBD5E1] leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="bg-[#FAF8F5] dark:bg-[#242A3D] p-4 border-t-2 border-black dark:border-[#333C52] flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="font-tech text-xs text-[#77786F] dark:text-[#94A3B8] text-center sm:text-left">
                Every template in Vitra strictly satisfies 100% of these rules.
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Link
                  href="/create"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border-2 border-black dark:border-[#333C52] bg-[#111111] dark:bg-[#1A202C] px-5 py-2.5 font-tech text-xs font-bold text-white shadow-[2px_2px_0px_#111] dark:shadow-[2px_2px_0px_#000] hover:bg-[#10B981] hover:text-white transition-colors"
                >
                  <span>BUILD 100% ATS CV</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          7. INTERACTIVE TEMPLATES & FONTS EXPLORER DRAWER / MODAL
          ============================================================== */}
      {activeDrawer === "templates" && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="templates-explorer-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            data-no-ripple
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl border-2 border-black dark:border-[#333C52] bg-[#FFFEFA] dark:bg-[#1E2333] shadow-[8px_8px_0px_#111111] dark:shadow-[8px_8px_0px_rgba(0,0,0,0.8)] max-h-[92vh] flex flex-col"
          >
            {/* Header */}
            <div className="bg-[#173B30] p-4 sm:p-5 text-white flex items-center justify-between border-b-2 border-black dark:border-[#333C52]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 border border-white/20">
                  <Palette className="h-5 w-5 text-amber-300" />
                </div>
                <div>
                  <h3 id="templates-explorer-title" className="font-tech text-base sm:text-lg font-bold text-white leading-tight">
                    9 ATS Templates &amp; 8 Typography Fonts
                  </h3>
                  <p className="font-tech text-xs text-white/70">
                    Switch layout and fonts to preview live ATS styling
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveDrawer("none")}
                className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors focus:outline-none"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 font-tech">
              {/* Template Picker */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#77786F] dark:text-[#94A3B8] mb-2.5">
                  1. Select from 9 ATS-Compliant Layouts
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TEMPLATE_METADATA.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => setSelectedTemplate(tmpl.id)}
                      className={cn(
                        "rounded-xl border-2 p-2.5 text-left transition-all cursor-pointer relative",
                        selectedTemplate === tmpl.id
                          ? "border-black dark:border-[#F8D849] bg-[#FEF08A] dark:bg-[#252210] shadow-[2px_2px_0px_#111] dark:shadow-[2px_2px_0px_#000]"
                          : "border-black/15 dark:border-white/15 bg-white dark:bg-[#242A3D] hover:border-black/40 dark:hover:border-white/40 hover:bg-gray-50 dark:hover:bg-[#283046]"
                      )}
                    >
                      <p className="font-bold text-xs text-[#111111] dark:text-white truncate">{tmpl.name}</p>
                      <p className="text-[10px] text-[#55564E] dark:text-[#CBD5E1] truncate mt-0.5">{tmpl.tagline}</p>
                      {selectedTemplate === tmpl.id && (
                        <div className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Picker */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#77786F] dark:text-[#94A3B8] mb-2.5">
                  2. Select ATS Typography Font (8 Options)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {FONT_METADATA.map((font) => (
                    <button
                      key={font.id}
                      type="button"
                      onClick={() => setSelectedFont(font.id)}
                      className={cn(
                        "rounded-xl border-2 p-2.5 text-left transition-all cursor-pointer relative",
                        selectedFont === font.id
                          ? "border-black dark:border-emerald-500 bg-[#D1FAE5] dark:bg-[#0E291F] shadow-[2px_2px_0px_#111] dark:shadow-[2px_2px_0px_#000]"
                          : "border-black/15 dark:border-white/15 bg-white dark:bg-[#242A3D] hover:border-black/40 dark:hover:border-white/40 hover:bg-gray-50 dark:hover:bg-[#283046]"
                      )}
                    >
                      <p
                        className="font-bold text-sm text-[#111111] dark:text-white truncate"
                        style={{ fontFamily: font.cssFont }}
                      >
                        {font.name}
                      </p>
                      <p className="text-[10px] text-[#065F46] dark:text-[#34D399] font-semibold mt-0.5">
                        {font.category} · {font.atsScore.split(" ")[0]}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Typography Preview Snippet */}
              <div className="rounded-xl border-2 border-black/20 dark:border-[#333C52] bg-white dark:bg-[#242A3D] p-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-2 mb-3">
                  <span className="text-[11px] font-bold text-[#77786F] dark:text-[#94A3B8] uppercase tracking-wider">
                    Live Sample: {selectedTemplate.toUpperCase()} in{" "}
                    {FONT_METADATA.find((f) => f.id === selectedFont)?.name}
                  </span>
                  <span className="rounded bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5">
                    100% ATS PARSED
                  </span>
                </div>
                <div
                  className="space-y-2 text-[#111111] dark:text-white"
                  style={{
                    fontFamily:
                      FONT_METADATA.find((f) => f.id === selectedFont)?.cssFont || "Calibri, sans-serif",
                  }}
                >
                  <p className="text-base font-bold tracking-tight">
                    ADAEZE CHIDINMA OKAFOR
                  </p>
                  <p className="text-xs text-[#55564E] dark:text-[#CBD5E1]">
                    Lagos, Nigeria · +234 803 000 0142 · adaeze.okafor@example.com · linkedin.com/in/adaeze-okafor
                  </p>
                  <div className="pt-1">
                    <p className="text-xs font-bold uppercase tracking-wider border-b border-black/20 dark:border-white/20 pb-0.5">
                      Professional Experience
                    </p>
                    <p className="text-xs font-bold mt-1.5">
                      Operations Coordinator — SwiftPay Technologies (2022 – Present)
                    </p>
                    <ul className="text-xs list-disc list-inside space-y-1 text-[#222] dark:text-[#CBD5E1] mt-1">
                      <li>Streamlined transaction reconciliation, cutting settlement error rate from 4.8% to 0.6%.</li>
                      <li>Maintained 100% adherence to central compliance standards across 14,000+ monthly transfers.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-[#FAF8F5] dark:bg-[#242A3D] p-4 border-t-2 border-black dark:border-[#333C52] flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="font-tech text-xs text-[#77786F] dark:text-[#94A3B8]">
                Selected: <strong className="text-black dark:text-white">{selectedTemplate}</strong> with{" "}
                <strong className="text-black dark:text-white">{selectedFont}</strong> font.
              </span>
              <Link
                href={`/create?template=${encodeURIComponent(selectedTemplate)}&font=${encodeURIComponent(selectedFont)}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border-2 border-black dark:border-[#333C52] bg-[#111111] dark:bg-[#1A202C] px-5 py-2.5 font-tech text-xs font-bold text-white shadow-[2px_2px_0px_#111] dark:shadow-[2px_2px_0px_#000] hover:bg-[#F8D849] hover:text-black transition-colors"
              >
                <span>USE THIS TEMPLATE &amp; FONT</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

