import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { updateCvRequestSchema } from "@/lib/validation/cv-schemas";
import { cvService } from "@/services/cv-service";

export async function GET(
  _request: Request,
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

  const analysis = await cvService.getLatestAnalysis(cvId, user.id);
  return NextResponse.json({ ok: true, cv, analysis });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ cvId: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { cvId } = await params;
    const body = await request.json();
    const parsed = updateCvRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message || "Invalid update data." },
        { status: 400 }
      );
    }

    const updated = await cvService.updateCv(cvId, user.id, parsed.data);
    if (!updated) {
      return NextResponse.json({ ok: false, error: "CV not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, cv: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save CV.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ cvId: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { cvId } = await params;
  const deleted = await cvService.deleteCv(cvId, user.id);
  if (!deleted) {
    return NextResponse.json({ ok: false, error: "CV not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

