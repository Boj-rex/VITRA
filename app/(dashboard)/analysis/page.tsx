"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Loader2,
  Sparkles,
  X,
  Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge, Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { FieldLabel, Input, Textarea } from "@/components/ui/input";
import type { CvAnalysisResult, CvRecommendation, CvRecord } from "@/types/cv";

function AnalysisInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cvId = searchParams.get("cvId");
  const warnParam = searchParams.get("warn");

  const [cv, setCv] = useState<CvRecord | null>(null);
  const [analysis, setAnalysis] = useState<CvAnalysisResult | null>(null);
  const [loading, setLoading] = useState(Boolean(cvId));
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingRecId, setEditingRecId] = useState<string | null>(null);
  const [editRecText, setEditRecText] = useState("");
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
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!cvId) return;
    fetch(`/api/cvs/${cvId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && d.cv) {
          setCv(d.cv);
          setAnalysis(d.analysis || null);
        }
      })
      .finally(() => setLoading(false));
  }, [cvId]);

  async function handleRunAiAnalysis() {
    if (!cv) return;
    setAiLoading(true);
    setAiError(null);
    try {
      // Save any manual extraction corrections first
      await fetch(`/api/cvs/${cv.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ structuredContent: cv.structuredContent }),
      });

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "analyze-cv", cvId: cv.id, engine: atsEngineChoice }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setAiError(
          data.error ||
          "OpenAI is not configured yet. You can still review the structural quality checklist and edit your CV directly."
        );
      } else {
        setAnalysis(data.data);
      }
    } catch {
      setAiError("Network error while running AI analysis.");
    } finally {
      setAiLoading(false);
    }
  }

  function updateRecommendationStatus(
    recId: string,
    status: CvRecommendation["status"],
    editedText?: string
  ) {
    if (!analysis) return;
    setAnalysis({
      ...analysis,
      recommendations: analysis.recommendations.map((r) =>
        r.id === recId ? { ...r, status, editedText: editedText ?? r.editedText } : r
      ),
    });
  }

  async function handleSaveAndOpenEditor() {
    if (!cv) return;
    setSaving(true);
    try {
      // Apply accepted or edited recommendations to summary/experience where matching
      const updatedContent = structuredClone(cv.structuredContent);
      if (analysis) {
        for (const rec of analysis.recommendations) {
          if (rec.status !== "accepted" && rec.status !== "edited") continue;
          const replacement = rec.editedText || rec.suggestedReplacement;
          if (!replacement) continue;

          if (rec.section.toLowerCase().includes("summary") && updatedContent.summary) {
            updatedContent.summary = replacement;
          } else if (rec.originalText && updatedContent.summary.includes(rec.originalText)) {
            updatedContent.summary = updatedContent.summary.replace(
              rec.originalText,
              replacement
            );
          } else if (rec.originalText) {
            updatedContent.experience = updatedContent.experience.map((exp) => ({
              ...exp,
              responsibilities: exp.responsibilities.includes(rec.originalText)
                ? exp.responsibilities.replace(rec.originalText, replacement)
                : exp.responsibilities,
              achievements: exp.achievements.map((a) =>
                a.includes(rec.originalText) ? a.replace(rec.originalText, replacement) : a
              ),
            }));
          }
        }
      }

      await fetch(`/api/cvs/${cv.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ structuredContent: updatedContent }),
      });

      await fetch(`/api/cvs/${cv.id}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: "Post-analysis improved draft" }),
      });

      router.push(`/editor/${cv.id}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card className="mx-auto max-w-4xl p-10 text-center text-sm text-[#77786F]">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#173B30]" />
        <p className="mt-3">Loading extracted CV and analysis...</p>
      </Card>
    );
  }

  if (!cv) {
    return (
      <Card className="mx-auto max-w-3xl p-8 text-center">
        <h1 className="font-editorial text-2xl text-[#252821]">No CV selected for analysis</h1>
        <p className="mt-2 text-sm text-[#77786F]">
          Upload an existing PDF or Word (.docx) CV to extract and analyze its contents.
        </p>
        <Link
          href="/upload"
          className={buttonVariants({ variant: "primary", className: "mt-5 inline-flex" })}
        >
          Upload a CV
        </Link>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#173B30]">
            Extraction Review & Analysis
          </p>
          <h1 className="mt-1 font-editorial text-3xl text-[#252821]">{cv.title}</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* ATS Engine Switcher */}
          {systemAtsMode === "user_choice" ? (
            <div className="flex items-center gap-1 p-1 rounded-xl border border-black/10 dark:border-[#333C52] bg-[#F3F4F6] dark:bg-[#1E2536] text-[11px] font-bold select-none">
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
                <span>Rule-Based ATS</span>
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
                <span>AI Review</span>
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

          <Button
            variant="secondary"
            onClick={handleRunAiAnalysis}
            disabled={aiLoading}
          >
            {atsEngineChoice === "hardcoded" ? (
              <Cpu className="h-4 w-4 text-emerald-600" />
            ) : (
              <Sparkles className="h-4 w-4 text-blue-600" />
            )}
            {aiLoading
              ? "Auditing..."
              : atsEngineChoice === "hardcoded"
              ? "Run Rule-Based ATS Review (Instant)"
              : "Run AI Review"}
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveAndOpenEditor}
            disabled={saving}
          >
            {saving ? "Saving..." : "Continue to CV Editor"}
          </Button>
        </div>
      </div>

      {warnParam && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {warnParam}
        </div>
      )}

      {aiError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {aiError}
        </div>
      )}

      {/* Verify Extracted Core Fields */}
      <Card className="p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-[#252821]">1. Verify Extracted Information</h2>
          <p className="text-xs text-[#77786F]">
            Confirm that extracted personal details and summary match your uploaded document before
            applying suggestions.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <FieldLabel>Full name</FieldLabel>
            <Input
              value={cv.structuredContent.personalInfo.fullName}
              onChange={(e) =>
                setCv({
                  ...cv,
                  structuredContent: {
                    ...cv.structuredContent,
                    personalInfo: {
                      ...cv.structuredContent.personalInfo,
                      fullName: e.target.value,
                    },
                  },
                })
              }
            />
          </div>
          <div>
            <FieldLabel>Email</FieldLabel>
            <Input
              value={cv.structuredContent.personalInfo.email}
              onChange={(e) =>
                setCv({
                  ...cv,
                  structuredContent: {
                    ...cv.structuredContent,
                    personalInfo: {
                      ...cv.structuredContent.personalInfo,
                      email: e.target.value,
                    },
                  },
                })
              }
            />
          </div>
          <div>
            <FieldLabel>Telephone</FieldLabel>
            <Input
              value={cv.structuredContent.personalInfo.phone}
              onChange={(e) =>
                setCv({
                  ...cv,
                  structuredContent: {
                    ...cv.structuredContent,
                    personalInfo: {
                      ...cv.structuredContent.personalInfo,
                      phone: e.target.value,
                    },
                  },
                })
              }
            />
          </div>
        </div>

        <div>
          <FieldLabel>Extracted Summary</FieldLabel>
          <Textarea
            rows={3}
            value={cv.structuredContent.summary}
            onChange={(e) =>
              setCv({
                ...cv,
                structuredContent: {
                  ...cv.structuredContent,
                  summary: e.target.value,
                },
              })
            }
          />
        </div>

        <div className="space-y-4 pt-2 border-t border-[#E2DDD2]">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Extracted Experience Quick Review */}
            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#173B30]">
                Extracted Work Experience ({cv.structuredContent.experience.length})
              </p>
              {cv.structuredContent.experience.length === 0 ? (
                <p className="text-xs text-[#77786F]">
                  No formal experience detected — you can add roles or NYSC/SIWES inside the
                  Editor.
                </p>
              ) : (
                <div className="space-y-2">
                  {cv.structuredContent.experience.map((exp) => (
                    <div
                      key={exp.id}
                      className="rounded-lg border border-[#E2DDD2] bg-[#F6F3ED]/60 p-3 space-y-2"
                    >
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Input
                          aria-label="Job title"
                          value={exp.jobTitle}
                          onChange={(e) =>
                            setCv({
                              ...cv,
                              structuredContent: {
                                ...cv.structuredContent,
                                experience: cv.structuredContent.experience.map((it) =>
                                  it.id === exp.id ? { ...it, jobTitle: e.target.value } : it
                                ),
                              },
                            })
                          }
                          placeholder="Job title"
                        />
                        <Input
                          aria-label="Company"
                          value={exp.company}
                          onChange={(e) =>
                            setCv({
                              ...cv,
                              structuredContent: {
                                ...cv.structuredContent,
                                experience: cv.structuredContent.experience.map((it) =>
                                  it.id === exp.id ? { ...it, company: e.target.value } : it
                                ),
                              },
                            })
                          }
                          placeholder="Company"
                        />
                      </div>
                      <Textarea
                        rows={2}
                        aria-label="Role summary or responsibilities"
                        value={exp.responsibilities}
                        onChange={(e) =>
                          setCv({
                            ...cv,
                            structuredContent: {
                              ...cv.structuredContent,
                              experience: cv.structuredContent.experience.map((it) =>
                                it.id === exp.id ? { ...it, responsibilities: e.target.value } : it
                              ),
                            },
                          })
                        }
                        placeholder="Extracted responsibilities..."
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Extracted Education Quick Review */}
            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#173B30]">
                Extracted Education ({cv.structuredContent.education.length})
              </p>
              {cv.structuredContent.education.length === 0 ? (
                <p className="text-xs text-[#77786F]">
                  No education entries detected — you can add qualifications inside the Editor.
                </p>
              ) : (
                <div className="space-y-2">
                  {cv.structuredContent.education.map((edu) => (
                    <div
                      key={edu.id}
                      className="rounded-lg border border-[#E2DDD2] bg-[#F6F3ED]/60 p-3 space-y-2"
                    >
                      <Input
                        aria-label="Institution"
                        value={edu.institution}
                        onChange={(e) =>
                          setCv({
                            ...cv,
                            structuredContent: {
                              ...cv.structuredContent,
                              education: cv.structuredContent.education.map((it) =>
                                it.id === edu.id ? { ...it, institution: e.target.value } : it
                              ),
                            },
                          })
                        }
                        placeholder="School or university"
                      />
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Input
                          aria-label="Qualification"
                          value={edu.qualification}
                          onChange={(e) =>
                            setCv({
                              ...cv,
                              structuredContent: {
                                ...cv.structuredContent,
                                education: cv.structuredContent.education.map((it) =>
                                  it.id === edu.id ? { ...it, qualification: e.target.value } : it
                                ),
                              },
                            })
                          }
                          placeholder="Degree / qualification"
                        />
                        <Input
                          aria-label="Course or field of study"
                          value={edu.fieldOfStudy}
                          onChange={(e) =>
                            setCv({
                              ...cv,
                              structuredContent: {
                                ...cv.structuredContent,
                                education: cv.structuredContent.education.map((it) =>
                                  it.id === edu.id ? { ...it, fieldOfStudy: e.target.value } : it
                                ),
                              },
                            })
                          }
                          placeholder="Field of study"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-[#77786F]">
            Extracted {cv.structuredContent.experience.length} work record(s),{" "}
            {cv.structuredContent.education.length} education record(s), and{" "}
            {cv.structuredContent.skills.length} skill(s). You can refine skills, projects, and
            formatting inside the CV Editor.
          </p>
        </div>
      </Card>

      {/* ATS & Quality Checks */}
      {analysis && (
        <>
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold text-[#252821]">2. Structural & ATS Readability Checks</h2>
            <p className="text-sm text-[#77786F]">{analysis.overallSummary}</p>

            <div className="grid gap-3 sm:grid-cols-2">
              {analysis.atsReadabilityChecks.map((chk) => (
                <div
                  key={chk.label}
                  className="flex items-start gap-2.5 rounded-lg border border-[#E2DDD2] p-3 text-xs"
                >
                  {chk.passed ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#173B30]" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-700" />
                  )}
                  <div>
                    <p className="font-semibold text-[#252821]">{chk.label}</p>
                    <p className="mt-0.5 text-[#77786F]">{chk.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Line-by-line AI Recommendations */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-[#252821]">
                3. Improvement Recommendations ({analysis.recommendations.length})
              </h2>
            </div>

            {analysis.recommendations.length === 0 ? (
              <p className="text-sm text-[#77786F]">
                Click &ldquo;Run AI Review&rdquo; above (requires a Gemini or OpenAI API key) for
                detailed grammar, clarity, tone and phrasing recommendations, or proceed straight to
                the CV Editor.
              </p>
            ) : (
              <div className="space-y-4">
                {analysis.recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className="rounded-xl border border-[#E2DDD2] bg-[#F6F3ED]/60 p-4 space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="gold">{rec.category}</Badge>
                        <span className="text-xs font-semibold text-[#252821]">
                          {rec.section}
                        </span>
                      </div>
                      <Badge
                        variant={
                          rec.status === "accepted" || rec.status === "edited"
                            ? "forest"
                            : rec.status === "rejected"
                              ? "danger"
                              : "neutral"
                        }
                      >
                        {rec.status}
                      </Badge>
                    </div>

                    <p className="text-sm font-medium text-[#252821]">{rec.issue}</p>
                    <p className="text-xs text-[#77786F]">Why it matters: {rec.whyItMatters}</p>

                    {rec.originalText && (
                      <div className="rounded bg-white p-2.5 text-xs text-[#77786F] border border-[#E2DDD2]">
                        <span className="font-semibold text-[#252821]">Original: </span>
                        {rec.originalText}
                      </div>
                    )}

                    {editingRecId === rec.id ? (
                      <div className="space-y-2">
                        <Textarea
                          rows={2}
                          value={editRecText}
                          onChange={(e) => setEditRecText(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              updateRecommendationStatus(rec.id, "edited", editRecText);
                              setEditingRecId(null);
                            }}
                          >
                            Save edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingRecId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded bg-[#FFFEFA] p-2.5 text-xs text-[#173B30] border border-[#173B30]/20">
                        <span className="font-semibold">Suggested: </span>
                        {rec.editedText || rec.suggestedReplacement}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button
                        size="sm"
                        variant={rec.status === "accepted" ? "primary" : "outline"}
                        onClick={() => updateRecommendationStatus(rec.id, "accepted")}
                      >
                        <Check className="h-3.5 w-3.5" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingRecId(rec.id);
                          setEditRecText(rec.editedText || rec.suggestedReplacement);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateRecommendationStatus(rec.id, "rejected")}
                      >
                        <X className="h-3.5 w-3.5" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

export default function AnalysisPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-[#77786F]">Loading analysis...</div>}>
      <AnalysisInner />
    </Suspense>
  );
}
