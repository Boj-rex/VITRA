import React, { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertCircle, CreditCard } from "lucide-react";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { cvService } from "@/services/cv-service";
import { CvWizard, type WizardStepKey } from "@/components/cv-builder/CvWizard";
import { WashiTape } from "@/components/scrapbook/WashiTape";

const VALID_STEPS: WizardStepKey[] = [
  "profile",
  "personal-information",
  "summary",
  "education",
  "experience",
  "skills",
  "projects",
];

export default async function CreateCvStepPage({
  params,
  searchParams,
}: {
  params: Promise<{ step: string }>;
  searchParams?: Promise<{ cvId?: string }>;
}) {
  const { step } = await params;
  if (!VALID_STEPS.includes(step as WizardStepKey)) {
    notFound();
  }

  const { cvId } = (await searchParams) || {};
  const user = await requireAuthenticatedUser("/login");
  const cvs = await cvService.listCvs(user.id);
  const isEditingExisting = Boolean(cvId && cvs.some((c) => c.id === cvId));
  const usedCount = Math.max(user.generatedCvsCount ?? 0, cvs.length);
  const isExhausted = user.role !== "admin" && !isEditingExisting && user.maxCvs > 0 && usedCount >= user.maxCvs;

  if (isExhausted) {
    return (
      <div className="mx-auto max-w-2xl py-8 px-4 font-tech space-y-6">
        <div className="relative rounded-2xl border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#1E2333] p-6 sm:p-8 shadow-sticker text-center space-y-4">
          <WashiTape color="yellow" angle="horizontal" className="-top-3 left-1/2 -translate-x-1/2" />

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-black dark:border-[#333C52] bg-[#FEF3C7] dark:bg-[#252210] text-[#92400E] dark:text-[#FBBF24]">
            <AlertCircle className="h-7 w-7" />
          </div>

          <div className="space-y-2">
            <span className="inline-block rounded-full bg-[#FEF3C7] dark:bg-[#252210] px-3 py-1 text-xs font-bold text-[#92400E] dark:text-[#FBBF24] border border-[#92400E]/20">
              PACKAGE ACCESS EXHAUSTED ({usedCount}/{user.maxCvs} CVs Used)
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] dark:text-white">
              Pay Another Premium to Continue
            </h1>
            <p className="text-xs sm:text-sm text-[#55564E] dark:text-[#CBD5E1] max-w-md mx-auto leading-relaxed">
              You have consumed all {user.maxCvs} CV generations allocated to your {user.planId ? user.planId.toUpperCase() : "active"} package. Note: deleting existing CVs does not restore generation credits. To create, tailor, or save new CVs, please select a package and pay another premium.
            </p>
          </div>

          <div className="rounded-xl border border-black/10 dark:border-white/10 bg-[#FAF8F5] dark:bg-[#141722] p-4 text-xs text-left space-y-2">
            <p className="font-bold text-[#111111] dark:text-white">Available Packages &amp; Allowances:</p>
            <div className="grid sm:grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border border-black/10 bg-white dark:bg-[#1E2333] p-2.5">
                <p className="font-bold text-sm">₦6,000</p>
                <p className="text-[10px] text-[#77786F]">Starter (2 CVs)</p>
              </div>
              <div className="rounded-lg border-2 border-[#10B981] bg-white dark:bg-[#1E2333] p-2.5">
                <p className="font-bold text-sm text-[#10B981]">₦15,000</p>
                <p className="text-[10px] text-[#77786F]">Pro (Up to 6 CVs)</p>
              </div>
              <div className="rounded-lg border border-black/10 bg-white dark:bg-[#1E2333] p-2.5">
                <p className="font-bold text-sm">₦20,000</p>
                <p className="text-[10px] text-[#77786F]">Executive (Up to 13 CVs)</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto rounded-xl border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#1E2333] px-5 py-3 text-xs font-bold text-[#111111] dark:text-white shadow-[2px_2px_0px_#111111] hover:bg-gray-50 transition-all text-center"
            >
              Back to Dashboard
            </Link>
            <Link
              href="/pricing"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border-2 border-black dark:border-[#333C52] bg-[#F8D849] dark:bg-[#252210] px-6 py-3 text-xs font-bold text-[#111111] dark:text-[#FEF08A] shadow-[3px_3px_0px_#111111] hover:bg-[#FACC15] transition-all text-center"
            >
              <CreditCard className="h-4 w-4" />
              <span>Pay Another Premium &amp; Renew Access</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="p-8 text-sm text-[#77786F]">Loading CV step...</div>}>
      <CvWizard initialStep={step as WizardStepKey} />
    </Suspense>
  );
}

