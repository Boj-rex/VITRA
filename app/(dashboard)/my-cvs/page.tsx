import React from "react";
import Link from "next/link";
import { FilePlus2, FileUp } from "lucide-react";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { cvService } from "@/services/cv-service";
import { buttonVariants } from "@/components/ui/button";
import { CvCardList } from "@/components/dashboard/CvCardList";

export const metadata = {
  title: "My CVs",
};

export default async function MyCvsPage() {
  const user = await requireAuthenticatedUser();
  const cvs = await cvService.listCvs(user.id);
  const hasActiveSubscription = user.role === "admin" || Boolean(user.planId && user.maxCvs > 0);
  const usedCount = Math.max(user.generatedCvsCount ?? 0, cvs.length);
  const isLimitReached = user.role !== "admin" && user.maxCvs > 0 && usedCount >= user.maxCvs;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#173B30] dark:text-[#34D399]">
            Saved Documents
          </p>
          <h1 className="mt-1 font-editorial text-3xl text-[#252821] dark:text-white">My CVs</h1>
          <p className="mt-1 text-sm text-[#77786F] dark:text-[#94A3B8]">
            All drafts, completed CVs, and job-tailored versions saved to your private account.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {isLimitReached ? (
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 rounded-[6px] border-2 border-black dark:border-[#333C52] bg-[#FEF3C7] dark:bg-[#252210] px-3.5 py-2 font-tech text-xs font-bold text-[#92400E] dark:text-[#FBBF24] shadow-[2px_2px_0px_#111111] hover:bg-[#FDE68A] transition-all"
            >
              <span>Access Exhausted ({usedCount}/{user.maxCvs} Used) — Pay Another Premium</span>
            </Link>
          ) : (
            <>
              <Link href="/create" className={buttonVariants({ variant: "primary", size: "sm" })}>
                <FilePlus2 className="h-4 w-4" />
                New CV
              </Link>
              <Link href="/upload" className={buttonVariants({ variant: "outline", size: "sm" })}>
                <FileUp className="h-4 w-4" />
                Upload CV
              </Link>
            </>
          )}
        </div>
      </div>

      {isLimitReached && (
        <div className="rounded-xl border-2 border-[#B45309]/30 bg-[#FEF3C7] dark:bg-[#252210] p-4 text-xs font-tech text-[#92400E] dark:text-[#FBBF24] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <strong className="block font-bold">You have consumed all {user.maxCvs} CV generations on your {user.planId ? user.planId.toUpperCase() : "active"} package.</strong>
            <span>Deleting existing CVs does not restore generation credits. Please pay another premium to continue using our services and generate additional CVs.</span>
          </div>
          <Link href="/pricing" className="shrink-0 font-bold underline hover:no-underline">
            Pay Another Premium
          </Link>
        </div>
      )}

      <CvCardList initialCvs={cvs} hasActiveSubscription={hasActiveSubscription} />
    </div>
  );
}
