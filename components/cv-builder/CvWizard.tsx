"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Eye,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FieldLabel, Input, Select, Textarea } from "@/components/ui/input";
import { CvDocumentPreview } from "@/components/templates/CvDocumentPreview";
import {
  CAREER_PROFILES,
  NIGERIAN_AND_INTL_QUALIFICATIONS,
  NO_EXPERIENCE_CATEGORIES,
  SKILL_CATEGORIES,
  createDefaultEditorSettings,
  createEmptyStructuredCv,
  getRecommendedTemplateForProfile,
} from "@/lib/cv/defaults";
import { cn, createId } from "@/lib/utils";
import type {
  AlternativeExperienceItem,
  CareerProfile,
  CertificationItem,
  CvEditorSettings,
  CvRecord,
  EducationItem,
  ProjectItem,
  SkillCategory,
  StructuredCvContent,
  TemplateId,
  WorkExperienceItem,
} from "@/types/cv";

export type WizardStepKey =
  | "profile"
  | "personal-information"
  | "summary"
  | "education"
  | "experience"
  | "skills"
  | "projects";

const STEPS: { key: WizardStepKey; label: string; shortLabel: string; optional?: boolean }[] = [
  { key: "profile", label: "Career profile", shortLabel: "1. Profile" },
  { key: "personal-information", label: "Personal details", shortLabel: "2. Contact" },
  { key: "summary", label: "Professional summary", shortLabel: "3. Summary", optional: true },
  { key: "education", label: "Education", shortLabel: "4. Education" },
  { key: "experience", label: "Experience / Pathway", shortLabel: "5. Experience" },
  { key: "skills", label: "Skills", shortLabel: "6. Skills" },
  { key: "projects", label: "Projects, Certs & Review", shortLabel: "7. Finish" },
];

