import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { createCvRequestSchema } from "@/lib/validation/cv-schemas";
import { cvService } from "@/services/cv-service";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cvs = await cvService.listCvs(user.id);
    return NextResponse.json({ ok: true, cvs });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load CVs.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

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
    const body = await request.json();
    const parsed = createCvRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message || "Invalid CV data." },
        { status: 400 }
      );
    }

    const cv = await cvService.createCv({
      userId: user.id,
      ...parsed.data,
    });

    return NextResponse.json({ ok: true, cv }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create CV.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

