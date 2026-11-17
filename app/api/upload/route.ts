import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getSystemStatus } from "@/lib/config/env";
import {
  extractTextFromCvBuffer,
  validateUploadedCvFile,
} from "@/lib/document-processing/extractor";
import { parseRawTextToStructuredCv } from "@/lib/document-processing/cv-parser";
import { parseCvTextWithAi } from "@/lib/ai/openai-service";
import { createDefaultEditorSettings } from "@/lib/cv/defaults";
import { evaluateCvQuality } from "@/lib/cv/ats-checker";
import { cvService } from "@/services/cv-service";
import type { CvAnalysisResult } from "@/types/cv";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // Strict quota restriction based on cumulative generations paid for
  const quotaCheck = await cvService.assertCanCreateCv(user.id, user);
  if (!quotaCheck.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: quotaCheck.error,
        limitReached: true,
        currentCount: quotaCheck.usedCount,
        maxCvs: quotaCheck.maxCvs,
        activeCount: quotaCheck.activeCount,
        upgradeUrl: "/pricing",
      },
      { status: 403 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "Please attach a PDF or DOCX CV file." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const { maxUploadBytes, aiConfigured } = getSystemStatus();

    const validation = validateUploadedCvFile(file.name, file.type, buffer, maxUploadBytes);
    if (!validation.ok) {
      return NextResponse.json({ ok: false, error: validation.error }, { status: 400 });
    }

    const { text: extractedText, warnings } = await extractTextFromCvBuffer(
      buffer,
      validation.fileType
    );

    // Parse with configured AI provider if active, otherwise fallback cleanly to deterministic structured parser
    let parsedResult = parseRawTextToStructuredCv(extractedText);
    let extractionMethod: "ai" | "deterministic-parser" = "deterministic-parser";

    if (aiConfigured && extractedText.length >= 40) {
      const aiParsed = await parseCvTextWithAi(user.id, extractedText);
      if (aiParsed.ok) {
        parsedResult = {
          structured: aiParsed.data.structured,
          uncertainFields: aiParsed.data.uncertainFields,
        };
        extractionMethod = "ai";
      }
    }

    const titleBase = file.name.replace(/\.(pdf|docx)$/i, "").slice(0, 60) || "Uploaded CV";
    const cv = await cvService.createCv({
      userId: user.id,
      title: `${titleBase} (Improved)`,
      careerProfile: parsedResult.structured.experience.length > 0
        ? "experienced-professional"
        : "recent-graduate",
      templateId: "classic-professional",
      structuredContent: parsedResult.structured,
      settings: createDefaultEditorSettings(
        parsedResult.structured.experience.length > 0
          ? "experienced-professional"
          : "recent-graduate"
      ),
      status: "draft",
    });

    // Preserve the untouched original document separately
    const uploadRecord = await cvService.saveUploadedOriginal({
      userId: user.id,
      cvId: cv.id,
      fileName: file.name,
      fileType: validation.fileType,
      buffer,
      extractedText,
      status: "extracted",
    });

    // Save initial baseline structural quality check
    const quality = evaluateCvQuality(parsedResult.structured);
    const initialAnalysis: CvAnalysisResult = {
      overallSummary:
        aiConfigured
          ? "Initial document extraction complete. Run full AI review in the analysis workspace for tailored line-by-line suggestions."
          : "Document extraction complete using Vitra's structured parser. Review the extracted fields below and check the structural quality findings.",
      strengths: quality.checks.filter((c) => c.passed).map((c) => c.label),
      missingInformation: [
        ...parsedResult.uncertainFields,
        ...quality.checks.filter((c) => !c.passed).map((c) => c.note),
      ],
      recommendations: [],
      atsReadabilityChecks: quality.checks.map((c) => ({
        label: c.label,
        passed: c.passed,
        note: c.note,
      })),
      generatedAt: new Date().toISOString(),
    };

    await cvService.saveAnalysis(cv.id, user.id, initialAnalysis);

    return NextResponse.json({
      ok: true,
      cvId: cv.id,
      uploadId: uploadRecord?.id || null,
      extractedText,
      warnings,
      uncertainFields: parsedResult.uncertainFields,
      extractionMethod,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to process uploaded CV.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const uploadId = searchParams.get("uploadId");
  if (!uploadId) {
    return NextResponse.json({ ok: false, error: "uploadId is required." }, { status: 400 });
  }
  const deleted = await cvService.deleteUpload(uploadId, user.id);
  if (!deleted) {
    return NextResponse.json({ ok: false, error: "Uploaded file not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

