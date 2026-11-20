"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Plus,
  Sparkles,
  Target,
  Trash2,
  AlertCircle,
  Cpu,
  FolderKanban,
  SlidersHorizontal,
} from "lucide-react";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FieldLabel, Input, Select, Textarea } from "@/components/ui/input";
import { CommaSeparatedInput } from "@/components/ui/comma-separated-input";
import { CvDocumentPreview } from "@/components/templates/CvDocumentPreview";
import { SubscriptionRequiredModal } from "@/components/billing/SubscriptionRequiredModal";
import {
  NIGERIAN_AND_INTL_QUALIFICATIONS,
  NO_EXPERIENCE_CATEGORIES,
  TEMPLATE_METADATA,
  FONT_METADATA,
} from "@/lib/cv/defaults";
import {
  compareCvWithJobDescription,
  evaluateCvQuality,
  type AtsQualityCheckItem,
} from "@/lib/cv/ats-checker";
import { cn, createId } from "@/lib/utils";
import type {
  CvEditorSettings,
  CvRecord,
  JobTailoringResult,
  SectionKey,
  StructuredCvContent,
  TemplateId,
} from "@/types/cv";

type LeftTab = "content" | "layout" | "quality" | "tailor";

const SECTION_LABELS: Record<SectionKey, string> = {
  summary: "Professional Summary",
  experience: "Work / Alternative Experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  certifications: "Certifications",
  additional: "Additional Information",
};