export function CvWizard({ initialStep = "profile" }: { initialStep?: WizardStepKey }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryCvId = searchParams.get("cvId");

  const [step, setStep] = useState<WizardStepKey>(initialStep);
  const [cvId, setCvId] = useState<string | null>(queryCvId);
  const [title, setTitle] = useState("My Vitra CV");
  const [careerProfile, setCareerProfile] = useState<CareerProfile>("recent-graduate");
  const [templateId, setTemplateId] = useState<TemplateId>("graduate-entry");
  const [content, setContent] = useState<StructuredCvContent>(() => createEmptyStructuredCv("Nigeria"));
  const [settings, setSettings] = useState<CvEditorSettings>(() =>
    createDefaultEditorSettings("recent-graduate")
  );

  const [loadingDraft, setLoadingDraft] = useState<boolean>(Boolean(queryCvId));
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [stepError, setStepError] = useState<string | null>(null);

  // AI states
  const [aiBusy, setAiBusy] = useState<string | null>(null);
  const [aiNotice, setAiNotice] = useState<{ type: "info" | "error"; text: string } | null>(null);
  const [suggestedSkills, setSuggestedSkills] = useState<
    { name: string; category: SkillCategory; reason: string }[]
  >([]);

  // Custom skill input
  const [customSkillName, setCustomSkillName] = useState("");
  const [customSkillCat, setCustomSkillCat] = useState<SkillCategory>("technical");

  // Live preview modal & bullet draft inputs
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [achievementDrafts, setAchievementDrafts] = useState<Record<string, string>>({});
  const [quotaModal, setQuotaModal] = useState<{ open: boolean; message: string } | null>(null);

  // Summary helper context
  const sumCtx = content.summaryContext || {
    background: "",
    strengths: "",
    interests: "",
    relevantExperience: "",
    targetRole: "",
  };

  const [initialLoaded, setInitialLoaded] = useState(false);
  const [resumePrompt, setResumePrompt] = useState<{ id: string; title: string; updatedAt: string } | null>(null);
  const hasUserModified = useRef(false);
  const hasLoadedInitialDraft = useRef(false);

  // Sync internal step state if parent or route changes initialStep
  useEffect(() => {
    if (initialStep && initialStep !== step) {
      setStep(initialStep);
    }
  }, [initialStep]);

  // Handle browser back/forward buttons (popstate)
  useEffect(() => {
    const onPopState = () => {
      const pathParts = window.location.pathname.split("/");
      const stepFromPath = pathParts[pathParts.length - 1] as WizardStepKey;
      const validSteps: WizardStepKey[] = [
        "profile",
        "personal-information",
        "summary",
        "education",
        "experience",
        "skills",
        "projects",
      ];
      if (validSteps.includes(stepFromPath)) {
        setStep(stepFromPath);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Load existing draft ONCE on initial mount if cvId is present in URL or cached in session
  useEffect(() => {
    if (hasLoadedInitialDraft.current) return;
    hasLoadedInitialDraft.current = true;

    let effectiveCvId = queryCvId;
    if (!effectiveCvId && typeof window !== "undefined") {
      effectiveCvId = sessionStorage.getItem("vitra_active_cv_id");
    }

    // Try restoring immediately from local session draft cache if available
    if (typeof window !== "undefined" && effectiveCvId) {
      try {
        const cachedStr = sessionStorage.getItem(`vitra_cv_draft_${effectiveCvId}`);
        if (cachedStr) {
          const cached = JSON.parse(cachedStr);
          if (cached?.content) {
            setContent(cached.content);
            if (cached.careerProfile) setCareerProfile(cached.careerProfile);
            if (cached.templateId) setTemplateId(cached.templateId);
            if (cached.settings) setSettings(cached.settings);
            if (cached.title) setTitle(cached.title);
            setCvId(effectiveCvId);
          }
        }
      } catch {}
    }

    if (!effectiveCvId) {
      setInitialLoaded(true);
      // Check if user has an existing unfinished draft they can resume
      fetch("/api/cvs")
        .then((r) => r.json())
        .then((d) => {
          if (d.ok && Array.isArray(d.cvs)) {
            const draft = d.cvs.find((c: CvRecord) => c.status === "draft");
            if (draft) {
              setResumePrompt({ id: draft.id, title: draft.title, updatedAt: draft.updatedAt });
            }
          }
        })
        .catch(() => { });
      return;
    }

    fetch(`/api/cvs/${effectiveCvId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && d.cv) {
          const rec = d.cv as CvRecord;
          setCvId(rec.id);
          setTitle(rec.title);
          setCareerProfile(rec.careerProfile);
          setTemplateId(rec.templateId);
          setContent(rec.structuredContent);
          setSettings(rec.settings);
          if (typeof window !== "undefined") {
            sessionStorage.setItem("vitra_active_cv_id", rec.id);
            try {
              sessionStorage.setItem(
                `vitra_cv_draft_${rec.id}`,
                JSON.stringify({
                  content: rec.structuredContent,
                  careerProfile: rec.careerProfile,
                  templateId: rec.templateId,
                  settings: rec.settings,
                  title: rec.title,
                  updatedAt: Date.now(),
                })
              );
            } catch {}
            if (!queryCvId) {
              window.history.replaceState(null, "", `/create/${step}?cvId=${rec.id}`);
            }
          }
        } else {
          // Non-existent or invalid draft ID, clear it
          setCvId(null);
          if (typeof window !== "undefined") {
            sessionStorage.removeItem("vitra_active_cv_id");
          }
        }
      })
      .catch(() => {
        setCvId(null);
      })
      .finally(() => {
        setLoadingDraft(false);
        setTimeout(() => setInitialLoaded(true), 400);
      });
  }, [queryCvId]);

  // Pre-fill user's name and email on brand-new CV if empty
  useEffect(() => {
    if (queryCvId) return;
    fetch("/api/account")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && d.user) {
          setContent((prev) => ({
            ...prev,
            personalInfo: {
              ...prev.personalInfo,
              fullName: prev.personalInfo.fullName || d.user.fullName || "",
              email: prev.personalInfo.email || d.user.email || "",
              country: prev.personalInfo.country || d.user.country || "Nigeria",
            },
          }));
        }
      })
      .catch(() => { });
  }, [queryCvId]);

  const persistCv = useCallback(
    async (
      nextContent: StructuredCvContent,
      nextProfile: CareerProfile,
      nextTemplate: TemplateId,
      nextSettings: CvEditorSettings,
      nextTitle: string
    ): Promise<string | null> => {
      setSaveState("saving");
      try {
        if (!cvId) {
          const res = await fetch("/api/cvs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: nextTitle,
              careerProfile: nextProfile,
              templateId: nextTemplate,
              structuredContent: nextContent,
              settings: nextSettings,
              status: "draft",
            }),
          });
          const data = await res.json();
          if (!res.ok || !data.cv) {
            setSaveState("error");
            if (data.limitReached) {
              setQuotaModal({ open: true, message: data.error });
            }
            return null;
          }
          const createdId = data.cv.id as string;
          setCvId(createdId);
          setSaveState("saved");
          if (typeof window !== "undefined") {
            sessionStorage.setItem("vitra_active_cv_id", createdId);
            try {
              sessionStorage.setItem(
                `vitra_cv_draft_${createdId}`,
                JSON.stringify({
                  content: nextContent,
                  careerProfile: nextProfile,
                  templateId: nextTemplate,
                  settings: nextSettings,
                  title: nextTitle,
                  updatedAt: Date.now(),
                })
              );
            } catch {}
          }
          window.history.replaceState(null, "", `/create/${step}?cvId=${createdId}`);
          return createdId;
        } else {
          const res = await fetch(`/api/cvs/${cvId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: nextTitle,
              careerProfile: nextProfile,
              templateId: nextTemplate,
              structuredContent: nextContent,
              settings: nextSettings,
            }),
          });
          if (!res.ok) {
            if (res.status === 404) {
              // Target CV ID not found on server; create as fresh draft
              const createRes = await fetch("/api/cvs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  title: nextTitle,
                  careerProfile: nextProfile,
                  templateId: nextTemplate,
                  structuredContent: nextContent,
                  settings: nextSettings,
                  status: "draft",
                }),
              });
              const createData = await createRes.json();
              if (createRes.ok && createData.cv) {
                const newId = createData.cv.id as string;
                setCvId(newId);
                setSaveState("saved");
                if (typeof window !== "undefined") {
                  sessionStorage.setItem("vitra_active_cv_id", newId);
                  try {
                    sessionStorage.setItem(
                      `vitra_cv_draft_${newId}`,
                      JSON.stringify({
                        content: nextContent,
                        careerProfile: nextProfile,
                        templateId: nextTemplate,
                        settings: nextSettings,
                        title: nextTitle,
                        updatedAt: Date.now(),
                      })
                    );
                  } catch {}
                }
                window.history.replaceState(null, "", `/create/${step}?cvId=${newId}`);
                return newId;
              }
            }
            setSaveState("error");
            return cvId;
          }
          setSaveState("saved");
          if (typeof window !== "undefined" && cvId) {
            sessionStorage.setItem("vitra_active_cv_id", cvId);
            try {
              sessionStorage.setItem(
                `vitra_cv_draft_${cvId}`,
                JSON.stringify({
                  content: nextContent,
                  careerProfile: nextProfile,
                  templateId: nextTemplate,
                  settings: nextSettings,
                  title: nextTitle,
                  updatedAt: Date.now(),
                })
              );
            } catch {}
          }
          return cvId;
        }
      } catch {
        setSaveState("error");
        return cvId;
      }
    },
    [cvId, step]
  );

  const dynamicTitle = useMemo(() => {
    const name = content.personalInfo.fullName?.trim();
    const role = content.personalInfo.professionalTitle?.trim() || sumCtx.targetRole?.trim();
    if (name && role) return `${name} - ${role}`;
    if (name) return `${name}'s CV`;
    if (role) return `${role} CV Draft`;
    return title && title !== "My Vitra CV" ? title : "My Vitra CV";
  }, [content.personalInfo.fullName, content.personalInfo.professionalTitle, sumCtx.targetRole, title]);

  useEffect(() => {
    if (initialLoaded) {
      hasUserModified.current = true;
    }
  }, [content, careerProfile, templateId, settings, initialLoaded]);

  // Debounced autosave: automatically provisions and updates drafts
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (loadingDraft || !initialLoaded || !hasUserModified.current) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      persistCv(content, careerProfile, templateId, settings, dynamicTitle);
    }, 1200);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [content, careerProfile, templateId, settings, dynamicTitle, cvId, loadingDraft, initialLoaded, persistCv]);

  // Immediate flush whenever user switches tabs or navigates away
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && initialLoaded && !loadingDraft && hasUserModified.current) {
        persistCv(content, careerProfile, templateId, settings, dynamicTitle);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [content, careerProfile, templateId, settings, dynamicTitle, initialLoaded, loadingDraft, persistCv]);

  const currentIdx = STEPS.findIndex((s) => s.key === step);

  const previewCv = useMemo(() => {
    const cloned = JSON.parse(JSON.stringify(content)) as StructuredCvContent;
    // Populate professional title from target role if not explicitly set
    if (!cloned.personalInfo.professionalTitle?.trim() && sumCtx.targetRole?.trim()) {
      cloned.personalInfo.professionalTitle = sumCtx.targetRole.trim();
    }
    // If summary is not generated/typed yet, compose live draft preview from prompt inputs
    if (!cloned.summary.trim()) {
      const summaryParts = [
        sumCtx.targetRole?.trim() ? `Aspiring ${sumCtx.targetRole.trim()}` : "",
        sumCtx.background?.trim() ? `with a strong background in ${sumCtx.background.trim()}` : "",
        sumCtx.strengths?.trim() ? `Key strengths: ${sumCtx.strengths.trim()}` : "",
        sumCtx.relevantExperience?.trim() ? `Practical experience includes ${sumCtx.relevantExperience.trim()}` : "",
      ].filter(Boolean);
      if (summaryParts.length > 0) {
        cloned.summary = summaryParts.join(". ").replace(/\.\./g, ".") + ".";
      }
    }
    return cloned;
  }, [content, sumCtx]);

  async function goToStep(targetStep: WizardStepKey, validateCurrent = true) {
    setStepError(null);
    setAiNotice(null);

    if (validateCurrent && step === "personal-information") {
      if (!content.personalInfo.fullName.trim() || !content.personalInfo.email.trim()) {
        setStepError("Please provide at least your full name and email address to continue.");
        return;
      }
      if (!content.personalInfo.phone.trim() || !content.personalInfo.city.trim()) {
        setStepError("Please enter your telephone number and city.");
        return;
      }
    }

    const savedId = await persistCv(content, careerProfile, templateId, settings, dynamicTitle);
    setStep(targetStep);
    const idParam = savedId ? `?cvId=${savedId}` : "";
    window.history.pushState(null, "", `/create/${targetStep}${idParam}`);
  }

  async function handleFinishToEditor() {
    const finalTitle = dynamicTitle;
    const savedId = await persistCv(content, careerProfile, templateId, settings, finalTitle);
    if (savedId) {
      await fetch(`/api/cvs/${savedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "complete", title: finalTitle }),
      });
      router.push(`/editor/${savedId}`);
    }
  }

  // AI handlers
  async function handleGenerateSummary() {
    setAiBusy("summary");
    setAiNotice(null);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "summary",
          careerProfile,
          targetRole: sumCtx.targetRole || content.personalInfo.professionalTitle,
          background: sumCtx.background,
          strengths: sumCtx.strengths,
          interests: sumCtx.interests,
          relevantExperience: sumCtx.relevantExperience,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setAiNotice({
          type: "error",
          text:
            data.error ||
            "AI summary generation is unavailable right now. You can write or edit your summary manually below.",
        });
      } else {
        setContent((prev) => ({ ...prev, summary: data.data.summary }));
        if (data.data.missingDetailsNote) {
          setAiNotice({ type: "info", text: data.data.missingDetailsNote });
        }
      }
    } catch {
      setAiNotice({ type: "error", text: "Network error contacting AI service." });
    } finally {
      setAiBusy(null);
    }
  }

  async function handleImproveWork(exp: WorkExperienceItem) {
    if (!exp.responsibilities.trim()) {
      setAiNotice({
        type: "error",
        text: "Write a short plain description of what you did first, then click Improve with AI.",
      });
      return;
    }
    setAiBusy(exp.id);
    setAiNotice(null);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "improve-work",
          jobTitle: exp.jobTitle || "Team Member",
          company: exp.company,
          rawDescription: exp.responsibilities,
          existingAchievements: exp.achievements,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setAiNotice({ type: "error", text: data.error || "Unable to reach AI assistant." });
      } else {
        setContent((prev) => ({
          ...prev,
          experience: prev.experience.map((item) =>
            item.id === exp.id
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
        if (data.data.clarificationQuestions?.length > 0) {
          setAiNotice({
            type: "info",
            text: `Optional note from AI: ${data.data.clarificationQuestions.join(" ")}`,
          });
        }
      }
    } catch {
      setAiNotice({ type: "error", text: "Network error contacting AI assistant." });
    } finally {
      setAiBusy(null);
    }
  }

  async function handleSuggestSkills() {
    setAiBusy("skills");
    setAiNotice(null);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "suggest-skills", cv: content }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setAiNotice({ type: "error", text: data.error || "Could not fetch AI skill suggestions." });
      } else {
        setSuggestedSkills(data.data.recommendedSkills || []);
      }
    } catch {
      setAiNotice({ type: "error", text: "Network error contacting AI assistant." });
    } finally {
      setAiBusy(null);
    }
  }

  function toggleSkill(name: string, category: SkillCategory) {
    setContent((prev) => {
      const exists = prev.skills.some(
        (s) => s.name.toLowerCase() === name.toLowerCase()
      );
      if (exists) {
        return {
          ...prev,
          skills: prev.skills.filter((s) => s.name.toLowerCase() !== name.toLowerCase()),
        };
      }
      return {
        ...prev,
        skills: [...prev.skills, { id: createId(), name, category }],
      };
    });
  }

  if (loadingDraft) {
    return (
      <Card className="mx-auto max-w-3xl p-10 text-center text-sm text-[#77786F]">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#173B30]" />
        <p className="mt-3">Restoring your saved CV draft...</p>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Top Progress Bar & Save Indicator */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#173B30]">
            Guided CV Builder · Step {currentIdx + 1} of {STEPS.length}
          </p>
          <h1 className="mt-1 font-editorial text-2xl text-[#252821] sm:text-3xl">
            {STEPS[currentIdx].label}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {saveState === "saving" && (
            <Badge variant="neutral">
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              Saving...
            </Badge>
          )}
          {saveState === "saved" && (
            <Badge variant="forest">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Progress saved
            </Badge>
          )}
          {saveState === "error" && <Badge variant="danger">Save failed</Badge>}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPreviewModal(true)}
          >
            <Eye className="h-3.5 w-3.5" />
            Preview CV
          </Button>
        </div>
      </div>

      {/* Unfinished Draft Resume Prompt */}
      {resumePrompt && !cvId && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border-2 border-[#173B30] dark:border-[#34D399] bg-[#E8F5E9] dark:bg-[#0E2E23] p-4 text-xs font-tech shadow-sticker-sm">
          <div>
            <p className="font-bold text-[#173B30] dark:text-[#34D399]">
              Continue previous draft: <span className="underline">{resumePrompt.title}</span>?
            </p>
            <p className="text-[#55564E] dark:text-[#CBD5E1] text-[11px] mt-0.5">
              You were recently working on this CV. You can resume where you left off or start fresh.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              size="sm"
              variant="primary"
              onClick={() => {
                const targetId = resumePrompt.id;
                setCvId(targetId);
                if (typeof window !== "undefined") {
                  sessionStorage.setItem("vitra_active_cv_id", targetId);
                }
                setResumePrompt(null);
                setLoadingDraft(true);
                fetch(`/api/cvs/${targetId}`)
                  .then((r) => r.json())
                  .then((d) => {
                    if (d.ok && d.cv) {
                      const rec = d.cv as CvRecord;
                      setCvId(rec.id);
                      setTitle(rec.title);
                      setCareerProfile(rec.careerProfile);
                      setTemplateId(rec.templateId);
                      setContent(rec.structuredContent);
                      setSettings(rec.settings);
                      window.history.replaceState(null, "", `/create/${step}?cvId=${rec.id}`);
                    }
                  })
                  .finally(() => setLoadingDraft(false));
              }}
            >
              Resume draft
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                if (typeof window !== "undefined") {
                  sessionStorage.removeItem("vitra_active_cv_id");
                }
                setResumePrompt(null);
              }}
            >
              Start fresh
            </Button>
          </div>
        </div>
      )}

      {/* Clickable Stepper */}
      <nav aria-label="Wizard steps" className="grid grid-cols-2 gap-2 sm:grid-cols-7">
        {STEPS.map((s, idx) => {
          const active = s.key === step;
          const completed = idx < currentIdx;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => goToStep(s.key, idx > currentIdx)}
              className={cn(
                "rounded-lg border px-2.5 py-2 text-left text-xs font-medium transition-colors cursor-pointer",
                active
                  ? "border-[#173B30] bg-[#173B30] text-[#FFFEFA] dark:border-[#34D399] dark:bg-[#173B30] dark:text-white"
                  : completed
                    ? "border-[#173B30]/30 bg-[#FFFEFA] text-[#173B30] hover:border-[#173B30]/60 dark:border-[#34D399]/40 dark:bg-[#242A3D] dark:text-[#34D399] dark:hover:border-[#34D399]"
                    : "border-[#E2DDD2] bg-[#FFFEFA] text-[#77786F] hover:border-[#173B30]/40 dark:border-[#333C52] dark:bg-[#1E2333] dark:text-[#94A3B8] dark:hover:border-[#34D399]/50 dark:hover:text-[#E2E8F0]"
              )}
            >
              {s.shortLabel}
            </button>
          );
        })}
      </nav>

      {stepError && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-900 dark:text-red-200">
          {stepError}
        </div>
      )}

      {aiNotice && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${aiNotice.type === "error"
              ? "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200"
              : "border-[#173B30]/30 dark:border-[#34D399]/40 bg-[#173B30]/8 dark:bg-[#0E2E23]/60 text-[#173B30] dark:text-[#34D399]"
            }`}
        >
          {aiNotice.text}
        </div>
      )}

      {/* STEP 1: CAREER PROFILE */}
      {step === "profile" && (
        <Card className="p-6 sm:p-8 space-y-5">
          <div>
            <h2 className="font-semibold text-[#252821] dark:text-white">
              Which option best describes your current career situation?
            </h2>
            <p className="mt-1 text-sm text-[#77786F] dark:text-[#94A3B8]">
              Your answer helps Vitra tailor guidance, section order, and suggested templates.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {CAREER_PROFILES.map((prof) => {
              const selected = careerProfile === prof.id;
              return (
                <button
                  key={prof.id}
                  type="button"
                  onClick={() => {
                    setCareerProfile(prof.id);
                    const recTpl = getRecommendedTemplateForProfile(prof.id);
                    setTemplateId(recTpl);
                    setSettings(createDefaultEditorSettings(prof.id));
                    setContent((prev) => ({
                      ...prev,
                      hasFormalExperience: prof.defaultHasFormalExperience,
                    }));
                  }}
                  className={cn(
                    "rounded-xl border p-4 text-left transition-colors cursor-pointer",
                    selected
                      ? "border-[#173B30] bg-[#173B30]/5 ring-1 ring-[#173B30] dark:border-[#34D399] dark:bg-[#0E2E23]/60 dark:ring-[#34D399]"
                      : "border-[#E2DDD2] bg-[#FFFEFA] hover:border-[#173B30]/50 dark:border-[#333C52] dark:bg-[#1E2333] dark:hover:border-[#34D399]/50"
                  )}
                >
                  <p className="font-semibold text-sm text-[#252821] dark:text-white">{prof.label}</p>
                  <p className="mt-1 text-xs text-[#77786F] dark:text-[#94A3B8]">{prof.description}</p>
                </button>
              );
            })}
          </div>

          <div className="rounded-lg border border-[#E2DDD2] dark:border-[#333C52] bg-[#F6F3ED] dark:bg-[#1E2333] p-4 text-xs text-[#252821] dark:text-[#E2E8F0]">
            <span className="font-semibold text-[#173B30] dark:text-[#34D399]">Tailored guidance: </span>
            {CAREER_PROFILES.find((p) => p.id === careerProfile)?.guidance}
          </div>
        </Card>
      )}

      {/* STEP 2: PERSONAL INFORMATION */}
      {step === "personal-information" && (
        <Card className="p-6 sm:p-8 space-y-5">
          <div className="rounded-lg border border-[#C4A46B]/40 dark:border-[#C4A46B]/30 bg-[#F6F3ED] dark:bg-[#242A3D] px-4 py-3 text-xs text-[#252821] dark:text-[#E2E8F0]">
            Vitra intentionally omits sensitive or discriminatory fields such as date of birth,
            gender, marital status, religion, and photographs so employers focus on your capability.
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="pi-name" required>
                Full name
              </FieldLabel>
              <Input
                id="pi-name"
                autoComplete="name"
                value={content.personalInfo.fullName}
                onChange={(e) =>
                  setContent((p) => ({
                    ...p,
                    personalInfo: { ...p.personalInfo, fullName: e.target.value },
                  }))
                }
                placeholder="e.g. Tunde Adebayo"
              />
            </div>

            <div>
              <FieldLabel htmlFor="pi-title" hint="Optional">
                Target / professional title
              </FieldLabel>
              <Input
                id="pi-title"
                autoComplete="organization-title"
                value={content.personalInfo.professionalTitle}
                onChange={(e) =>
                  setContent((p) => ({
                    ...p,
                    personalInfo: { ...p.personalInfo, professionalTitle: e.target.value },
                  }))
                }
                placeholder="e.g. Administrative Officer or Junior Analyst"
              />
            </div>

            <div>
              <FieldLabel htmlFor="pi-email" required>
                Professional email
              </FieldLabel>
              <Input
                id="pi-email"
                type="email"
                autoComplete="email"
                spellCheck={false}
                value={content.personalInfo.email}
                onChange={(e) =>
                  setContent((p) => ({
                    ...p,
                    personalInfo: { ...p.personalInfo, email: e.target.value },
                  }))
                }
                placeholder="tunde.adebayo@example.com"
              />
            </div>

            <div>
              <FieldLabel htmlFor="pi-phone" required hint="Supports +234 & intl">
                Telephone number
              </FieldLabel>
              <Input
                id="pi-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={content.personalInfo.phone}
                onChange={(e) =>
                  setContent((p) => ({
                    ...p,
                    personalInfo: { ...p.personalInfo, phone: e.target.value },
                  }))
                }
                placeholder="+234 803 123 4567"
              />
            </div>

            <div>
              <FieldLabel htmlFor="pi-city" required>
                City
              </FieldLabel>
              <Input
                id="pi-city"
                autoComplete="address-level2"
                value={content.personalInfo.city}
                onChange={(e) =>
                  setContent((p) => ({
                    ...p,
                    personalInfo: { ...p.personalInfo, city: e.target.value },
                  }))
                }
                placeholder="e.g. Lagos, Abuja, Port Harcourt"
              />
            </div>

            <div>
              <FieldLabel htmlFor="pi-country" required>
                Country
              </FieldLabel>
              <Input
                id="pi-country"
                autoComplete="country-name"
                value={content.personalInfo.country}
                onChange={(e) =>
                  setContent((p) => ({
                    ...p,
                    personalInfo: { ...p.personalInfo, country: e.target.value },
                  }))
                }
                placeholder="Nigeria"
              />
            </div>

            <div>
              <FieldLabel htmlFor="pi-linkedin" hint="Optional">
                LinkedIn profile URL
              </FieldLabel>
              <Input
                id="pi-linkedin"
                type="url"
                inputMode="url"
                spellCheck={false}
                value={content.personalInfo.linkedinUrl}
                onChange={(e) =>
                  setContent((p) => ({
                    ...p,
                    personalInfo: { ...p.personalInfo, linkedinUrl: e.target.value },
                  }))
                }
                placeholder="linkedin.com/in/yourname"
              />
            </div>

            <div>
              <FieldLabel htmlFor="pi-portfolio" hint="Optional">
                Portfolio / personal website URL
              </FieldLabel>
              <Input
                id="pi-portfolio"
                type="url"
                inputMode="url"
                spellCheck={false}
                value={content.personalInfo.portfolioUrl}
                onChange={(e) =>
                  setContent((p) => ({
                    ...p,
                    personalInfo: { ...p.personalInfo, portfolioUrl: e.target.value },
                  }))
                }
                placeholder="https://yourportfolio.com"
              />
            </div>
          </div>
        </Card>
      )}

      {/* STEP 3: PROFESSIONAL SUMMARY */}
      {step === "summary" && (
        <Card className="p-6 sm:p-8 space-y-5">
          <div>
            <h2 className="font-semibold text-[#252821] dark:text-white">Tell us about your focus</h2>
            <p className="mt-1 text-sm text-[#77786F] dark:text-[#94A3B8]">
              Answer a few brief prompts and let Vitra draft a clear professional summary you can
              review and edit, or write your summary directly.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="sum-role">Target role</FieldLabel>
              <Input
                id="sum-role"
                value={sumCtx.targetRole}
                onChange={(e) =>
                  setContent((p) => ({
                    ...p,
                    summaryContext: { ...sumCtx, targetRole: e.target.value },
                  }))
                }
                placeholder="e.g. Graduate Accounting Trainee"
              />
            </div>
            <div>
              <FieldLabel htmlFor="sum-bg">Your academic or work background</FieldLabel>
              <Input
                id="sum-bg"
                value={sumCtx.background}
                onChange={(e) =>
                  setContent((p) => ({
                    ...p,
                    summaryContext: { ...sumCtx, background: e.target.value },
                  }))
                }
                placeholder="e.g. BSc Accounting graduate, completed NYSC"
              />
            </div>
            <div>
              <FieldLabel htmlFor="sum-strengths">Main strengths</FieldLabel>
              <Input
                id="sum-strengths"
                value={sumCtx.strengths}
                onChange={(e) =>
                  setContent((p) => ({
                    ...p,
                    summaryContext: { ...sumCtx, strengths: e.target.value },
                  }))
                }
                placeholder="e.g. Attention to detail, Excel reporting, organization"
              />
            </div>
            <div>
              <FieldLabel htmlFor="sum-exp">Relevant experience or training</FieldLabel>
              <Input
                id="sum-exp"
                value={sumCtx.relevantExperience}
                onChange={(e) =>
                  setContent((p) => ({
                    ...p,
                    summaryContext: { ...sumCtx, relevantExperience: e.target.value },
                  }))
                }
                placeholder="e.g. 6-month SIWES at an audit firm"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleGenerateSummary}
              disabled={aiBusy === "summary"}
            >
              <Sparkles className="h-4 w-4" />
              {aiBusy === "summary" ? "Generating..." : "Generate professional summary"}
            </Button>
            <span className="text-xs text-[#77786F] dark:text-[#94A3B8]">
              Uses only the details you entered above—never invents credentials.
            </span>
          </div>

          <div>
            <FieldLabel htmlFor="sum-final" hint="Editable preview">
              Your CV summary
            </FieldLabel>
            <Textarea
              id="sum-final"
              rows={4}
              value={content.summary}
              onChange={(e) => setContent((p) => ({ ...p, summary: e.target.value }))}
              placeholder="Write or review a concise 2–4 sentence professional summary..."
            />
          </div>
        </Card>
      )}

      {/* STEP 4: EDUCATION */}
      {step === "education" && (
        <Card className="p-6 sm:p-8 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-[#252821] dark:text-white">Academic & Professional Education</h2>
              <p className="mt-1 text-sm text-[#77786F] dark:text-[#94A3B8]">
                Supports SSCE, ND, HND, BSc, BA, BEng, MSc, MBA, PhD, ICAN/ACCA/CIPM and
                international equivalents.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const newItem: EducationItem = {
                  id: createId(),
                  institution: "",
                  qualification: "BSc (Bachelor of Science)",
                  fieldOfStudy: "",
                  startDate: "",
                  endDate: "",
                  isCurrent: false,
                  achievements: "",
                };
                setContent((p) => ({ ...p, education: [...p.education, newItem] }));
              }}
            >
              <Plus className="h-4 w-4" />
              Add education
            </Button>
          </div>

          {content.education.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#CFC9BC] dark:border-[#333C52] p-6 text-center text-sm text-[#77786F] dark:text-[#94A3B8]">
              No education records added yet. Click &ldquo;Add education&rdquo; above to include your
              university, polytechnic, secondary school or professional qualification.
            </div>
          ) : (
            <div className="space-y-4">
              {content.education.map((edu, idx) => (
                <div
                  key={edu.id}
                  className="rounded-xl border border-[#E2DDD2] dark:border-[#333C52] bg-[#F6F3ED]/60 dark:bg-[#242A3D]/70 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#173B30] dark:text-[#34D399]">
                      Qualification #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setContent((p) => ({
                          ...p,
                          education: p.education.filter((e) => e.id !== edu.id),
                        }))
                      }
                      className="text-xs text-[#8F2424] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <FieldLabel required>Institution</FieldLabel>
                      <Input
                        value={edu.institution}
                        onChange={(e) =>
                          setContent((p) => ({
                            ...p,
                            education: p.education.map((it) =>
                              it.id === edu.id ? { ...it, institution: e.target.value } : it
                            ),
                          }))
                        }
                        placeholder="e.g. University of Lagos"
                      />
                    </div>
                    <div>
                      <FieldLabel required>Qualification</FieldLabel>
                      <Select
                        value={
                          NIGERIAN_AND_INTL_QUALIFICATIONS.includes(edu.qualification)
                            ? edu.qualification
                            : "Other / International Equivalent"
                        }
                        onChange={(e) =>
                          setContent((p) => ({
                            ...p,
                            education: p.education.map((it) =>
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
                    </div>
                    <div>
                      <FieldLabel>Course or field of study</FieldLabel>
                      <Input
                        value={edu.fieldOfStudy}
                        onChange={(e) =>
                          setContent((p) => ({
                            ...p,
                            education: p.education.map((it) =>
                              it.id === edu.id ? { ...it, fieldOfStudy: e.target.value } : it
                            ),
                          }))
                        }
                        placeholder="e.g. Computer Science"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <FieldLabel>Start year</FieldLabel>
                        <Input
                          value={edu.startDate}
                          onChange={(e) =>
                            setContent((p) => ({
                              ...p,
                              education: p.education.map((it) =>
                                it.id === edu.id ? { ...it, startDate: e.target.value } : it
                              ),
                            }))
                          }
                          placeholder="2019"
                        />
                      </div>
                      <div>
                        <FieldLabel>Graduation year</FieldLabel>
                        <Input
                          value={edu.isCurrent ? "In Progress" : edu.endDate}
                          disabled={edu.isCurrent}
                          onChange={(e) =>
                            setContent((p) => ({
                              ...p,
                              education: p.education.map((it) =>
                                it.id === edu.id ? { ...it, endDate: e.target.value } : it
                              ),
                            }))
                          }
                          placeholder="2023"
                        />
                      </div>
                    </div>
                  </div>

                  <label className="inline-flex items-center gap-2 text-xs text-[#252821] dark:text-[#E2E8F0] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={edu.isCurrent}
                      onChange={(e) =>
                        setContent((p) => ({
                          ...p,
                          education: p.education.map((it) =>
                            it.id === edu.id ? { ...it, isCurrent: e.target.checked } : it
                          ),
                        }))
                      }
                      className="rounded border-[#D4CFC3] text-[#173B30]"
                    />
                    Currently studying here
                  </label>

                  <div>
                    <FieldLabel hint="Optional">Academic achievements / class of degree</FieldLabel>
                    <Input
                      value={edu.achievements}
                      onChange={(e) =>
                        setContent((p) => ({
                          ...p,
                          education: p.education.map((it) =>
                            it.id === edu.id ? { ...it, achievements: e.target.value } : it
                          ),
                        }))
                      }
                      placeholder="e.g. Second Class Upper (2:1), Dean's Honour List"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* STEP 5: WORK EXPERIENCE & NO-EXPERIENCE PATHWAY */}
      {step === "experience" && (
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="rounded-xl border border-[#E2DDD2] dark:border-[#333C52] bg-[#F6F3ED] dark:bg-[#242A3D] p-4">
            <p className="text-sm font-semibold text-[#252821] dark:text-white">
              Do you have formal paid work experience?
            </p>
            <p className="mt-1 text-xs text-[#77786F] dark:text-[#94A3B8]">
              If you have never held a formal job, choose &ldquo;No formal work experience yet&rdquo; to use
              NYSC, SIWES, internships, volunteering, or academic projects instead.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={content.hasFormalExperience ? "primary" : "outline"}
                onClick={() => setContent((p) => ({ ...p, hasFormalExperience: true }))}
              >
                Yes, add formal work experience
              </Button>
              <Button
                type="button"
                size="sm"
                variant={!content.hasFormalExperience ? "primary" : "outline"}
                onClick={() => setContent((p) => ({ ...p, hasFormalExperience: false }))}
              >
                No formal work experience yet (NYSC / Projects / Volunteering)
              </Button>
            </div>
          </div>

          {content.hasFormalExperience ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-[#252821] dark:text-white">Employment History</h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newExp: WorkExperienceItem = {
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
                    };
                    setContent((p) => ({ ...p, experience: [...p.experience, newExp] }));
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Add role
                </Button>
              </div>

              {content.experience.length === 0 && (
                <div className="rounded-xl border border-dashed border-[#CFC9BC] dark:border-[#333C52] p-6 text-center text-sm text-[#77786F] dark:text-[#94A3B8]">
                  Click &ldquo;Add role&rdquo; to enter your current or past job, or switch to the
                  No-Experience pathway above.
                </div>
              )}

              {content.experience.map((exp, idx) => (
                <div
                  key={exp.id}
                  className="rounded-xl border border-[#E2DDD2] dark:border-[#333C52] bg-[#F6F3ED]/60 dark:bg-[#242A3D]/70 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#173B30] dark:text-[#34D399]">
                      Role #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setContent((p) => ({
                          ...p,
                          experience: p.experience.filter((e) => e.id !== exp.id),
                        }))
                      }
                      className="text-xs text-[#8F2424] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <FieldLabel required>Job title</FieldLabel>
                      <Input
                        value={exp.jobTitle}
                        onChange={(e) =>
                          setContent((p) => ({
                            ...p,
                            experience: p.experience.map((it) =>
                              it.id === exp.id ? { ...it, jobTitle: e.target.value } : it
                            ),
                          }))
                        }
                        placeholder="e.g. Customer Service Representative"
                      />
                    </div>
                    <div>
                      <FieldLabel required>Company / organization</FieldLabel>
                      <Input
                        value={exp.company}
                        onChange={(e) =>
                          setContent((p) => ({
                            ...p,
                            experience: p.experience.map((it) =>
                              it.id === exp.id ? { ...it, company: e.target.value } : it
                            ),
                          }))
                        }
                        placeholder="e.g. Zenith Retail Services"
                      />
                    </div>
                    <div>
                      <FieldLabel>Location</FieldLabel>
                      <Input
                        value={exp.location}
                        onChange={(e) =>
                          setContent((p) => ({
                            ...p,
                            experience: p.experience.map((it) =>
                              it.id === exp.id ? { ...it, location: e.target.value } : it
                            ),
                          }))
                        }
                        placeholder="e.g. Ikeja, Lagos"
                      />
                    </div>
                    <div>
                      <FieldLabel>Employment type</FieldLabel>
                      <Select
                        value={exp.employmentType || "Full-time"}
                        onChange={(e) =>
                          setContent((p) => ({
                            ...p,
                            experience: p.experience.map((it) =>
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
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:col-span-2">
                      <div>
                        <FieldLabel>Start date</FieldLabel>
                        <Input
                          value={exp.startDate}
                          onChange={(e) =>
                            setContent((p) => ({
                              ...p,
                              experience: p.experience.map((it) =>
                                it.id === exp.id ? { ...it, startDate: e.target.value } : it
                              ),
                            }))
                          }
                          placeholder="Jan 2023"
                        />
                      </div>
                      <div>
                        <FieldLabel>End date</FieldLabel>
                        <Input
                          value={exp.isCurrent ? "Present" : exp.endDate}
                          disabled={exp.isCurrent}
                          onChange={(e) =>
                            setContent((p) => ({
                              ...p,
                              experience: p.experience.map((it) =>
                                it.id === exp.id ? { ...it, endDate: e.target.value } : it
                              ),
                            }))
                          }
                          placeholder="Dec 2025"
                        />
                      </div>
                    </div>
                  </div>

                  <label className="inline-flex items-center gap-2 text-xs text-[#252821] dark:text-[#E2E8F0] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exp.isCurrent}
                      onChange={(e) =>
                        setContent((p) => ({
                          ...p,
                          experience: p.experience.map((it) =>
                            it.id === exp.id ? { ...it, isCurrent: e.target.checked } : it
                          ),
                        }))
                      }
                    />
                    I currently work here
                  </label>

                  <div>
                    <FieldLabel hint="Plain English is fine">
                      Responsibilities & what you did
                    </FieldLabel>
                    <Textarea
                      rows={3}
                      value={exp.responsibilities}
                      onChange={(e) =>
                        setContent((p) => ({
                          ...p,
                          experience: p.experience.map((it) =>
                            it.id === exp.id ? { ...it, responsibilities: e.target.value } : it
                          ),
                        }))
                      }
                      placeholder='Example: "Worked as a customer service person and answered customers."'
                    />
                  </div>

                  {/* Key Achievement Bullets */}
                  <div className="space-y-2 rounded-lg border border-[#E6E0D5] dark:border-[#333C52] bg-[#FFFEFA] dark:bg-[#1E2333] p-3">
                    <FieldLabel hint="Optional — shown as bullet points on your CV">
                      Key achievements or bullet points
                    </FieldLabel>
                    {exp.achievements.length > 0 && (
                      <ul className="space-y-1.5">
                        {exp.achievements.map((bullet, bIdx) => (
                          <li key={bIdx} className="flex items-center gap-2">
                            <Input
                              value={bullet}
                              onChange={(e) =>
                                setContent((p) => ({
                                  ...p,
                                  experience: p.experience.map((it) =>
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
                                setContent((p) => ({
                                  ...p,
                                  experience: p.experience.map((it) =>
                                    it.id === exp.id
                                      ? {
                                        ...it,
                                        achievements: it.achievements.filter((_, idx) => idx !== bIdx),
                                      }
                                      : it
                                  ),
                                }))
                              }
                              className="rounded p-1.5 text-[#77786F] hover:text-[#8F2424] dark:text-[#94A3B8] dark:hover:text-red-400 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="flex gap-2">
                      <Input
                        value={achievementDrafts[exp.id] || ""}
                        onChange={(e) =>
                          setAchievementDrafts((prev) => ({ ...prev, [exp.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const draft = (achievementDrafts[exp.id] || "").trim();
                            if (!draft) return;
                            setContent((p) => ({
                              ...p,
                              experience: p.experience.map((it) =>
                                it.id === exp.id
                                  ? { ...it, achievements: [...it.achievements, draft] }
                                  : it
                              ),
                            }));
                            setAchievementDrafts((prev) => ({ ...prev, [exp.id]: "" }));
                          }
                        }}
                        placeholder="Add an achievement bullet (e.g. Resolved 40+ inquiries daily)"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const draft = (achievementDrafts[exp.id] || "").trim();
                          if (!draft) return;
                          setContent((p) => ({
                            ...p,
                            experience: p.experience.map((it) =>
                              it.id === exp.id
                                ? { ...it, achievements: [...it.achievements, draft] }
                                : it
                            ),
                          }));
                          setAchievementDrafts((prev) => ({ ...prev, [exp.id]: "" }));
                        }}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={aiBusy === exp.id}
                      onClick={() => handleImproveWork(exp)}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {aiBusy === exp.id ? "Improving..." : "Improve wording with AI"}
                    </Button>
                    <span className="text-xs text-[#77786F] dark:text-[#94A3B8]">
                      Refines wording without inventing numbers or false duties.
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-semibold text-[#252821] dark:text-white">
                    No-Experience Pathway (NYSC, SIWES, Internships & Volunteering)
                  </h2>
                  <p className="text-xs text-[#77786F] dark:text-[#94A3B8]">
                    Highlight real practical experience you gained through school, service, or
                    community initiatives.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newAlt: AlternativeExperienceItem = {
                      id: createId(),
                      category: "nysc",
                      title: "",
                      organization: "",
                      location: "",
                      startDate: "",
                      endDate: "",
                      isCurrent: false,
                      description: "",
                    };
                    setContent((p) => ({
                      ...p,
                      alternativeExperience: [...p.alternativeExperience, newAlt],
                    }));
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Add experience
                </Button>
              </div>

              {content.alternativeExperience.length === 0 && (
                <div className="rounded-xl border border-dashed border-[#CFC9BC] dark:border-[#333C52] p-6 text-center text-sm text-[#77786F] dark:text-[#94A3B8]">
                  No entries yet. Click &ldquo;Add experience&rdquo; to include NYSC, SIWES,
                  volunteering, campus leadership, or practical training.
                </div>
              )}

              {content.alternativeExperience.map((alt, idx) => {
                const catMeta = NO_EXPERIENCE_CATEGORIES.find((c) => c.id === alt.category);
                return (
                  <div
                    key={alt.id}
                    className="rounded-xl border border-[#E2DDD2] dark:border-[#333C52] bg-[#F6F3ED]/60 dark:bg-[#242A3D]/70 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#173B30] dark:text-[#34D399]">
                        Entry #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setContent((p) => ({
                            ...p,
                            alternativeExperience: p.alternativeExperience.filter(
                              (a) => a.id !== alt.id
                            ),
                          }))
                        }
                        className="text-xs text-[#8F2424] hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <FieldLabel>Category</FieldLabel>
                        <Select
                          value={alt.category}
                          onChange={(e) =>
                            setContent((p) => ({
                              ...p,
                              alternativeExperience: p.alternativeExperience.map((it) =>
                                it.id === alt.id
                                  ? {
                                    ...it,
                                    category: e.target.value as AlternativeExperienceItem["category"],
                                  }
                                  : it
                              ),
                            }))
                          }
                        >
                          {NO_EXPERIENCE_CATEGORIES.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.label}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <FieldLabel required>Role / Project Title</FieldLabel>
                        <Input
                          value={alt.title}
                          onChange={(e) =>
                            setContent((p) => ({
                              ...p,
                              alternativeExperience: p.alternativeExperience.map((it) =>
                                it.id === alt.id ? { ...it, title: e.target.value } : it
                              ),
                            }))
                          }
                          placeholder="e.g. SIWES Laboratory Trainee"
                        />
                      </div>
                      <div>
                        <FieldLabel>Organization / School</FieldLabel>
                        <Input
                          value={alt.organization}
                          onChange={(e) =>
                            setContent((p) => ({
                              ...p,
                              alternativeExperience: p.alternativeExperience.map((it) =>
                                it.id === alt.id ? { ...it, organization: e.target.value } : it
                              ),
                            }))
                          }
                          placeholder="e.g. Federal Medical Centre"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <FieldLabel>Start</FieldLabel>
                          <Input
                            value={alt.startDate}
                            onChange={(e) =>
                              setContent((p) => ({
                                ...p,
                                alternativeExperience: p.alternativeExperience.map((it) =>
                                  it.id === alt.id ? { ...it, startDate: e.target.value } : it
                                ),
                              }))
                            }
                            placeholder="May 2024"
                          />
                        </div>
                        <div>
                          <FieldLabel>End</FieldLabel>
                          <Input
                            value={alt.endDate}
                            onChange={(e) =>
                              setContent((p) => ({
                                ...p,
                                alternativeExperience: p.alternativeExperience.map((it) =>
                                  it.id === alt.id ? { ...it, endDate: e.target.value } : it
                                ),
                              }))
                            }
                            placeholder="Nov 2024"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <FieldLabel hint={catMeta ? `Example: ${catMeta.example}` : undefined}>
                        What you contributed & learned
                      </FieldLabel>
                      <Textarea
                        rows={3}
                        value={alt.description}
                        onChange={(e) =>
                          setContent((p) => ({
                            ...p,
                            alternativeExperience: p.alternativeExperience.map((it) =>
                              it.id === alt.id ? { ...it, description: e.target.value } : it
                            ),
                          }))
                        }
                        placeholder={catMeta?.example}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* STEP 6: SKILLS */}
      {step === "skills" && (
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-[#252821] dark:text-white">Select & Add Verified Skills</h2>
              <p className="mt-1 text-sm text-[#77786F] dark:text-[#94A3B8]">
                Tap skills you genuinely possess or add custom ones below.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={aiBusy === "skills"}
              onClick={handleSuggestSkills}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {aiBusy === "skills" ? "Suggesting..." : "AI skill suggestions"}
            </Button>
          </div>

          {suggestedSkills.length > 0 && (
            <div className="rounded-xl border border-[#173B30]/30 dark:border-[#34D399]/30 bg-[#173B30]/5 dark:bg-[#0E2E23]/40 p-4 space-y-2">
              <p className="text-xs font-semibold text-[#173B30] dark:text-[#34D399]">
                Recommended skills based on your entries (click only skills you truly have):
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedSkills.map((s) => {
                  const added = content.skills.some(
                    (sk) => sk.name.toLowerCase() === s.name.toLowerCase()
                  );
                  return (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => toggleSkill(s.name, s.category)}
                      title={s.reason}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium cursor-pointer transition-colors",
                        added
                          ? "border-[#173B30] bg-[#173B30] text-[#FFFEFA] dark:border-[#34D399] dark:bg-[#173B30] dark:text-white"
                          : "border-[#CFC9BC] bg-[#FFFEFA] text-[#252821] hover:border-[#173B30] dark:border-[#333C52] dark:bg-[#1E2333] dark:text-[#E2E8F0] dark:hover:border-[#34D399]"
                      )}
                    >
                      {added ? "✓ " : "+ "}
                      {s.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Custom skill adder */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={customSkillName}
              onChange={(e) => setCustomSkillName(e.target.value)}
              placeholder="Add custom skill (e.g. Sage 50, Tailoring, Solar Installation)"
              className="flex-1"
            />
            <Select
              value={customSkillCat}
              onChange={(e) => setCustomSkillCat(e.target.value as SkillCategory)}
              className="sm:w-48"
            >
              {SKILL_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                if (!customSkillName.trim()) return;
                toggleSkill(customSkillName.trim(), customSkillCat);
                setCustomSkillName("");
              }}
            >
              Add skill
            </Button>
          </div>

          <div className="space-y-4">
            {SKILL_CATEGORIES.map((cat) => (
              <div key={cat.id}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#77786F] dark:text-[#94A3B8]">
                  {cat.label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {cat.suggestions.map((skill) => {
                    const active = content.skills.some(
                      (s) => s.name.toLowerCase() === skill.toLowerCase()
                    );
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill, cat.id)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-medium transition-colors cursor-pointer",
                          active
                            ? "border-[#173B30] bg-[#173B30] text-[#FFFEFA] dark:border-[#34D399] dark:bg-[#173B30] dark:text-white"
                            : "border-[#D4CFC3] bg-[#FFFEFA] text-[#252821] hover:border-[#173B30] dark:border-[#333C52] dark:bg-[#1E2333] dark:text-[#E2E8F0] dark:hover:border-[#34D399]"
                        )}
                      >
                        {active ? "✓ " : "+ "}
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* STEP 7: PROJECTS, CERTIFICATIONS, ADDITIONAL & REVIEW */}
      {step === "projects" && (
        <div className="space-y-6">
          <Card className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-[#252821] dark:text-white">Projects & Achievements (Optional)</h2>
                <p className="text-xs text-[#77786F] dark:text-[#94A3B8]">
                  Showcase capstone work, community builds, freelance deliverables or business initiatives.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const pItem: ProjectItem = {
                    id: createId(),
                    title: "",
                    role: "",
                    description: "",
                    technologies: [],
                    outcome: "",
                    projectUrl: "",
                  };
                  setContent((p) => ({ ...p, projects: [...p.projects, pItem] }));
                }}
              >
                <Plus className="h-4 w-4" />
                Add project
              </Button>
            </div>

            {content.projects.map((proj) => (
              <div
                key={proj.id}
                className="rounded-xl border border-[#E2DDD2] dark:border-[#333C52] bg-[#F6F3ED]/60 dark:bg-[#242A3D]/70 p-4 space-y-3"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    value={proj.title}
                    onChange={(e) =>
                      setContent((p) => ({
                        ...p,
                        projects: p.projects.map((it) =>
                          it.id === proj.id ? { ...it, title: e.target.value } : it
                        ),
                      }))
                    }
                    placeholder="Project title"
                  />
                  <Input
                    value={proj.role}
                    onChange={(e) =>
                      setContent((p) => ({
                        ...p,
                        projects: p.projects.map((it) =>
                          it.id === proj.id ? { ...it, role: e.target.value } : it
                        ),
                      }))
                    }
                    placeholder="Your role (e.g. Lead Researcher)"
                  />
                </div>
                <Textarea
                  rows={2}
                  value={proj.description}
                  onChange={(e) =>
                    setContent((p) => ({
                      ...p,
                      projects: p.projects.map((it) =>
                        it.id === proj.id ? { ...it, description: e.target.value } : it
                      ),
                    }))
                  }
                  placeholder="Describe what you built or accomplished"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    value={proj.outcome}
                    onChange={(e) =>
                      setContent((p) => ({
                        ...p,
                        projects: p.projects.map((it) =>
                          it.id === proj.id ? { ...it, outcome: e.target.value } : it
                        ),
                      }))
                    }
                    placeholder="Outcome (optional)"
                  />
                  <Input
                    value={proj.projectUrl}
                    onChange={(e) =>
                      setContent((p) => ({
                        ...p,
                        projects: p.projects.map((it) =>
                          it.id === proj.id ? { ...it, projectUrl: e.target.value } : it
                        ),
                      }))
                    }
                    placeholder="Project URL (optional)"
                  />
                </div>
              </div>
            ))}
          </Card>

          <Card className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-[#252821] dark:text-white">Certifications (Optional)</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const cert: CertificationItem = {
                    id: createId(),
                    name: "",
                    issuingOrganization: "",
                    issueDate: "",
                    expiryDate: "",
                    credentialUrl: "",
                  };
                  setContent((p) => ({ ...p, certifications: [...p.certifications, cert] }));
                }}
              >
                <Plus className="h-4 w-4" />
                Add certification
              </Button>
            </div>
            {content.certifications.map((cert) => (
              <div key={cert.id} className="grid gap-3 sm:grid-cols-3">
                <Input
                  value={cert.name}
                  onChange={(e) =>
                    setContent((p) => ({
                      ...p,
                      certifications: p.certifications.map((it) =>
                        it.id === cert.id ? { ...it, name: e.target.value } : it
                      ),
                    }))
                  }
                  placeholder="Certification name"
                />
                <Input
                  value={cert.issuingOrganization}
                  onChange={(e) =>
                    setContent((p) => ({
                      ...p,
                      certifications: p.certifications.map((it) =>
                        it.id === cert.id ? { ...it, issuingOrganization: e.target.value } : it
                      ),
                    }))
                  }
                  placeholder="Issuing organization"
                />
                <Input
                  value={cert.issueDate}
                  onChange={(e) =>
                    setContent((p) => ({
                      ...p,
                      certifications: p.certifications.map((it) =>
                        it.id === cert.id ? { ...it, issueDate: e.target.value } : it
                      ),
                    }))
                  }
                  placeholder="Year obtained (e.g. 2024)"
                />
              </div>
            ))}
          </Card>

          {/* Additional Information & References */}
          <Card className="p-6 sm:p-8 space-y-5">
            <div>
              <h2 className="font-semibold text-[#252821] dark:text-white">
                Additional Information & References (Optional)
              </h2>
              <p className="mt-1 text-xs text-[#77786F] dark:text-[#94A3B8]">
                Separate multiple items with commas where applicable. Skip any field that does not
                apply to you.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="add-languages" hint="Comma-separated">
                  Languages spoken
                </FieldLabel>
                <Input
                  id="add-languages"
                  value={content.additional.languages.join(", ")}
                  onChange={(e) =>
                    setContent((p) => ({
                      ...p,
                      additional: {
                        ...p.additional,
                        languages: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      },
                    }))
                  }
                  placeholder="English (Fluent), Yoruba, Igbo"
                />
              </div>

              <div>
                <FieldLabel htmlFor="add-awards" hint="Comma-separated">
                  Awards & honours
                </FieldLabel>
                <Input
                  id="add-awards"
                  value={content.additional.awards.join(", ")}
                  onChange={(e) =>
                    setContent((p) => ({
                      ...p,
                      additional: {
                        ...p.additional,
                        awards: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      },
                    }))
                  }
                  placeholder="Dean's List 2024, Best NYSC CDS Member"
                />
              </div>

              <div>
                <FieldLabel htmlFor="add-memberships" hint="Comma-separated">
                  Professional memberships
                </FieldLabel>
                <Input
                  id="add-memberships"
                  value={content.additional.memberships.join(", ")}
                  onChange={(e) =>
                    setContent((p) => ({
                      ...p,
                      additional: {
                        ...p.additional,
                        memberships: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      },
                    }))
                  }
                  placeholder="ICAN Student Member, CIPM Associate"
                />
              </div>

              <div>
                <FieldLabel htmlFor="add-interests" hint="Comma-separated">
                  Interests / extracurriculars
                </FieldLabel>
                <Input
                  id="add-interests"
                  value={content.additional.interests.join(", ")}
                  onChange={(e) =>
                    setContent((p) => ({
                      ...p,
                      additional: {
                        ...p.additional,
                        interests: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      },
                    }))
                  }
                  placeholder="Community mentoring, Technical writing"
                />
              </div>

              <div className="sm:col-span-2">
                <FieldLabel htmlFor="add-publications" hint="Comma-separated">
                  Publications or research papers
                </FieldLabel>
                <Input
                  id="add-publications"
                  value={content.additional.publications.join(", ")}
                  onChange={(e) =>
                    setContent((p) => ({
                      ...p,
                      additional: {
                        ...p.additional,
                        publications: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      },
                    }))
                  }
                  placeholder="Optional title or citation"
                />
              </div>

              <div className="sm:col-span-2">
                <FieldLabel htmlFor="add-volunteer">Volunteering summary</FieldLabel>
                <Textarea
                  id="add-volunteer"
                  rows={2}
                  value={content.additional.volunteerSummary}
                  onChange={(e) =>
                    setContent((p) => ({
                      ...p,
                      additional: { ...p.additional, volunteerSummary: e.target.value },
                    }))
                  }
                  placeholder="Briefly summarize community service, campus outreach, or NGO support."
                />
              </div>
            </div>

            <div className="border-t border-[#E6E0D5] dark:border-[#333C52] pt-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="inline-flex items-center gap-2 text-xs text-[#252821] dark:text-[#E2E8F0] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={content.additional.omitReferences}
                    onChange={(e) =>
                      setContent((p) => ({
                        ...p,
                        additional: { ...p.additional, omitReferences: e.target.checked },
                      }))
                    }
                  />
                  Show &ldquo;References available on request&rdquo; instead of listing contacts
                </label>

                {!content.additional.omitReferences && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setContent((p) => ({
                        ...p,
                        additional: {
                          ...p.additional,
                          references: [
                            ...p.additional.references,
                            { id: createId(), name: "", role: "", organization: "", contact: "" },
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

              {!content.additional.omitReferences &&
                content.additional.references.map((ref) => (
                  <div
                    key={ref.id}
                    className="grid gap-2.5 rounded-lg border border-[#E6E0D5] dark:border-[#333C52] bg-[#F6F3ED]/60 dark:bg-[#242A3D]/70 p-3 sm:grid-cols-2"
                  >
                    <Input
                      value={ref.name}
                      onChange={(e) =>
                        setContent((p) => ({
                          ...p,
                          additional: {
                            ...p.additional,
                            references: p.additional.references.map((r) =>
                              r.id === ref.id ? { ...r, name: e.target.value } : r
                            ),
                          },
                        }))
                      }
                      placeholder="Referee full name"
                    />
                    <Input
                      value={ref.role}
                      onChange={(e) =>
                        setContent((p) => ({
                          ...p,
                          additional: {
                            ...p.additional,
                            references: p.additional.references.map((r) =>
                              r.id === ref.id ? { ...r, role: e.target.value } : r
                            ),
                          },
                        }))
                      }
                      placeholder="Role / title"
                    />
                    <Input
                      value={ref.organization}
                      onChange={(e) =>
                        setContent((p) => ({
                          ...p,
                          additional: {
                            ...p.additional,
                            references: p.additional.references.map((r) =>
                              r.id === ref.id ? { ...r, organization: e.target.value } : r
                            ),
                          },
                        }))
                      }
                      placeholder="Organization"
                    />
                    <div className="flex gap-2">
                      <Input
                        value={ref.contact}
                        onChange={(e) =>
                          setContent((p) => ({
                            ...p,
                            additional: {
                              ...p.additional,
                              references: p.additional.references.map((r) =>
                                r.id === ref.id ? { ...r, contact: e.target.value } : r
                              ),
                            },
                          }))
                        }
                        placeholder="Email or phone"
                      />
                      <button
                        type="button"
                        aria-label="Remove referee"
                        onClick={() =>
                          setContent((p) => ({
                            ...p,
                            additional: {
                              ...p.additional,
                              references: p.additional.references.filter((r) => r.id !== ref.id),
                            },
                          }))
                        }
                        className="rounded p-2 text-[#77786F] hover:text-[#8F2424] dark:text-[#94A3B8] dark:hover:text-red-400 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </Card>

          <Card className="p-6 sm:p-8 space-y-4">
            <h2 className="font-semibold text-[#252821] dark:text-white">Final Review & Document Title</h2>
            <div>
              <FieldLabel htmlFor="final-cv-title">Saved CV title</FieldLabel>
              <Input
                id="final-cv-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Adaeze Okafor - Operations Coordinator"
              />
            </div>
            <div className="grid gap-2 text-xs text-[#77786F] dark:text-[#94A3B8] sm:grid-cols-3">
              <div className="rounded-lg border border-[#E6E0D5] dark:border-[#333C52] bg-[#F6F3ED] dark:bg-[#242A3D] p-3">
                <span className="font-semibold text-[#252821] dark:text-white">Name:</span>{" "}
                {content.personalInfo.fullName || "Not entered"}
              </div>
              <div className="rounded-lg border border-[#E6E0D5] dark:border-[#333C52] bg-[#F6F3ED] dark:bg-[#242A3D] p-3">
                <span className="font-semibold text-[#252821] dark:text-white">Education:</span>{" "}
                {content.education.length} record(s)
              </div>
              <div className="rounded-lg border border-[#E6E0D5] dark:border-[#333C52] bg-[#F6F3ED] dark:bg-[#242A3D] p-3">
                <span className="font-semibold text-[#252821] dark:text-white">Skills:</span>{" "}
                {content.skills.length} selected
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Navigation Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          disabled={currentIdx === 0}
          onClick={() => goToStep(STEPS[currentIdx - 1].key, false)}
        >
          Back
        </Button>

        <div className="flex flex-wrap items-center gap-3">
          {STEPS[currentIdx].optional && currentIdx < STEPS.length - 1 && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => goToStep(STEPS[currentIdx + 1].key, false)}
            >
              Skip for now
            </Button>
          )}

          {currentIdx < STEPS.length - 1 ? (
            <Button
              type="button"
              variant="primary"
              onClick={() => goToStep(STEPS[currentIdx + 1].key, true)}
            >
              Save & continue
            </Button>
          ) : (
            <Button type="button" variant="primary" size="lg" onClick={handleFinishToEditor}>
              Open in CV Editor & Preview
            </Button>
          )}
        </div>
      </div>

      {/* Quota / Paid Package Required Modal */}
      {quotaModal?.open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        >
          <div className="max-w-md rounded-2xl border border-[#C4A46B]/40 dark:border-[#333C52] bg-[#FFFEFA] dark:bg-[#1E2333] p-6 shadow-2xl space-y-4">
            <h3 className="font-editorial text-xl font-bold text-[#173B30] dark:text-[#34D399]">Package Required</h3>
            <p className="text-xs text-[#77786F] dark:text-[#94A3B8] leading-relaxed">{quotaModal.message}</p>
            <div className="rounded-lg border border-[#E6E0D5] dark:border-[#333C52] bg-[#F6F3ED] dark:bg-[#242A3D] p-3 text-xs text-[#252821] dark:text-[#E2E8F0] space-y-1">
              <p className="font-semibold text-[#173B30] dark:text-[#34D399]">Available Packages:</p>
              <p>• 2 CVs: ₦6,000</p>
              <p>• 3 to 6 CVs: ₦15,000 (Max 6)</p>
              <p>• 7 to 13 CVs: ₦20,000 (Max 13)</p>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setQuotaModal(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push("/pricing")}
              >
                View Packages & Activate
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Live Preview Modal */}
      {showPreviewModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Live CV Preview"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto"
        >
          <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl border border-[#E6E0D5] dark:border-[#333C52] bg-[#F6F3ED] dark:bg-[#1E2333] shadow-2xl">
            <div className="border-b border-[#E6E0D5] dark:border-[#333C52] bg-[#FFFEFA] dark:bg-[#242A3D] px-5 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[#252821] dark:text-white">Live CV Preview</p>
                    <span className="rounded-full bg-[#173B30] text-[#FECB0D] dark:bg-[#FECB0D] dark:text-[#173B30] px-2.5 py-0.5 text-[11px] font-bold font-tech">
                      Step {currentIdx + 1} of 7 · {STEPS[currentIdx]?.label}
                    </span>
                  </div>
                  <p className="text-xs text-[#77786F] dark:text-[#94A3B8] mt-0.5">
                    Real-time progress preview. Filled sections show live content; upcoming sections show formatted guides.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreviewModal(false)}
                >
                  <X className="h-4 w-4" />
                  Close
                </Button>
              </div>

              {/* Progress Steps Bar inside Preview Modal */}
              <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-tech">
                {STEPS.map((s, idx) => {
                  const isDone = idx < currentIdx;
                  const isCurrent = idx === currentIdx;
                  return (
                    <div
                      key={s.key}
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1 rounded-md shrink-0 border",
                        isCurrent
                          ? "bg-[#173B30] text-white border-[#173B30] font-bold dark:bg-[#34D399] dark:text-black"
                          : isDone
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                            : "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800"
                      )}
                    >
                      <span>{isDone ? "✓" : isCurrent ? "●" : "○"}</span>
                      <span>{s.shortLabel}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="overflow-y-auto p-4 sm:p-6">
              <CvDocumentPreview
                cv={previewCv}
                templateId={templateId}
                settings={settings}
                showProgressPlaceholders={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
