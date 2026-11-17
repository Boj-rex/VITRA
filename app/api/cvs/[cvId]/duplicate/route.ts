import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { cvService } from "@/services/cv-service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ cvId: string }> }
) {
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

  const { cvId } = await params;
  const copy = await cvService.duplicateCv(cvId, user.id);
  if (!copy) {
    return NextResponse.json({ ok: false, error: "CV not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, cv: copy }, { status: 201 });
}