export function CvEditorWorkspace({
  initialCv,
  hasActiveSubscription = false,
}: {
  initialCv: CvRecord;
  hasActiveSubscription?: boolean;
}) {
  const router = useRouter();
  const [cv, setCv] = useState<CvRecord>(initialCv);
  const [leftTab, setLeftTab] = useState<LeftTab>("content");
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("saved");
  const [exporting, setExporting] = useState<"pdf" | "docx" | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [requestedExportFormat, setRequestedExportFormat] = useState<"pdf" | "docx">("pdf");
  const [aiBusy, setAiBusy] = useState<string | null>(null);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  // Job tailoring state
  const [jobTitle, setJobTitle] = useState("");
  const [jobCompany, setJobCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [tailorResult, setTailorResult] = useState<JobTailoringResult | null>(null);
  const [deterministicMatch, setDeterministicMatch] = useState<{
    extractedKeywords: string[];
    matchedKeywords: string[];
    missingOrUnconfirmedKeywords: string[];
  } | null>(null);

  // ATS Engine policy state
  const [atsEngineChoice, setAtsEngineChoice] = useState<"hardcoded" | "ai">("hardcoded");
  const [systemAtsMode, setSystemAtsMode] = useState<"user_choice" | "deterministic_only" | "ai_only">("user_choice");

  useEffect(() => {
    fetch("/api/settings/ats-mode")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && d.atsEngineMode) {
          setSystemAtsMode(d.atsEngineMode);
          if (d.atsEngineMode === "deterministic_only") {
            setAtsEngineChoice("hardcoded");
          } else if (d.atsEngineMode === "ai_only") {
            setAtsEngineChoice("ai");
          }
        }
      })
      .catch(() => { });
  }, []);

  // New skill quick input & preview zoom/bullet drafts
  const [newSkill, setNewSkill] = useState("");
  const [previewScale, setPreviewScale] = useState<75 | 90 | 100>(100);
  const [expBulletDrafts, setExpBulletDrafts] = useState<Record<string, string>>({});
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<string>("all");

  // ATS Quality Caution & Spotlight state
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null);
  const [attentionBanner, setAttentionBanner] = useState<{
    checkId: string;
    title: string;
    details: string[];
    actionLabel?: string;
  } | null>(null);

  const handleJumpToCautionSection = useCallback((chk: AtsQualityCheckItem) => {
    if (!chk.targetSection) return;

    // 1. Switch to content or layout tab
    setLeftTab(chk.targetSection === "layout" ? "layout" : "content");

    // 2. Set active spotlight & attention banner
    setHighlightedSection(chk.targetSection);
    setAttentionBanner({
      checkId: chk.id,
      title: chk.label,
      details: chk.attentionDetails || [chk.note],
      actionLabel: chk.actionLabel,
    });

    // 3. Smooth scroll to the target section
    setTimeout(() => {
      const el = document.getElementById(`section-${chk.targetSection}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 120);

    // 4. Fade spotlight ring after 8 seconds
    setTimeout(() => {
      setHighlightedSection((prev) => (prev === chk.targetSection ? null : prev));
    }, 8000);
  }, []);

  const renderAttentionBanner = (targetCheckIds: string[]) => {
    if (!attentionBanner || !targetCheckIds.includes(attentionBanner.checkId)) return null;
    return (
      <div className="rounded-xl border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/70 p-3.5 text-xs text-amber-950 dark:text-amber-100 space-y-2 animate-fadeIn shadow-[0_2px_8px_rgba(245,158,11,0.15)]">
        <div className="flex items-center justify-between font-bold">
          <div className="flex items-center gap-1.5 flex-wrap">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="uppercase tracking-wider text-[10px] font-mono bg-amber-200/90 dark:bg-amber-900/80 px-1.5 py-0.5 rounded text-amber-950 dark:text-amber-200">
              ATS Attention Needed
            </span>
            <span className="text-xs font-bold text-neutral-900 dark:text-white">
              {attentionBanner.title}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setAttentionBanner(null);
              setHighlightedSection(null);
            }}
            className="text-[11px] font-mono text-amber-800 dark:text-amber-300 underline hover:no-underline cursor-pointer"
          >
            Dismiss [x]
          </button>
        </div>
        <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-amber-950/90 dark:text-amber-200/90">
          {attentionBanner.details.map((detail, idx) => (
            <li key={idx} className="leading-snug">{detail}</li>
          ))}
        </ul>
      </div>
    );
  };

  const qualityReport = useMemo(
    () => evaluateCvQuality(cv.structuredContent),
    [cv.structuredContent]
  );

  const persistNow = useCallback(
    async (record: CvRecord): Promise<boolean> => {
      setSaveState("saving");
      try {
        const res = await fetch(`/api/cvs/${record.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: record.title,
            templateId: record.templateId,
            structuredContent: record.structuredContent,
            settings: record.settings,
            status: record.status,
          }),
        });
        if (!res.ok) {
          setSaveState("error");
          return false;
        }
        setSaveState("saved");
        return true;
      } catch {
        setSaveState("error");
        return false;
      }
    },
    []
  );

  // Debounced autosave with instant flush on leave/unmount
  const cvRef = useRef(cv);
  useEffect(() => {
    cvRef.current = cv;
  }, [cv]);

  const isFirstRender = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      persistNow(cv);
    }, 800);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [cv, persistNow]);

  // Flush pending changes when switching tabs, closing tab, or unmounting
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        persistNow(cvRef.current);
      }
    };
    const handleBeforeUnload = () => {
      persistNow(cvRef.current);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      persistNow(cvRef.current);
    };
  }, [persistNow]);

  function updateContent(updater: (prev: StructuredCvContent) => StructuredCvContent) {
    setCv((prev) => {
      const nextContent = updater(prev.structuredContent);
      const updated = {
        ...prev,
        structuredContent: nextContent,
      };
      if (typeof window !== "undefined" && updated.id) {
        try {
          sessionStorage.setItem(`vitra_cv_draft_${updated.id}`, JSON.stringify(updated));
        } catch { }
      }
      return updated;
    });
  }

  function updateSettings(updater: (prev: CvEditorSettings) => CvEditorSettings) {
    setCv((prev) => {
      const nextSettings = updater(prev.settings);
      const updated = {
        ...prev,
        settings: nextSettings,
      };
      if (typeof window !== "undefined" && updated.id) {
        try {
          sessionStorage.setItem(`vitra_cv_draft_${updated.id}`, JSON.stringify(updated));
        } catch { }
      }
      return updated;
    });
  }

  async function handleExport(format: "pdf" | "docx") {
    setRequestedExportFormat(format);
    if (!hasActiveSubscription) {
      setShowSubscriptionModal(true);
      return;
    }
    setExporting(format);
    try {
      await persistNow(cv);
      const res = await fetch(`/api/cvs/${cv.id}/export?format=${format}`);
      if (!res.ok) {
        if (res.status === 403) {
          const err = await res.json().catch(() => ({}));
          if (err.paymentRequired) {
            setShowSubscriptionModal(true);
            return;
          }
        }
        const err = await res.json().catch(() => ({}));
        setAiMessage(err.error || `Failed to export ${format.toUpperCase()}.`);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeTitle = (cv.structuredContent.personalInfo.fullName || cv.title || "vitra_cv")
        .replace(/[^a-zA-Z0-9_-]+/g, "_")
        .slice(0, 60);
      a.download = `${safeTitle}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(null);
    }
  }

  async function handlePolishSummary() {
    if (!cv.structuredContent.summary.trim()) {
      setAiMessage("Write a short summary first, or use the wizard prompts to generate one.");
      return;
    }
    setAiBusy("summary");
    setAiMessage(null);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "grammar", text: cv.structuredContent.summary }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setAiMessage(data.error || "OpenAI is not configured for generative rewriting.");
      } else {
        updateContent((c) => ({ ...c, summary: data.data.correctedText }));
        setAiMessage("Summary refined while preserving your exact factual details.");
      }
    } catch {
      setAiMessage("Network error contacting AI service.");
    } finally {
      setAiBusy(null);
    }
  }

  async function handleImproveExp(expId: string) {
    const exp = cv.structuredContent.experience.find((e) => e.id === expId);
    if (!exp || !exp.responsibilities.trim()) return;
    setAiBusy(expId);
    setAiMessage(null);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "improve-work",
          jobTitle: exp.jobTitle || "Role",
          company: exp.company,
          rawDescription: exp.responsibilities,
          existingAchievements: exp.achievements,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setAiMessage(data.error || "OpenAI is not configured.");
      } else {
        updateContent((c) => ({
          ...c,
          experience: c.experience.map((item) =>
            item.id === expId
              ? {
                ...item,
                responsibilities: data.data.improvedResponsibilities,
                achievements:
                  data.data.suggestedAchievements?.length > 0
                    ? data.data.suggestedAchievements
                    : item.achievements,
              }
              : item
          ),
        }));
        setAiMessage("Role description refined.");
      }
    } catch {
      setAiMessage("Network error contacting AI service.");
    } finally {
      setAiBusy(null);
    }
  }

  async function handleAnalyzeJob() {
    if (!jobTitle.trim() || jobDescription.trim().length < 20) {
      setAiMessage("Enter a target job title and paste at least a short job description.");
      return;
    }
    setAiBusy("tailor");
    setAiMessage(null);
    const localComp = compareCvWithJobDescription(cv.structuredContent, jobDescription);
    setDeterministicMatch(localComp);

    try {
      await persistNow(cv);
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "tailor-job",
          cvId: cv.id,
          jobTitle,
          company: jobCompany,
          jobDescription,
          engine: atsEngineChoice,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setTailorResult(data.data);
      } else {
        setAiMessage(
          data.error ||
          "Showing deterministic keyword comparison below."
        );
      }
    } catch {
      setAiMessage("Network error while tailoring CV.");
    } finally {
      setAiBusy(null);
    }
  }

  async function handleCreateTailoredCopy() {
    const tailoredContent = structuredClone(cv.structuredContent);
    if (tailorResult) {
      for (const s of tailorResult.suggestions) {
        if (s.status !== "accepted") continue;
        if (s.targetSection.toLowerCase().includes("summary")) {
          tailoredContent.summary = s.suggestedText;
        } else if (s.originalText) {
          tailoredContent.experience = tailoredContent.experience.map((exp) => ({
            ...exp,
            responsibilities: exp.responsibilities.includes(s.originalText)
              ? exp.responsibilities.replace(s.originalText, s.suggestedText)
              : exp.responsibilities,
          }));
        }
      }
    }

    const res = await fetch("/api/cvs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `${cv.title} — ${jobTitle || "Tailored"}`,
        careerProfile: cv.careerProfile,
        templateId: cv.templateId,
        structuredContent: tailoredContent,
        settings: cv.settings,
        status: "tailored",
        parentCvId: cv.id,
      }),
    });
    const data = await res.json();
    if (res.ok && data.cv) {
      router.push(`/editor/${data.cv.id}`);
    }
  }

  function moveSection(key: SectionKey, direction: -1 | 1) {
    updateSettings((s) => {
      const order = [...s.sectionOrder];
      const idx = order.indexOf(key);
      if (idx === -1) return s;
      const target = idx + direction;
      if (target < 0 || target >= order.length) return s;
      const [item] = order.splice(idx, 1);
      order.splice(target, 0, item);
      return { ...s, sectionOrder: order };
    });
  }

  function toggleHiddenSection(key: SectionKey) {
    updateSettings((s) => {
      const exists = s.hiddenSections.includes(key);
      return {
        ...s,
        hiddenSections: exists
          ? s.hiddenSections.filter((k) => k !== key)
          : [...s.hiddenSections, key],
      };
    });
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-4">
      {/* Top Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-[#E2DDD2] bg-[#FFFEFA] p-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <Link
            href="/my-cvs"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#173B30] hover:underline"
          >
            <FolderKanban className="h-3.5 w-3.5" />
            My CVs
          </Link>
          <Link
            href={`/create/personal-information?cvId=${cv.id}`}
            onClick={() => persistNow(cv)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 dark:border-white/20 bg-white dark:bg-[#1E2333] px-2.5 py-1.5 text-xs font-bold text-[#111111] dark:text-white shadow-sm hover:bg-[#F3F4F6] dark:hover:bg-[#252B3E] transition-all cursor-pointer"
            title="Jump back into the guided step-by-step wizard"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-[#173B30] dark:text-[#34D399]" />
            <span>Step-by-Step Wizard</span>
          </Link>
          <Input
            value={cv.title}
            onChange={(e) => setCv((p) => ({ ...p, title: e.target.value }))}
            aria-label="CV Title"
            className="h-9 max-w-xs font-medium"
          />
          {saveState === "saving" && (
            <Badge variant="neutral">
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              Saving...
            </Badge>
          )}
          {saveState === "saved" && (
            <Badge variant="forest">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Saved
            </Badge>
          )}
          {saveState === "error" && <Badge variant="danger">Save failed</Badge>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("docx")}
            disabled={exporting !== null}
          >
            <Download className="h-3.5 w-3.5" />
            <span>{exporting === "docx" ? "Generating DOCX..." : "Download DOCX"}</span>
            {!hasActiveSubscription && <Lock className="h-3 w-3 text-amber-600 ml-0.5" />}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleExport("pdf")}
            disabled={exporting !== null}
          >
            <Download className="h-3.5 w-3.5" />
            <span>{exporting === "pdf" ? "Generating PDF..." : "Download PDF"}</span>
            {!hasActiveSubscription && <Lock className="h-3 w-3 text-amber-300 ml-0.5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Edit/Preview Switcher */}
      <div className="flex rounded-lg border border-[#D4CFC3] bg-[#FFFEFA] p-1 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileView("edit")}
          className={cn(
            "flex-1 rounded-md py-2 text-xs font-semibold cursor-pointer",
            mobileView === "edit" ? "bg-[#173B30] text-[#FFFEFA]" : "text-[#77786F]"
          )}
        >
          Edit Sections
        </button>
        <button
          type="button"
          onClick={() => setMobileView("preview")}
          className={cn(
            "flex-1 rounded-md py-2 text-xs font-semibold cursor-pointer",
            mobileView === "preview" ? "bg-[#173B30] text-[#FFFEFA]" : "text-[#77786F]"
          )}
        >
          Live Preview
        </button>
      </div>

      {aiMessage && (
        <div className="rounded-lg border border-[#173B30]/30 bg-[#FFFEFA] px-4 py-2.5 text-sm text-[#252821]">
          {aiMessage}
        </div>
      )}

      {/* Split Workspace */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* LEFT PANEL: Editor Controls */}
        <div
          className={cn(
            "space-y-4 lg:col-span-5",
            mobileView === "preview" ? "hidden lg:block" : "block"
          )}
        >
          {/* Left Panel Mode Tabs */}
          <div className="grid grid-cols-4 gap-1 rounded-xl border border-[#E2DDD2] bg-[#FFFEFA] p-1">
            {(
              [
                { id: "content", label: "Content" },
                { id: "layout", label: "Templates" },
                { id: "quality", label: `ATS (${qualityReport.passedCount}/${qualityReport.totalCount})` },
                { id: "tailor", label: "Tailor" },
              ] as { id: LeftTab; label: string }[]
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setLeftTab(t.id)}
                className={cn(
                  "rounded-lg py-2 text-xs font-medium transition-colors cursor-pointer",
                  leftTab === t.id
                    ? "bg-[#173B30] text-[#FFFEFA]"
                    : "text-[#77786F] hover:text-[#252821]"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* TAB 1: CONTENT EDITORS */}
          {leftTab === "content" && (
            <div className="space-y-4">
              {/* Personal Info */}
              <Card
                id="section-personal-info"
                className={cn(
                  "p-4 space-y-3 transition-all duration-500",
                  highlightedSection === "personal-info" &&
                  "ring-4 ring-amber-400 dark:ring-amber-500 bg-amber-50/20 dark:bg-amber-950/20 shadow-[0_0_25px_rgba(245,158,11,0.35)]"
                )}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-[#173B30] dark:text-[#A7F3D0]">
                    Personal Information
                  </h2>
                  {highlightedSection === "personal-info" && (
                    <span className="rounded-full bg-amber-200 dark:bg-amber-900/60 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-900 dark:text-amber-200 animate-pulse">
                      • FOCUSED FROM ATS CHECK
                    </span>
                  )}
                </div>

                {renderAttentionBanner(["contact-completeness"])}
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    value={cv.structuredContent.personalInfo.fullName}
                    onChange={(e) =>
                      updateContent((c) => ({
                        ...c,
                        personalInfo: { ...c.personalInfo, fullName: e.target.value },
                      }))
                    }
                    placeholder="Full Name"
                  />
                  <Input
                    value={cv.structuredContent.personalInfo.professionalTitle}
                    onChange={(e) =>
                      updateContent((c) => ({
                        ...c,
                        personalInfo: { ...c.personalInfo, professionalTitle: e.target.value },
                      }))
                    }
                    placeholder="Professional Title"
                  />
                  <Input
                    value={cv.structuredContent.personalInfo.email}
                    onChange={(e) =>
                      updateContent((c) => ({
                        ...c,
                        personalInfo: { ...c.personalInfo, email: e.target.value },
                      }))
                    }
                    placeholder="Email"
                  />
                  <Input
                    value={cv.structuredContent.personalInfo.phone}
                    onChange={(e) =>
                      updateContent((c) => ({
                        ...c,
                        personalInfo: { ...c.personalInfo, phone: e.target.value },
                      }))
                    }
                    placeholder="+234..."
                  />
                  <Input
                    value={cv.structuredContent.personalInfo.city}
                    onChange={(e) =>
                      updateContent((c) => ({
                        ...c,
                        personalInfo: { ...c.personalInfo, city: e.target.value },
                      }))
                    }
                    placeholder="City"
                  />
                  <Input
                    value={cv.structuredContent.personalInfo.country}
                    onChange={(e) =>
                      updateContent((c) => ({
                        ...c,
                        personalInfo: { ...c.personalInfo, country: e.target.value },
                      }))
                    }
                    placeholder="Country"
                  />
                  <Input
                    value={cv.structuredContent.personalInfo.linkedinUrl}
                    onChange={(e) =>
                      updateContent((c) => ({
                        ...c,
                        personalInfo: { ...c.personalInfo, linkedinUrl: e.target.value },
                      }))
                    }
                    placeholder="LinkedIn URL"
                  />
                  <Input
                    value={cv.structuredContent.personalInfo.portfolioUrl}
                    onChange={(e) =>
                      updateContent((c) => ({
                        ...c,
                        personalInfo: { ...c.personalInfo, portfolioUrl: e.target.value },
                      }))
                    }
                    placeholder="Portfolio / Website URL"
                  />
                </div>
              </Card>

              {/* Professional Summary */}
              <Card
                id="section-summary"
                className={cn(
                  "p-4 space-y-3 transition-all duration-500",
                  highlightedSection === "summary" &&
                  "ring-4 ring-amber-400 dark:ring-amber-500 bg-amber-50/20 dark:bg-amber-950/20 shadow-[0_0_25px_rgba(245,158,11,0.35)]"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-[#173B30] dark:text-[#A7F3D0]">
                      Professional Summary
                    </h2>
                    {highlightedSection === "summary" && (
                      <span className="rounded-full bg-amber-200 dark:bg-amber-900/60 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-900 dark:text-amber-200 animate-pulse">
                        • FOCUSED FROM ATS CHECK
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={aiBusy === "summary"}
                    onClick={handlePolishSummary}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {aiBusy === "summary" ? "Refining..." : "Polish with AI"}
                  </Button>
                </div>
                {renderAttentionBanner(["summary-quality"])}
                <Textarea
                  rows={4}
                  value={cv.structuredContent.summary}
                  onChange={(e) => updateContent((c) => ({ ...c, summary: e.target.value }))}
                  placeholder="Write a 2–4 sentence professional summary..."
                />
              </Card>

              {/* Work Experience */}
              <Card
                id="section-experience"
                className={cn(
                  "p-4 space-y-3 transition-all duration-500",
                  highlightedSection === "experience" &&
                  "ring-4 ring-amber-400 dark:ring-amber-500 bg-amber-50/20 dark:bg-amber-950/20 shadow-[0_0_25px_rgba(245,158,11,0.35)]"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-[#173B30] dark:text-[#A7F3D0]">
                      Work Experience
                    </h2>
                    {highlightedSection === "experience" && (
                      <span className="rounded-full bg-amber-200 dark:bg-amber-900/60 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-900 dark:text-amber-200 animate-pulse">
                        • FOCUSED FROM ATS CHECK
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      updateContent((c) => ({
                        ...c,
                        hasFormalExperience: true,
                        experience: [
                          ...c.experience,
                          {
                            id: createId(),
                            jobTitle: "",
                            company: "",
                            location: "",
                            employmentType: "Full-time",
                            startDate: "",
                            endDate: "",
                            isCurrent: false,
                            responsibilities: "",
                            achievements: [],
                          },
                        ],
                      }))
                    }
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add role
                  </Button>
                </div>

                {renderAttentionBanner(["descriptive-statements", "experience-or-pathway", "consistent-dates"])}

                {cv.structuredContent.experience.map((exp) => (
                  <div
                    key={exp.id}
                    className="rounded-lg border border-[#E2DDD2] bg-[#F6F3ED]/60 p-3 space-y-2.5"
                  >
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        value={exp.jobTitle}
                        onChange={(e) =>
                          updateContent((c) => ({
                            ...c,
                            experience: c.experience.map((it) =>
                              it.id === exp.id ? { ...it, jobTitle: e.target.value } : it
                            ),
                          }))
                        }
                        placeholder="Job Title"
                      />
                      <Input
                        value={exp.company}
                        onChange={(e) =>
                          updateContent((c) => ({
                            ...c,
                            experience: c.experience.map((it) =>
                              it.id === exp.id ? { ...it, company: e.target.value } : it
                            ),
                          }))
                        }
                        placeholder="Company"
                      />
                      <Input
                        value={exp.location}
                        onChange={(e) =>
                          updateContent((c) => ({
                            ...c,
                            experience: c.experience.map((it) =>
                              it.id === exp.id ? { ...it, location: e.target.value } : it
                            ),
                          }))
                        }
                        placeholder="Location"
                      />
                      <Select
                        value={exp.employmentType || "Full-time"}
                        onChange={(e) =>
                          updateContent((c) => ({
                            ...c,
                            experience: c.experience.map((it) =>
                              it.id === exp.id ? { ...it, employmentType: e.target.value } : it
                            ),
                          }))
                        }
                      >
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Contract">Contract</option>
                        <option value="Internship">Internship / SIWES</option>
                        <option value="NYSC">NYSC</option>
                        <option value="Freelance">Freelance</option>
                      </Select>
                      <Input
                        value={exp.startDate}
                        onChange={(e) =>
                          updateContent((c) => ({
                            ...c,
                            experience: c.experience.map((it) =>
                              it.id === exp.id ? { ...it, startDate: e.target.value } : it
                            ),
                          }))
                        }
                        placeholder="Start Date"
                      />
                      <Input
                        value={exp.isCurrent ? "Present" : exp.endDate}
                        disabled={exp.isCurrent}
                        onChange={(e) =>
                          updateContent((c) => ({
                            ...c,
                            experience: c.experience.map((it) =>
                              it.id === exp.id ? { ...it, endDate: e.target.value } : it
                            ),
                          }))
                        }
                        placeholder="End Date"
                      />
                    </div>
                    <label className="inline-flex items-center gap-2 text-xs text-[#252821] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={exp.isCurrent}
                        onChange={(e) =>
                          updateContent((c) => ({
                            ...c,
                            experience: c.experience.map((it) =>
                              it.id === exp.id ? { ...it, isCurrent: e.target.checked } : it
                            ),
                          }))
                        }
                      />
                      Currently work here
                    </label>
                    <Textarea
                      rows={2}
                      value={exp.responsibilities}
                      onChange={(e) =>
                        updateContent((c) => ({
                          ...c,
                          experience: c.experience.map((it) =>
                            it.id === exp.id ? { ...it, responsibilities: e.target.value } : it
                          ),
                        }))
                      }
                      placeholder="Responsibilities..."
                    />
                    <div className="space-y-1.5 rounded-md border border-[#E2DDD2] bg-[#FFFEFA] p-2.5">
                      <p className="text-[11px] font-medium text-[#77786F]">
                        Achievement bullets (optional)
                      </p>
                      {exp.achievements.map((bullet, bIdx) => (
                        <div key={bIdx} className="flex items-center gap-1.5">
                          <Input
                            value={bullet}
                            onChange={(e) =>
                              updateContent((c) => ({
                                ...c,
                                experience: c.experience.map((it) =>
                                  it.id === exp.id
                                    ? {
                                      ...it,
                                      achievements: it.achievements.map((a, idx) =>
                                        idx === bIdx ? e.target.value : a
                                      ),
                                    }
                                    : it
                                ),
                              }))
                            }
                          />
                          <button
                            type="button"
                            aria-label="Remove bullet"
                            onClick={() =>
                              updateContent((c) => ({
                                ...c,
                                experience: c.experience.map((it) =>
                                  it.id === exp.id
                                    ? {
                                      ...it,
                                      achievements: it.achievements.filter(
                                        (_, idx) => idx !== bIdx
                                      ),
                                    }
                                    : it
                                ),
                              }))
                            }
                            className="p-1 text-[#77786F] hover:text-[#8F2424] cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      <div className="flex gap-1.5">
                        <Input
                          value={expBulletDrafts[exp.id] || ""}
                          onChange={(e) =>
                            setExpBulletDrafts((prev) => ({ ...prev, [exp.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const val = (expBulletDrafts[exp.id] || "").trim();
                              if (!val) return;
                              updateContent((c) => ({
                                ...c,
                                experience: c.experience.map((it) =>
                                  it.id === exp.id
                                    ? { ...it, achievements: [...it.achievements, val] }
                                    : it
                                ),
                              }));
                              setExpBulletDrafts((prev) => ({ ...prev, [exp.id]: "" }));
                            }
                          }}
                          placeholder="Add bullet point..."
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const val = (expBulletDrafts[exp.id] || "").trim();
                            if (!val) return;
                            updateContent((c) => ({
                              ...c,
                              experience: c.experience.map((it) =>
                                it.id === exp.id
                                  ? { ...it, achievements: [...it.achievements, val] }
                                  : it
                              ),
                            }));
                            setExpBulletDrafts((prev) => ({ ...prev, [exp.id]: "" }));
                          }}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={aiBusy === exp.id}
                        onClick={() => handleImproveExp(exp.id)}
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        {aiBusy === exp.id ? "Improving..." : "Improve with AI"}
                      </Button>
                      <button
                        type="button"
                        onClick={() =>
                          updateContent((c) => ({
                            ...c,
                            experience: c.experience.filter((it) => it.id !== exp.id),
                          }))
                        }
                        className="text-xs text-[#8F2424] hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                {/* Alternative / No-Experience records */}
                <div className="pt-2 border-t border-[#E2DDD2] flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#77786F]">
                    Alternative Experience (NYSC / SIWES / Volunteering)
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      updateContent((c) => ({
                        ...c,
                        alternativeExperience: [
                          ...c.alternativeExperience,
                          {
                            id: createId(),
                            category: "nysc",
                            title: "",
                            organization: "",
                            location: "",
                            startDate: "",
                            endDate: "",
                            isCurrent: false,
                            description: "",
                          },
                        ],
                      }))
                    }
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add entry
                  </Button>
                </div>

                {cv.structuredContent.alternativeExperience.map((alt) => (
                  <div
                    key={alt.id}
                    className="rounded-lg border border-[#E2DDD2] bg-[#F6F3ED]/60 p-3 space-y-2"
                  >
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Select
                        value={alt.category}
                        onChange={(e) =>
                          updateContent((c) => ({
                            ...c,
                            alternativeExperience: c.alternativeExperience.map((it) =>
                              it.id === alt.id
                                ? { ...it, category: e.target.value as typeof alt.category }
                                : it
                            ),
                          }))
                        }
                      >
                        {NO_EXPERIENCE_CATEGORIES.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.label}
                          </option>
                        ))}
                      </Select>
                      <Input
                        value={alt.title}
                        onChange={(e) =>
                          updateContent((c) => ({
                            ...c,
                            alternativeExperience: c.alternativeExperience.map((it) =>
                              it.id === alt.id ? { ...it, title: e.target.value } : it
                            ),
                          }))
                        }
                        placeholder="Title / Role"
                      />
                      <Input
                        value={alt.organization}
                        onChange={(e) =>
                          updateContent((c) => ({
                            ...c,
                            alternativeExperience: c.alternativeExperience.map((it) =>
                              it.id === alt.id ? { ...it, organization: e.target.value } : it
                            ),
                          }))
                        }
                        placeholder="Organization / Institution"
                      />
                      <div className="grid grid-cols-2 gap-1.5">
                        <Input
                          value={alt.startDate}
                          onChange={(e) =>
                            updateContent((c) => ({
                              ...c,
                              alternativeExperience: c.alternativeExperience.map((it) =>
                                it.id === alt.id ? { ...it, startDate: e.target.value } : it
                              ),
                            }))
                          }
                          placeholder="Start"
                        />
                        <Input
                          value={alt.isCurrent ? "Present" : alt.endDate}
                          disabled={alt.isCurrent}
                          onChange={(e) =>
                            updateContent((c) => ({
                              ...c,
                              alternativeExperience: c.alternativeExperience.map((it) =>
                                it.id === alt.id ? { ...it, endDate: e.target.value } : it
                              ),
                            }))
                          }
                          placeholder="End"
                        />
                      </div>
                    </div>
                    <Textarea
                      rows={2}
                      value={alt.description}
                      onChange={(e) =>
                        updateContent((c) => ({
                          ...c,
                          alternativeExperience: c.alternativeExperience.map((it) =>
                            it.id === alt.id ? { ...it, description: e.target.value } : it
                          ),
                        }))
                      }
                      placeholder="Description..."
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          updateContent((c) => ({
                            ...c,
                            alternativeExperience: c.alternativeExperience.filter(
                              (it) => it.id !== alt.id
                            ),
                          }))
                        }
                        className="text-xs text-[#8F2424] hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </Card>

              {/* Education */}
              <Card
                id="section-education"
                className={cn(
                  "p-4 space-y-3 transition-all duration-500",
                  highlightedSection === "education" &&
                  "ring-4 ring-amber-400 dark:ring-amber-500 bg-amber-50/20 dark:bg-amber-950/20 shadow-[0_0_25px_rgba(245,158,11,0.35)]"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-[#173B30] dark:text-[#A7F3D0]">
                      Education
                    </h2>
                    {highlightedSection === "education" && (
                      <span className="rounded-full bg-amber-200 dark:bg-amber-900/60 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-900 dark:text-amber-200 animate-pulse">
                        • FOCUSED FROM ATS CHECK
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      updateContent((c) => ({
                        ...c,
                        education: [
                          ...c.education,
                          {
                            id: createId(),
                            institution: "",
                            qualification: "BSc (Bachelor of Science)",
                            fieldOfStudy: "",
                            startDate: "",
                            endDate: "",
                            isCurrent: false,
                            achievements: "",
                          },
                        ],
                      }))
                    }
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add education
                  </Button>
                </div>

                {renderAttentionBanner(["education-present", "consistent-dates"])}

                {cv.structuredContent.education.map((edu) => (
                  <div
                    key={edu.id}
                    className="rounded-lg border border-[#E2DDD2] bg-[#F6F3ED]/60 p-3 space-y-2"
                  >
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        value={edu.institution}
                        onChange={(e) =>
                          updateContent((c) => ({
                            ...c,
                            education: c.education.map((it) =>
                              it.id === edu.id ? { ...it, institution: e.target.value } : it
                            ),
                          }))
                        }
                        placeholder="Institution"
                      />
                      <Select
                        value={
                          NIGERIAN_AND_INTL_QUALIFICATIONS.includes(edu.qualification)
                            ? edu.qualification
                            : "Other / International Equivalent"
                        }
                        onChange={(e) =>
                          updateContent((c) => ({
                            ...c,
                            education: c.education.map((it) =>
                              it.id === edu.id ? { ...it, qualification: e.target.value } : it
                            ),
                          }))
                        }
                      >
                        {NIGERIAN_AND_INTL_QUALIFICATIONS.map((q) => (
                          <option key={q} value={q}>
                            {q}
                          </option>
                        ))}
                      </Select>
                      <Input
                        value={edu.fieldOfStudy}
                        onChange={(e) =>
                          updateContent((c) => ({
                            ...c,
                            education: c.education.map((it) =>
                              it.id === edu.id ? { ...it, fieldOfStudy: e.target.value } : it
                            ),
                          }))
                        }
                        placeholder="Course / Field of study"
                      />
                      <div className="grid grid-cols-2 gap-1.5">
                        <Input
                          value={edu.startDate}
                          onChange={(e) =>
                            updateContent((c) => ({
                              ...c,
                              education: c.education.map((it) =>
                                it.id === edu.id ? { ...it, startDate: e.target.value } : it
                              ),
                            }))
                          }
                          placeholder="Start"
                        />
                        <Input
                          value={edu.isCurrent ? "Present" : edu.endDate}
                          disabled={edu.isCurrent}
                          onChange={(e) =>
                            updateContent((c) => ({
                              ...c,
                              education: c.education.map((it) =>
                                it.id === edu.id ? { ...it, endDate: e.target.value } : it
                              ),
                            }))
                          }
                          placeholder="End"
                        />
                      </div>
                    </div>
                    <Input
                      value={edu.achievements}
                      onChange={(e) =>
                        updateContent((c) => ({
                          ...c,
                          education: c.education.map((it) =>
                            it.id === edu.id ? { ...it, achievements: e.target.value } : it
                          ),
                        }))
                      }
                      placeholder="Honours, class of degree, or achievements (optional)"
                    />
                    <div className="flex items-center justify-between">
                      <label className="inline-flex items-center gap-2 text-xs text-[#252821] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={edu.isCurrent}
                          onChange={(e) =>
                            updateContent((c) => ({
                              ...c,
                              education: c.education.map((it) =>
                                it.id === edu.id ? { ...it, isCurrent: e.target.checked } : it
                              ),
                            }))
                          }
                        />
                        Currently studying here
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          updateContent((c) => ({
                            ...c,
                            education: c.education.filter((it) => it.id !== edu.id),
                          }))
                        }
                        className="text-xs text-[#8F2424] hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </Card>

              {/* Skills */}
              <Card
                id="section-skills"
                className={cn(
                  "p-4 space-y-3 transition-all duration-500",
                  highlightedSection === "skills" &&
                  "ring-4 ring-amber-400 dark:ring-amber-500 bg-amber-50/20 dark:bg-amber-950/20 shadow-[0_0_25px_rgba(245,158,11,0.35)]"
                )}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-[#173B30] dark:text-[#A7F3D0]">
                    Skills
                  </h2>
                  {highlightedSection === "skills" && (
                    <span className="rounded-full bg-amber-200 dark:bg-amber-900/60 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-900 dark:text-amber-200 animate-pulse">
                      • FOCUSED FROM ATS CHECK
                    </span>
                  )}
                </div>

                {renderAttentionBanner(["skills-coverage"])}
                <div className="flex gap-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add a skill..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newSkill.trim()) {
                        e.preventDefault();
                        updateContent((c) => ({
                          ...c,
                          skills: [
                            ...c.skills,
                            { id: createId(), name: newSkill.trim(), category: "technical" },
                          ],
                        }));
                        setNewSkill("");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      if (!newSkill.trim()) return;
                      updateContent((c) => ({
                        ...c,
                        skills: [
                          ...c.skills,
                          { id: createId(), name: newSkill.trim(), category: "technical" },
                        ],
                      }));
                      setNewSkill("");
                    }}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {cv.structuredContent.skills.map((s) => (
                    <span
                      key={s.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#173B30]/30 bg-[#173B30]/8 px-3 py-1 text-xs text-[#173B30]"
                    >
                      {s.name}
                      <button
                        type="button"
                        onClick={() =>
                          updateContent((c) => ({
                            ...c,
                            skills: c.skills.filter((it) => it.id !== s.id),
                          }))
                        }
                        className="hover:text-[#8F2424] cursor-pointer"
                        aria-label={`Remove ${s.name}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </Card>

              {/* Projects */}
              <Card
                id="section-projects"
                className={cn(
                  "p-4 space-y-3 transition-all duration-500",
                  highlightedSection === "projects" &&
                  "ring-4 ring-amber-400 dark:ring-amber-500 bg-amber-50/20 dark:bg-amber-950/20 shadow-[0_0_25px_rgba(245,158,11,0.35)]"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-[#173B30] dark:text-[#A7F3D0]">
                      Projects
                    </h2>
                    {highlightedSection === "projects" && (
                      <span className="rounded-full bg-amber-200 dark:bg-amber-900/60 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-900 dark:text-amber-200 animate-pulse">
                        • FOCUSED FROM ATS CHECK
                      </span>
                    )}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      updateContent((c) => ({
                        ...c,
                        projects: [
                          ...c.projects,
                          {
                            id: createId(),
                            title: "",
                            role: "",
                            description: "",
                            technologies: [],
                            outcome: "",
                            projectUrl: "",
                          },
                        ],
                      }))
                    }
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add project
                  </Button>
                </div>

                {cv.structuredContent.projects.length === 0 && (
                  <p className="text-xs text-[#77786F]">No projects added yet.</p>
                )}

                {cv.structuredContent.projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="rounded-lg border border-[#E2DDD2] bg-[#F6F3ED]/60 p-3 space-y-2"
                  >
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        value={proj.title}
                        onChange={(e) =>
                          updateContent((c) => ({
                            ...c,
                            projects: c.projects.map((it) =>
                              it.id === proj.id ? { ...it, title: e.target.value } : it
                            ),
                          }))
                        }
                        placeholder="Project title"
                      />
                      <Input
                        value={proj.role}
                        onChange={(e) =>
                          updateContent((c) => ({
                            ...c,
                            projects: c.projects.map((it) =>
                              it.id === proj.id ? { ...it, role: e.target.value } : it
                            ),
                          }))
                        }
                        placeholder="Your role"
                      />
                    </div>
                    <Textarea
                      rows={2}
                      value={proj.description}
                      onChange={(e) =>
                        updateContent((c) => ({
                          ...c,
                          projects: c.projects.map((it) =>
                            it.id === proj.id ? { ...it, description: e.target.value } : it
                          ),
                        }))
                      }
                      placeholder="Brief description..."
                    />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        value={proj.outcome}
                        onChange={(e) =>
                          updateContent((c) => ({
                            ...c,
                            projects: c.projects.map((it) =>
                              it.id === proj.id ? { ...it, outcome: e.target.value } : it
                            ),
                          }))
                        }
                        placeholder="Outcome (optional)"
                      />
                      <Input
                        value={proj.projectUrl}
                        onChange={(e) =>
                          updateContent((c) => ({
                            ...c,
                            projects: c.projects.map((it) =>
                              it.id === proj.id ? { ...it, projectUrl: e.target.value } : it
                            ),
                          }))
                        }
                        placeholder="Project URL (optional)"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          updateContent((c) => ({
                            ...c,
                            projects: c.projects.filter((it) => it.id !== proj.id),
                          }))
                        }
                        className="text-xs text-[#8F2424] hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </Card>

              {/* Certifications */}
              <Card className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-[#173B30]">Certifications</h2>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      updateContent((c) => ({
                        ...c,
                        certifications: [
                          ...c.certifications,
                          {
                            id: createId(),
                            name: "",
                            issuingOrganization: "",
                            issueDate: "",
                            expiryDate: "",
                            credentialUrl: "",
                          },
                        ],
                      }))
                    }
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add certification
                  </Button>
                </div>

                {cv.structuredContent.certifications.length === 0 && (
                  <p className="text-xs text-[#77786F]">No certifications added yet.</p>
                )}

                {cv.structuredContent.certifications.map((cert) => (
                  <div
                    key={cert.id}
                    className="rounded-lg border border-[#E2DDD2] bg-[#F6F3ED]/60 p-3 space-y-2"
                  >
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        value={cert.name}
                        onChange={(e) =>
                          updateContent((c) => ({
                            ...c,
                            certifications: c.certifications.map((it) =>
                              it.id === cert.id ? { ...it, name: e.target.value } : it
                            ),
                          }))
                        }
                        placeholder="Certification name"
                      />
                      <Input
                        value={cert.issuingOrganization}
                        onChange={(e) =>
                          updateContent((c) => ({
                            ...c,
                            certifications: c.certifications.map((it) =>
                              it.id === cert.id
                                ? { ...it, issuingOrganization: e.target.value }
                                : it
                            ),
                          }))
                        }
                        placeholder="Issuing body"
                      />
                      <Input
                        value={cert.issueDate}
                        onChange={(e) =>
                          updateContent((c) => ({
                            ...c,
                            certifications: c.certifications.map((it) =>
                              it.id === cert.id ? { ...it, issueDate: e.target.value } : it
                            ),
                          }))
                        }
                        placeholder="Year / Date"
                      />
                      <Input
                        value={cert.credentialUrl}
                        onChange={(e) =>
                          updateContent((c) => ({
                            ...c,
                            certifications: c.certifications.map((it) =>
                              it.id === cert.id ? { ...it, credentialUrl: e.target.value } : it
                            ),
                          }))
                        }
                        placeholder="Credential URL (optional)"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          updateContent((c) => ({
                            ...c,
                            certifications: c.certifications.filter((it) => it.id !== cert.id),
                          }))
                        }
                        className="text-xs text-[#8F2424] hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </Card>

              {/* Additional Information & References */}
              <Card className="p-4 space-y-3">
                <h2 className="text-sm font-semibold text-[#173B30]">
                  Additional Information & References
                </h2>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <div>
                    <FieldLabel hint="Comma-separated">Languages</FieldLabel>
                    <CommaSeparatedInput
                      value={cv.structuredContent.additional.languages}
                      onChange={(languages) =>
                        updateContent((c) => ({
                          ...c,
                          additional: {
                            ...c.additional,
                            languages,
                          },
                        }))
                      }
                      placeholder="English, Yoruba..."
                    />
                  </div>
                  <div>
                    <FieldLabel hint="Comma-separated">Awards</FieldLabel>
                    <CommaSeparatedInput
                      value={cv.structuredContent.additional.awards}
                      onChange={(awards) =>
                        updateContent((c) => ({
                          ...c,
                          additional: {
                            ...c.additional,
                            awards,
                          },
                        }))
                      }
                      placeholder="Dean's List..."
                    />
                  </div>
                  <div>
                    <FieldLabel hint="Comma-separated">Memberships</FieldLabel>
                    <CommaSeparatedInput
                      value={cv.structuredContent.additional.memberships}
                      onChange={(memberships) =>
                        updateContent((c) => ({
                          ...c,
                          additional: {
                            ...c.additional,
                            memberships,
                          },
                        }))
                      }
                      placeholder="ICAN, CIPM..."
                    />
                  </div>
                  <div>
                    <FieldLabel hint="Comma-separated">Interests</FieldLabel>
                    <CommaSeparatedInput
                      value={cv.structuredContent.additional.interests}
                      onChange={(interests) =>
                        updateContent((c) => ({
                          ...c,
                          additional: {
                            ...c.additional,
                            interests,
                          },
                        }))
                      }
                      placeholder="Mentoring, Writing..."
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel hint="Comma-separated">Publications</FieldLabel>
                    <CommaSeparatedInput
                      value={cv.structuredContent.additional.publications}
                      onChange={(publications) =>
                        updateContent((c) => ({
                          ...c,
                          additional: {
                            ...c.additional,
                            publications,
                          },
                        }))
                      }
                      placeholder="Optional publication titles..."
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel>Volunteering summary</FieldLabel>
                    <Textarea
                      rows={2}
                      value={cv.structuredContent.additional.volunteerSummary}
                      onChange={(e) =>
                        updateContent((c) => ({
                          ...c,
                          additional: { ...c.additional, volunteerSummary: e.target.value },
                        }))
                      }
                      placeholder="Community outreach or volunteer summary..."
                    />
                  </div>
                </div>

                <div className="border-t border-[#E2DDD2] pt-3 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="inline-flex items-center gap-2 text-xs text-[#252821] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cv.structuredContent.additional.omitReferences}
                        onChange={(e) =>
                          updateContent((c) => ({
                            ...c,
                            additional: { ...c.additional, omitReferences: e.target.checked },
                          }))
                        }
                      />
                      Show &ldquo;References available on request&rdquo;
                    </label>
                    {!cv.structuredContent.additional.omitReferences && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateContent((c) => ({
                            ...c,
                            additional: {
                              ...c.additional,
                              references: [
                                ...c.additional.references,
                                {
                                  id: createId(),
                                  name: "",
                                  role: "",
                                  organization: "",
                                  contact: "",
                                },
                              ],
                            },
                          }))
                        }
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add referee
                      </Button>
                    )}
                  </div>

                  {!cv.structuredContent.additional.omitReferences &&
                    cv.structuredContent.additional.references.map((ref) => (
                      <div
                        key={ref.id}
                        className="grid gap-2 rounded-lg border border-[#E2DDD2] bg-[#F6F3ED]/60 p-2.5 sm:grid-cols-2"
                      >
                        <Input
                          value={ref.name}
                          onChange={(e) =>
                            updateContent((c) => ({
                              ...c,
                              additional: {
                                ...c.additional,
                                references: c.additional.references.map((r) =>
                                  r.id === ref.id ? { ...r, name: e.target.value } : r
                                ),
                              },
                            }))
                          }
                          placeholder="Referee name"
                        />
                        <Input
                          value={ref.role}
                          onChange={(e) =>
                            updateContent((c) => ({
                              ...c,
                              additional: {
                                ...c.additional,
                                references: c.additional.references.map((r) =>
                                  r.id === ref.id ? { ...r, role: e.target.value } : r
                                ),
                              },
                            }))
                          }
                          placeholder="Role"
                        />
                        <Input
                          value={ref.organization}
                          onChange={(e) =>
                            updateContent((c) => ({
                              ...c,
                              additional: {
                                ...c.additional,
                                references: c.additional.references.map((r) =>
                                  r.id === ref.id ? { ...r, organization: e.target.value } : r
                                ),
                              },
                            }))
                          }
                          placeholder="Organization"
                        />
                        <div className="flex gap-1.5">
                          <Input
                            value={ref.contact}
                            onChange={(e) =>
                              updateContent((c) => ({
                                ...c,
                                additional: {
                                  ...c.additional,
                                  references: c.additional.references.map((r) =>
                                    r.id === ref.id ? { ...r, contact: e.target.value } : r
                                  ),
                                },
                              }))
                            }
                            placeholder="Email / phone"
                          />
                          <button
                            type="button"
                            aria-label="Remove referee"
                            onClick={() =>
                              updateContent((c) => ({
                                ...c,
                                additional: {
                                  ...c.additional,
                                  references: c.additional.references.filter(
                                    (r) => r.id !== ref.id
                                  ),
                                },
                              }))
                            }
                            className="p-1.5 text-[#77786F] hover:text-[#8F2424] cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </Card>
            </div>
          )}

          {/* TAB 2: TEMPLATES, FONTS, SPACING & SECTION ORDER */}
          {leftTab === "layout" && (
            <div className="space-y-4">
              {/* 1. TEMPLATE SELECTION GALLERY */}
              <Card className="p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-semibold text-[#173B30]">
                      Choose Template (9 ATS-Compliant Designs)
                    </h2>
                    <p className="text-xs text-[#77786F]">
                      Single-column semantic layouts optimized for ATS parsers and human recruiters.
                    </p>
                  </div>
                  <Badge variant="forest" className="text-[10px]">
                    100% ATS Safe
                  </Badge>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    { id: "all", label: "All (9)" },
                    { id: "tech", label: "Tech & Dev" },
                    { id: "finance", label: "Finance & Banking" },
                    { id: "executive", label: "Executive & High Density" },
                    { id: "academic", label: "Academic & Legal" },
                    { id: "minimal", label: "Minimal & Nordic" },
                    { id: "entry", label: "Graduate & Entry" },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setTemplateCategoryFilter(filter.id)}
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors cursor-pointer",
                        templateCategoryFilter === filter.id
                          ? "bg-[#173B30] text-white"
                          : "bg-[#F3EFE6] text-[#4B4E46] hover:bg-[#EAE4D7]"
                      )}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {/* Template Cards Grid */}
                <div className="grid gap-2 sm:grid-cols-2">
                  {TEMPLATE_METADATA.filter(
                    (tpl) =>
                      templateCategoryFilter === "all" ||
                      tpl.category === templateCategoryFilter ||
                      (templateCategoryFilter === "executive" && (tpl.id === "corporate-executive" || tpl.id === "compact-hybrid")) ||
                      (templateCategoryFilter === "minimal" && (tpl.id === "modern-minimal" || tpl.id === "nordic-clean"))
                  ).map((tpl) => {
                    const isSelected = cv.templateId === tpl.id;
                    const accentColor =
                      tpl.id === "modern-minimal"
                        ? "#173B30"
                        : tpl.id === "corporate-executive"
                          ? "#1B312A"
                          : tpl.id === "graduate-entry"
                            ? "#244B3E"
                            : tpl.id === "tech-innovator"
                              ? "#1E3A5F"
                              : tpl.id === "nordic-clean"
                                ? "#334155"
                                : tpl.id === "ivy-league"
                                  ? "#5C1D24"
                                  : tpl.id === "compact-hybrid"
                                    ? "#0F172A"
                                    : tpl.id === "international-banking"
                                      ? "#0B2545"
                                      : "#1A1A1A";

                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() =>
                          setCv((p) => ({ ...p, templateId: tpl.id as TemplateId }))
                        }
                        className={cn(
                          "relative rounded-xl border p-3.5 text-left transition-all cursor-pointer flex flex-col justify-between",
                          isSelected
                            ? "border-[#173B30] bg-[#173B30]/6 shadow-sm ring-1 ring-[#173B30]"
                            : "border-[#E2DDD2] bg-[#FFFEFA] hover:border-[#173B30]/40 hover:bg-[#F9F7F2]"
                        )}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-2">
                              <span
                                className="h-3 w-3 rounded-full shrink-0 border border-black/10"
                                style={{ backgroundColor: accentColor }}
                              />
                              <p className="text-xs font-bold text-[#252821]">{tpl.name}</p>
                            </div>
                            {isSelected && (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-[#173B30]">
                                <CheckCircle2 className="h-3.5 w-3.5 text-[#173B30]" />
                                Active
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-[11px] font-medium text-[#173B30]/80">
                            {tpl.tagline}
                          </p>
                          <p className="mt-1 text-[11px] text-[#77786F] line-clamp-2">
                            {tpl.description}
                          </p>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-[#E2DDD2]/60 text-[10px]">
                          <span className="text-[#888A82] truncate max-w-[170px]" title={tpl.bestFor}>
                            {tpl.bestFor.split(",")[0]}
                          </span>
                          <span className="text-[#10B981] font-semibold shrink-0">
                            ATS 100%
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* 2. TYPOGRAPHY & FONT STUDIO */}
              <Card className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-[#173B30]">
                      Typography Studio & Font Adjustments
                    </h2>
                    <p className="text-xs text-[#77786F]">
                      Customize your CV font family, font size, line spacing and heading format.
                    </p>
                  </div>
                  <Badge variant="forest" className="text-[10px]">
                    High Legibility
                  </Badge>
                </div>

                {/* Font Family Selection Grid */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <FieldLabel>Select Font Family</FieldLabel>
                    <span className="text-[11px] text-[#77786F]">
                      Current: <strong className="text-[#173B30] capitalize">{cv.settings.fontFamily}</strong>
                    </span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {FONT_METADATA.map((font) => {
                      const isSelected = cv.settings.fontFamily === font.id;
                      return (
                        <button
                          key={font.id}
                          type="button"
                          onClick={() =>
                            updateSettings((s) => ({
                              ...s,
                              fontFamily: font.id as CvEditorSettings["fontFamily"],
                            }))
                          }
                          className={cn(
                            "rounded-lg border p-2.5 text-left transition-all cursor-pointer flex flex-col justify-between",
                            isSelected
                              ? "border-[#173B30] bg-[#173B30]/8 shadow-sm ring-1 ring-[#173B30]"
                              : "border-[#E2DDD2] bg-[#FFFEFA] hover:border-[#173B30]/40"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className="text-sm font-bold text-[#252821]"
                              style={{ fontFamily: font.cssFont }}
                            >
                              {font.name}
                            </span>
                            <span className="text-[10px] rounded bg-[#E2DDD2]/60 px-1.5 py-0.5 text-[#55574F]">
                              {font.category}
                            </span>
                          </div>
                          <p
                            className="mt-1 text-xs text-[#333333] truncate"
                            style={{ fontFamily: font.cssFont }}
                          >
                            Executive presentation & ATS alignment
                          </p>
                          <div className="mt-1.5 flex items-center justify-between text-[10px] text-[#77786F]">
                            <span>{font.description.slice(0, 36)}...</span>
                            <span className="text-[#10B981] font-semibold">{font.atsScore}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Font Size & Spacing & Heading Controls */}
                <div className="grid gap-3 pt-2 sm:grid-cols-3 border-t border-[#E2DDD2]">
                  {/* Font Size */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <FieldLabel>Font Size</FieldLabel>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const sizes: CvEditorSettings["fontSize"][] = ["small", "medium", "large", "extra-large"];
                            const curr = sizes.indexOf(cv.settings.fontSize || "medium");
                            if (curr > 0) {
                              updateSettings((s) => ({ ...s, fontSize: sizes[curr - 1] }));
                            }
                          }}
                          className="h-5 w-5 rounded border border-[#E2DDD2] bg-white text-[10px] font-bold text-[#55574F] hover:bg-[#F3EFE6] flex items-center justify-center cursor-pointer"
                          title="Decrease font size"
                        >
                          -A
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const sizes: CvEditorSettings["fontSize"][] = ["small", "medium", "large", "extra-large"];
                            const curr = sizes.indexOf(cv.settings.fontSize || "medium");
                            if (curr < sizes.length - 1) {
                              updateSettings((s) => ({ ...s, fontSize: sizes[curr + 1] }));
                            }
                          }}
                          className="h-5 w-5 rounded border border-[#E2DDD2] bg-white text-[10px] font-bold text-[#55574F] hover:bg-[#F3EFE6] flex items-center justify-center cursor-pointer"
                          title="Increase font size"
                        >
                          +A
                        </button>
                      </div>
                    </div>
                    <Select
                      value={cv.settings.fontSize}
                      onChange={(e) =>
                        updateSettings((s) => ({
                          ...s,
                          fontSize: e.target.value as CvEditorSettings["fontSize"],
                        }))
                      }
                    >
                      <option value="small">Compact (9.5 pt)</option>
                      <option value="medium">Standard (10.5 pt)</option>
                      <option value="large">Large (11.5 pt)</option>
                      <option value="extra-large">Extra Large (12.5 pt)</option>
                    </Select>
                  </div>

                  {/* Line Spacing */}
                  <div className="space-y-1">
                    <FieldLabel>Line Spacing</FieldLabel>
                    <Select
                      value={cv.settings.spacing}
                      onChange={(e) =>
                        updateSettings((s) => ({
                          ...s,
                          spacing: e.target.value as CvEditorSettings["spacing"],
                        }))
                      }
                    >
                      <option value="compact">Tight (1.32x)</option>
                      <option value="normal">Balanced (1.44x)</option>
                      <option value="relaxed">Relaxed (1.58x)</option>
                    </Select>
                  </div>

                  {/* Heading Style */}
                  <div className="space-y-1">
                    <FieldLabel>Heading Style</FieldLabel>
                    <Select
                      value={cv.settings.headingCase || "uppercase"}
                      onChange={(e) =>
                        updateSettings((s) => ({
                          ...s,
                          headingCase: e.target.value as "uppercase" | "titlecase",
                        }))
                      }
                    >
                      <option value="uppercase">UPPERCASE (Standard ATS)</option>
                      <option value="titlecase">Title Case (Modern)</option>
                    </Select>
                  </div>
                </div>
              </Card>

              {/* 3. SECTION ORDER & VISIBILITY */}
              <Card className="p-4 space-y-3">
                <h2 className="text-sm font-semibold text-[#173B30]">
                  Section Order & Visibility
                </h2>
                <div className="space-y-2">
                  {cv.settings.sectionOrder.map((key, idx) => {
                    const hidden = cv.settings.hiddenSections.includes(key);
                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between rounded-lg border border-[#E2DDD2] bg-[#F6F3ED]/60 px-3 py-2 text-xs"
                      >
                        <span className={cn("font-medium", hidden && "line-through text-[#77786F]")}>
                          {SECTION_LABELS[key]}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveSection(key, -1)}
                            disabled={idx === 0}
                            className="p-1 text-[#77786F] hover:text-[#252821] disabled:opacity-30 cursor-pointer"
                            title="Move up"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveSection(key, 1)}
                            disabled={idx === cv.settings.sectionOrder.length - 1}
                            className="p-1 text-[#77786F] hover:text-[#252821] disabled:opacity-30 cursor-pointer"
                            title="Move down"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleHiddenSection(key)}
                            className="p-1 text-[#77786F] hover:text-[#173B30] cursor-pointer"
                            title={hidden ? "Show section" : "Hide section"}
                          >
                            {hidden ? (
                              <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}

          {/* TAB 3: ATS QUALITY CHECKER */}
          {leftTab === "quality" && (
            <Card className="p-5 space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-[#173B30] dark:text-[#A7F3D0]">
                    Structural &amp; ATS Quality Check ({qualityReport.passedCount} of{" "}
                    {qualityReport.totalCount} checks passed)
                  </h2>
                  {qualityReport.passedCount < qualityReport.totalCount && (
                    <span className="rounded-full bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                      {qualityReport.totalCount - qualityReport.passedCount} Needs Action
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[#77786F] dark:text-[#94A3B8]">
                  {qualityReport.methodologyNote} Click any caution signal to jump directly to where attention is needed in your CV.
                </p>
              </div>

              <div className="space-y-3">
                {qualityReport.checks.map((chk) => {
                  if (chk.passed) {
                    return (
                      <div
                        key={chk.id}
                        className="flex items-start gap-2.5 rounded-xl border border-emerald-200/80 dark:border-emerald-900/40 bg-[#FFFEFA] dark:bg-[#161B26] p-3 text-xs"
                      >
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#252821] dark:text-white">{chk.label}</p>
                          <p className="mt-0.5 text-[#77786F] dark:text-[#94A3B8]">{chk.note}</p>
                        </div>
                      </div>
                    );
                  }

                  // CAUTION SIGNAL SPOT: Interactive & Clickable
                  return (
                    <div
                      key={chk.id}
                      className="rounded-xl border-2 border-amber-400 dark:border-amber-600 bg-amber-50/70 dark:bg-amber-950/30 p-3.5 text-xs transition-all shadow-[0_2px_8px_rgba(245,158,11,0.12)] space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          {/* Clickable Caution Signal Spot */}
                          <button
                            type="button"
                            onClick={() => handleJumpToCautionSection(chk)}
                            title="Click to jump to where this needs attention in your CV editor"
                            className="cursor-pointer group flex items-center gap-1.5 rounded-md bg-amber-200/90 dark:bg-amber-900/60 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-950 dark:text-amber-200 border border-amber-400 hover:bg-amber-300 dark:hover:bg-amber-800 transition-all shrink-0 mt-0.5"
                          >
                            <AlertCircle className="h-3.5 w-3.5 text-amber-800 dark:text-amber-300 shrink-0 group-hover:scale-110 transition-transform" />
                            <span>NEEDS ATTENTION</span>
                          </button>
                          <div>
                            <p className="font-bold text-[#111111] dark:text-white text-xs">{chk.label}</p>
                            <p className="mt-0.5 text-amber-950 dark:text-amber-200/90">{chk.note}</p>
                          </div>
                        </div>

                        {/* Action Button: No arrows */}
                        <button
                          type="button"
                          onClick={() => handleJumpToCautionSection(chk)}
                          className="shrink-0 rounded-lg border border-black dark:border-white/30 bg-black dark:bg-white text-white dark:text-black px-2.5 py-1 text-[11px] font-tech font-bold uppercase hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all cursor-pointer shadow-[1.5px_1.5px_0px_#000]"
                        >
                          SHOW IN EDITOR
                        </button>
                      </div>

                      {/* Detailed Breakdown: Exactly where needs attention */}
                      {chk.attentionDetails && chk.attentionDetails.length > 0 && (
                        <div className="rounded-lg border border-amber-300/80 dark:border-amber-700/60 bg-white/90 dark:bg-[#121620] p-2.5 text-[11px] space-y-1.5">
                          <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-300 text-[10px] uppercase tracking-wider">
                            <span>Where Attention Is Needed:</span>
                            <span className="font-normal lowercase text-[#77786F] dark:text-[#94A3B8]">
                              click above to edit directly
                            </span>
                          </div>
                          <ul className="space-y-1 text-neutral-800 dark:text-neutral-200">
                            {chk.attentionDetails.map((detail, idx) => (
                              <li key={idx} className="flex items-start gap-1.5 leading-snug">
                                <span className="text-amber-600 font-bold">•</span>
                                <span>{detail}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* TAB 4: JOB-SPECIFIC TAILORING */}
          {leftTab === "tailor" && (
            <Card className="p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/10 dark:border-white/10 pb-3">
                <div>
                  <h2 className="text-sm font-semibold text-[#173B30] dark:text-[#A7F3D0]">
                    Tailor CV to a Job Description
                  </h2>
                  <p className="mt-0.5 text-xs text-[#77786F] dark:text-[#94A3B8]">
                    Compare your CV against a target role. Missing qualifications are flagged honestly.
                  </p>
                </div>

                {/* ATS Engine Selector */}
                {systemAtsMode === "user_choice" ? (
                  <div className="flex items-center gap-1 p-1 rounded-xl border border-black/10 dark:border-[#333C52] bg-[#F3F4F6] dark:bg-[#1E2536] text-[11px] font-bold self-start sm:self-auto select-none">
                    <button
                      type="button"
                      onClick={() => setAtsEngineChoice("hardcoded")}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer",
                        atsEngineChoice === "hardcoded"
                          ? "bg-white dark:bg-[#111111] text-[#111111] dark:text-white shadow-xs border border-black/10 dark:border-[#333C52]"
                          : "text-[#77786F] dark:text-[#94A3B8] hover:text-[#111111] dark:hover:text-white"
                      )}
                    >
                      <Cpu className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Rule-Based (No AI)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAtsEngineChoice("ai")}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer",
                        atsEngineChoice === "ai"
                          ? "bg-white dark:bg-[#111111] text-[#111111] dark:text-white shadow-xs border border-black/10 dark:border-[#333C52]"
                          : "text-[#77786F] dark:text-[#94A3B8] hover:text-[#111111] dark:hover:text-white"
                      )}
                    >
                      <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                      <span>AI Engine</span>
                    </button>
                  </div>
                ) : systemAtsMode === "deterministic_only" ? (
                  <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <Cpu className="h-3.5 w-3.5" />
                    <span>Rule-Based ATS Enforced</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 px-2.5 py-1 text-[11px] font-bold text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>AI Engine Enforced</span>
                  </div>
                )}
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2">
                <Input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Target job title"
                />
                <Input
                  value={jobCompany}
                  onChange={(e) => setJobCompany(e.target.value)}
                  placeholder="Company (optional)"
                />
              </div>
              <Textarea
                rows={5}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here..."
              />

              <Button
                variant="primary"
                className="w-full"
                disabled={aiBusy === "tailor"}
                onClick={handleAnalyzeJob}
              >
                <Target className="h-4 w-4" />
                {aiBusy === "tailor"
                  ? "Comparing role..."
                  : atsEngineChoice === "hardcoded"
                    ? "Analyze role with Rule-Based ATS (Instant)"
                    : "Analyze role with AI Writing Engine"}
              </Button>

              {deterministicMatch && (
                <div className="space-y-2 rounded-lg border border-[#E2DDD2] bg-[#F6F3ED] p-3.5 text-xs">
                  <p className="font-semibold text-[#252821]">Keyword & Requirement Snapshot</p>
                  <p className="text-[#173B30]">
                    <span className="font-semibold">Present in your CV: </span>
                    {deterministicMatch.matchedKeywords.join(", ") || "None matched yet"}
                  </p>
                  <p className="text-amber-900">
                    <span className="font-semibold">Missing / unconfirmed: </span>
                    {deterministicMatch.missingOrUnconfirmedKeywords.join(", ") || "None"}
                  </p>
                </div>
              )}

              {tailorResult && (
                <div className="space-y-3 border-t border-[#E2DDD2] pt-3">
                  <p className="text-xs text-[#77786F]">{tailorResult.transparencyNotice}</p>
                  {tailorResult.suggestions.map((s) => (
                    <div
                      key={s.id}
                      className="rounded-lg border border-[#E2DDD2] bg-[#FFFEFA] p-3 text-xs space-y-2"
                    >
                      <p className="font-semibold text-[#173B30]">{s.targetSection}</p>
                      <p className="text-[#77786F]">{s.rationale}</p>
                      <p className="rounded bg-[#F6F3ED] p-2 text-[#252821]">{s.suggestedText}</p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={s.status === "accepted" ? "primary" : "outline"}
                          onClick={() =>
                            setTailorResult((prev) =>
                              prev
                                ? {
                                  ...prev,
                                  suggestions: prev.suggestions.map((it) =>
                                    it.id === s.id ? { ...it, status: "accepted" } : it
                                  ),
                                }
                                : prev
                            )
                          }
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setTailorResult((prev) =>
                              prev
                                ? {
                                  ...prev,
                                  suggestions: prev.suggestions.map((it) =>
                                    it.id === s.id ? { ...it, status: "rejected" } : it
                                  ),
                                }
                                : prev
                            )
                          }
                        >
                          Skip
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Button variant="secondary" className="w-full" onClick={handleCreateTailoredCopy}>
                    Save as separate tailored CV version
                  </Button>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* RIGHT PANEL: Live Document Preview */}
        <div
          className={cn(
            "lg:col-span-7 lg:sticky lg:top-6",
            mobileView === "edit" ? "hidden lg:block" : "block"
          )}
        >
          <div className="rounded-2xl border border-[#D4CFC3] dark:border-[#333C52] bg-[#EAE5DA] dark:bg-[#191D2B] p-3 sm:p-6 shadow-inner">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[#77786F] dark:text-[#94A3B8]">
              <div>
                <span>Live Preview · Synchronized with PDF & DOCX export</span>
                <span className="ml-2 font-medium text-[#252821] dark:text-white">
                  ({TEMPLATE_METADATA.find((t) => t.id === cv.templateId)?.name})
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {([75, 90, 100] as const).map((scale) => (
                  <button
                    key={scale}
                    type="button"
                    onClick={() => setPreviewScale(scale)}
                    className={cn(
                      "rounded-md px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer",
                      previewScale === scale
                        ? "bg-[#173B30] text-[#FFFEFA] dark:bg-amber-400 dark:text-black dark:font-bold"
                        : "bg-[#FFFEFA] dark:bg-[#242A3D] text-[#77786F] dark:text-[#CBD5E1] hover:text-[#252821] dark:hover:text-white border border-transparent dark:border-white/10"
                    )}
                  >
                    {scale}%
                  </button>
                ))}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleExport("pdf")}
                  className="h-7 px-2.5 text-[11px]"
                >
                  <Download className="h-3 w-3" />
                  <span>Export PDF</span>
                  {!hasActiveSubscription && <Lock className="h-2.5 w-2.5 text-amber-600 dark:text-amber-400 ml-0.5" />}
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <div
                style={{
                  transform: `scale(${previewScale / 100})`,
                  transformOrigin: "top center",
                }}
              >
                <CvDocumentPreview
                  cv={cv.structuredContent}
                  templateId={cv.templateId}
                  settings={cv.settings}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <SubscriptionRequiredModal
        open={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        cvId={cv.id}
        format={requestedExportFormat}
      />
    </div>
  );
}
