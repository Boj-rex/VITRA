import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { cvService } from "@/services/cv-service";

const snapshotSchema = z.object({
  label: z.string().trim().min(1).max(120).default("Saved snapshot"),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ cvId: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { cvId } = await params;
  const cv = await cvService.getCv(cvId, user.id);
  if (!cv) {
    return NextResponse.json({ ok: false, error: "CV not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = snapshotSchema.safeParse(body);
  const label = parsed.success ? parsed.data.label : "Saved snapshot";

  const version = await cvService.createVersionSnapshot(
    cv.id,
    user.id,
    label,
    cv.templateId,
    cv.structuredContent
  );

  return NextResponse.json({ ok: true, version }, { status: 201 });
}

