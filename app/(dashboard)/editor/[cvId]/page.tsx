import React from "react";
import { notFound } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { cvService } from "@/services/cv-service";
import { CvEditorWorkspace } from "@/components/cv-editor/CvEditorWorkspace";

export const metadata = {
  title: "CV Editor",
};

export default async function CvEditorPage({
  params,
}: {
  params: Promise<{ cvId: string }>;
}) {
  const user = await requireAuthenticatedUser("/login");
  const { cvId } = await params;

  const cv = await cvService.getCv(cvId, user.id);
  if (!cv) {
    notFound();
  }

  const hasActiveSubscription = user.role === "admin" || Boolean(user.planId && user.maxCvs > 0);

  return <CvEditorWorkspace initialCv={cv} hasActiveSubscription={hasActiveSubscription} />;
}

