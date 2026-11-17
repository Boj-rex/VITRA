import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { cvService } from "@/services/cv-service";
import { generateCvPdfBuffer } from "@/lib/document-generation/pdf-generator";
import { generateCvDocxBuffer } from "@/lib/document-generation/docx-generator";
import { sanitizeFilename } from "@/lib/utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ cvId: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // Subscription verification: Users must have an active paid subscription to download completed CVs
  if (!user.planId || user.maxCvs <= 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "A paid subscription is required to download your completed CV. Please activate a package.",
        paymentRequired: true,
        plansUrl: "/pricing",
      },
      { status: 403 }
    );
  }

  const { cvId } = await params;
  const cv = await cvService.getCv(cvId, user.id);
  if (!cv) {
    return NextResponse.json({ ok: false, error: "CV not found." }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") === "docx" ? "docx" : "pdf";
  const baseName = sanitizeFilename(cv.structuredContent.personalInfo.fullName || cv.title || "vitra_cv");

  try {
    if (format === "docx") {
      const buffer = await generateCvDocxBuffer(
        cv.structuredContent,
        cv.templateId,
        cv.settings
      );
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${baseName}.docx"`,
          "Cache-Control": "no-store",
        },
      });
    }

    const buffer = await generateCvPdfBuffer(
      cv.structuredContent,
      cv.templateId,
      cv.settings
    );
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${baseName}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Export failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

