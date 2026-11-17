"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileUp, Loader2, ShieldCheck, FileText, Sparkles } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function UploadCvPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);

  function handleFileSelect(file: File | null) {
    setError(null);
    if (!file) return;
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".pdf") && !lower.endsWith(".docx")) {
      setError("Only PDF (.pdf) and Word (.docx) files are accepted.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File exceeds the 10 MB maximum upload limit.");
      return;
    }
    setSelectedFile(file);
  }

  async function handleUpload() {
    if (!selectedFile) return;
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Unable to process uploaded CV.");
        setLimitReached(Boolean(data.limitReached));
        return;
      }

      const params = new URLSearchParams({
        cvId: data.cvId,
        method: data.extractionMethod || "deterministic-parser",
      });
      if (data.warnings?.length) {
        params.set("warn", data.warnings.join(" | "));
      }
      router.push(`/analysis?${params.toString()}`);
    } catch {
      setError("Network error while uploading file.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#173B30]">
          Existing CV Improvement
        </p>
        <h1 className="mt-1 font-editorial text-3xl text-[#252821]">
          Upload & upgrade your CV
        </h1>
        <p className="mt-2 text-sm text-[#77786F]">
          Upload a PDF or Word (.docx) file up to 10 MB. Your original file is kept safely
          separate and never overwritten.
        </p>
      </div>

      <Card className="p-6 sm:p-8">
        <label
          htmlFor="cv-file-input"
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFileSelect(e.dataTransfer.files?.[0] || null);
          }}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-colors cursor-pointer ${
            dragging
              ? "border-[#173B30] bg-[#173B30]/5"
              : "border-[#CFC9BC] bg-[#F6F3ED]/60 hover:border-[#173B30]/60"
          }`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#173B30]/10 text-[#173B30]">
            <FileUp className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm font-semibold text-[#252821]">
            Drag and drop your CV here, or click to browse
          </p>
          <p className="mt-1 text-xs text-[#77786F]">
            Supports PDF (.pdf) and Word (.docx) · Max 10 MB
          </p>
          <input
            id="cv-file-input"
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
          />
        </label>

        {selectedFile && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#E2DDD2] bg-[#F6F3ED] p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-[#173B30]" />
              <div>
                <p className="text-sm font-medium text-[#252821]">{selectedFile.name}</p>
                <p className="text-xs text-[#77786F]">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <Button variant="primary" onClick={handleUpload} disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Extracting & analyzing...
                </>
              ) : (
                "Extract & review CV"
              )}
            </Button>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border-2 border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-900 dark:text-red-200 space-y-3">
            <p className="font-medium">{error}</p>
            {limitReached && (
              <div className="pt-1 flex flex-wrap items-center gap-3">
                <Link
                  href="/pricing"
                  className={buttonVariants({ variant: "primary", size: "sm" })}
                >
                  <Sparkles className="h-4 w-4" />
                  Pay Another Premium & Renew Access
                </Link>
                <Link
                  href="/my-cvs"
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Manage Existing CVs
                </Link>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex items-start gap-2.5 rounded-lg bg-[#F6F3ED] p-4 text-xs text-[#77786F]">
          <ShieldCheck className="h-4 w-4 shrink-0 text-[#173B30]" />
          <p>
            Vitra validates file signatures on the server, stores your original document in private
            account storage, and extracts text so you can verify every field before editing.
          </p>
        </div>
      </Card>
    </div>
  );
}

