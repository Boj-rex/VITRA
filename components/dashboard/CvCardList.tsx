"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Copy,
  Download,
  Edit3,
  FileText,
  Lock,
  Pencil,
  Trash2,
} from "lucide-react";
import { Badge, Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SubscriptionRequiredModal } from "@/components/billing/SubscriptionRequiredModal";
import { formatRelativeDate } from "@/lib/utils";
import { TEMPLATE_METADATA } from "@/lib/cv/defaults";
import type { CvRecord } from "@/types/cv";

export function CvCardList({
  initialCvs,
  hasActiveSubscription = false,
}: {
  initialCvs: CvRecord[];
  hasActiveSubscription?: boolean;
}) {
  const router = useRouter();
  const [cvs, setCvs] = useState<CvRecord[]>(initialCvs);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<CvRecord | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showSubModal, setShowSubModal] = useState(false);
  const [isExhaustedModal, setIsExhaustedModal] = useState(false);
  const [subModalCvId, setSubModalCvId] = useState<string | undefined>();
  const [subModalFormat, setSubModalFormat] = useState<"pdf" | "docx">("pdf");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const handleDownload = (cvId: string, format: "pdf" | "docx") => {
    if (!hasActiveSubscription) {
      setSubModalCvId(cvId);
      setSubModalFormat(format);
      setShowSubModal(true);
      return;
    }
    const link = document.createElement("a");
    link.href = `/api/cvs/${cvId}/export?format=${format}`;
    link.download = "";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  async function handleRenameSubmit(cvId: string) {
    if (!renameText.trim()) return;
    setBusyId(cvId);
    setFeedback(null);
    try {
      const res = await fetch(`/api/cvs/${cvId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: renameText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", text: data.error || "Could not rename CV." });
      } else {
        setCvs((prev) => prev.map((c) => (c.id === cvId ? data.cv : c)));
        setRenamingId(null);
        setFeedback({ type: "success", text: "CV renamed." });
      }
    } catch {
      setFeedback({ type: "error", text: "Network error while renaming CV." });
    } finally {
      setBusyId(null);
    }
  }

  async function handleDuplicate(cvId: string) {
    setBusyId(cvId);
    setFeedback(null);
    try {
      const res = await fetch(`/api/cvs/${cvId}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        if (data.limitReached) {
          setIsExhaustedModal(true);
        }
        setFeedback({ type: "error", text: data.error || "Could not duplicate CV." });
      } else {
        setCvs((prev) => [data.cv, ...prev]);
        setFeedback({ type: "success", text: "CV duplicated cleanly." });
        router.refresh();
      }
    } catch {
      setFeedback({ type: "error", text: "Network error while duplicating CV." });
    } finally {
      setBusyId(null);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    setFeedback(null);
    try {
      const res = await fetch(`/api/cvs/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFeedback({ type: "error", text: data.error || "Failed to delete CV." });
      } else {
        setCvs((prev) => prev.filter((c) => c.id !== deleteTarget.id));
        setFeedback({ type: "success", text: `Deleted "${deleteTarget.title}".` });
        router.refresh();
      }
    } catch {
      setFeedback({ type: "error", text: "Network error while deleting CV." });
    } finally {
      setBusyId(null);
      setDeleteTarget(null);
    }
  }

  if (cvs.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#173B30]/10 dark:bg-[#34D399]/10 text-[#173B30] dark:text-[#34D399]">
          <FileText className="h-6 w-6" />
        </div>
        <h3 className="mt-4 font-editorial text-xl text-[#252821] dark:text-white">No saved CVs yet</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-[#77786F] dark:text-[#CBD5E1]">
          Start with our guided builder to create your first CV from scratch, or upload an
          existing PDF or Word document to improve it.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/create" className={buttonVariants({ variant: "primary" })}>
            Build a new CV
          </Link>
          <Link href="/upload" className={buttonVariants({ variant: "outline" })}>
            Improve existing CV
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-lg border px-4 py-2.5 text-sm ${feedback.type === "success"
            ? "border-[#173B30]/30 bg-[#173B30]/8 dark:bg-[#0E2E23] text-[#173B30] dark:text-[#34D399]"
            : "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50 text-red-900 dark:text-red-300"
            }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {cvs.map((cv) => {
          const tplName =
            TEMPLATE_METADATA.find((t) => t.id === cv.templateId)?.name || cv.templateId;
          const isRenaming = renamingId === cv.id;

          return (
            <Card key={cv.id} className="flex flex-col justify-between p-5">
              <div>
                <div className="flex items-start justify-between gap-3">
                  {isRenaming ? (
                    <div className="flex flex-1 items-center gap-2">
                      <Input
                        value={renameText}
                        onChange={(e) => setRenameText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRenameSubmit(cv.id);
                          if (e.key === "Escape") setRenamingId(null);
                        }}
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={() => handleRenameSubmit(cv.id)}
                        disabled={busyId === cv.id}
                      >
                        Save
                      </Button>
                    </div>
                  ) : (
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold text-[#252821] dark:text-white">{cv.title}</h3>
                      <p suppressHydrationWarning className="mt-1 text-xs text-[#77786F] dark:text-[#CBD5E1]">
                        Last modified: {formatRelativeDate(cv.updatedAt)}
                      </p>
                    </div>
                  )}

                  <Badge
                    variant={
                      cv.status === "complete"
                        ? "forest"
                        : cv.status === "tailored"
                          ? "gold"
                          : "neutral"
                    }
                  >
                    {cv.status}
                  </Badge>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#77786F] dark:text-[#CBD5E1]">
                  <span>Template: {tplName}</span>
                  <span>·</span>
                  <span>
                    {cv.structuredContent.personalInfo.fullName || "Incomplete name"}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-[#E2DDD2] dark:border-[#333C52] pt-3.5">
                <div className="flex flex-wrap items-center gap-2">
                  {cv.status === "draft" ? (
                    <>
                      <Link
                        href={`/create/personal-information?cvId=${cv.id}`}
                        className={buttonVariants({ variant: "primary", size: "sm" })}
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Continue building
                      </Link>
                      <Link
                        href={`/editor/${cv.id}`}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        Open editor
                      </Link>
                    </>
                  ) : (
                    <Link
                      href={`/editor/${cv.id}`}
                      className={buttonVariants({ variant: "primary", size: "sm" })}
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Open editor
                    </Link>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(cv.id, "pdf")}
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>PDF</span>
                    {!hasActiveSubscription && <Lock className="h-3 w-3 text-amber-600 ml-0.5" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(cv.id, "docx")}
                  >
                    <span>DOCX</span>
                    {!hasActiveSubscription && <Lock className="h-3 w-3 text-amber-600 ml-0.5" />}
                  </Button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setRenamingId(cv.id);
                      setRenameText(cv.title);
                    }}
                    title="Rename CV"
                    className="rounded-md p-2 text-[#77786F] dark:text-[#CBD5E1] hover:bg-[#F6F3ED] dark:hover:bg-[#242A3D] hover:text-[#252821] dark:hover:text-white cursor-pointer"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDuplicate(cv.id)}
                    disabled={busyId === cv.id}
                    title="Duplicate CV"
                    className="rounded-md p-2 text-[#77786F] dark:text-[#CBD5E1] hover:bg-[#F6F3ED] dark:hover:bg-[#242A3D] hover:text-[#252821] dark:hover:text-white cursor-pointer"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(cv)}
                    disabled={busyId === cv.id}
                    title="Delete CV"
                    className="rounded-md p-2 text-[#77786F] dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-[#8F2424] dark:hover:text-red-300 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this CV?"
        description={`Are you sure you want to permanently delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete CV"
        loading={Boolean(busyId)}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <SubscriptionRequiredModal
        open={showSubModal || isExhaustedModal}
        onClose={() => {
          setShowSubModal(false);
          setIsExhaustedModal(false);
        }}
        cvId={subModalCvId}
        format={subModalFormat}
        isExhausted={isExhaustedModal}
      />
    </div>
  );
}

