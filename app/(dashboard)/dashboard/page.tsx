import React from "react";
import Link from "next/link";
import { FilePlus2, FileUp, Sparkles, FolderKanban } from "lucide-react";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { cvService } from "@/services/cv-service";
import { CvCardList } from "@/components/dashboard/CvCardList";
import { WashiTape } from "@/components/scrapbook/WashiTape";

export const metadata = {
  title: "Dashboard — Vitra Studio",
};

export default async function DashboardPage() {
  const user = await requireAuthenticatedUser();
  const cvs = await cvService.listCvs(user.id);

  const totalCount = cvs.length;
  const draftCount = cvs.filter((c) => c.status === "draft").length;
  const completedCount = cvs.filter((c) => c.status === "complete").length;
  const tailoredCount = cvs.filter((c) => c.status === "tailored").length;
  const hasActiveSubscription = user.role === "admin" || Boolean(user.planId && user.maxCvs > 0);

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Workspace Header */}
      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border-2 border-[#111111] dark:border-[#333C52] bg-[#D1FAE5] dark:bg-[#0E2E23] px-3 py-0.5 text-[11px] font-bold text-[#065F46] dark:text-[#34D399] font-tech shadow-sticker-sm">
            <span>●</span>
            <span>ACTIVE WORKSPACE</span>
          </span>
          <span className="font-handwriting text-xl text-[#55564E] dark:text-[#CBD5E1] -rotate-1">
            welcome back, {user.fullName.split(" ")[0]}!
          </span>
        </div>

        <h1 className="font-tech text-3xl sm:text-4xl font-bold text-[#111111] dark:text-white">
          Candidate Studio Overview
        </h1>
        <p className="font-tech text-xs sm:text-sm text-[#55564E] dark:text-[#CBD5E1]">
          Craft new ATS-optimized CVs, refine existing documents, and manage role-tailored versions.
        </p>
      </section>

      {/* Summary Metrics Cards */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 font-tech">
        {[
          { label: "Total CVs", value: totalCount, color: "bg-[#FEF9C3] dark:bg-[#252110]", text: "text-[#854D0E] dark:text-[#FBBF24]" },
          { label: "Drafts", value: draftCount, color: "bg-[#E0F2FE] dark:bg-[#0F2942]", text: "text-[#0369A1] dark:text-[#60A5FA]" },
          { label: "Completed", value: completedCount, color: "bg-[#D1FAE5] dark:bg-[#0E2E23]", text: "text-[#065F46] dark:text-[#34D399]" },
          { label: "Tailored", value: tailoredCount, color: "bg-[#FCE7F3] dark:bg-[#361324]", text: "text-[#9D174D] dark:text-[#F472B6]" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#1E2333] p-4 shadow-sticker-sm flex flex-col justify-between"
          >
            <span className="text-[11px] font-bold text-[#55564E] dark:text-[#CBD5E1] uppercase tracking-wider">
              {stat.label}
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="font-pixel text-2xl font-bold text-[#111111] dark:text-white">{stat.value}</span>
              <span className={`h-2.5 w-2.5 rounded-full ${stat.color} border border-black/20 dark:border-white/20`} />
            </div>
          </div>
        ))}
      </section>

      {/* Primary Action Cards */}
      <section className="grid gap-4 sm:grid-cols-2 font-tech">
        <Link href="/create" className="group block">
          <div className="h-full rounded-2xl border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#1E2333] p-6 shadow-sticker hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer relative">
            <WashiTape color="blue" angle="left" className="-top-3 left-6" />

            <div className="flex items-start justify-between">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border-2 border-black dark:border-[#333C52] bg-[#111111] dark:bg-[#10B981] text-white dark:text-black">
                <FilePlus2 className="h-5 w-5" />
              </div>
            </div>
            <h2 className="mt-4 text-lg font-bold text-[#111111] dark:text-white">Create a New CV</h2>
            <p className="mt-1 text-xs text-[#55564E] dark:text-[#CBD5E1] leading-relaxed">
              Guided questions with SSCE, ND, HND, BSc, SIWES, NYSC, and no-experience pathways.
            </p>
          </div>
        </Link>

        <Link href="/upload" className="group block">
          <div className="h-full rounded-2xl border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#1E2333] p-6 shadow-sticker hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer relative">
            <WashiTape color="yellow" angle="right" className="-top-3 right-6" />

            <div className="flex items-start justify-between">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border-2 border-black dark:border-[#333C52] bg-[#F8D849] dark:bg-[#252210] text-[#111111] dark:text-[#FEF08A]">
                <FileUp className="h-5 w-5" />
              </div>
            </div>
            <h2 className="mt-4 text-lg font-bold text-[#111111] dark:text-white">Improve an Existing CV</h2>
            <p className="mt-1 text-xs text-[#55564E] dark:text-[#CBD5E1] leading-relaxed">
              Upload PDF or Word files to extract sections, audit ATS compliance, and fix weak verbs.
            </p>
          </div>
        </Link>
      </section>

      {/* Recent CVs List Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between font-tech">
          <div>
            <span className="font-handwriting text-lg text-[#55564E] dark:text-[#CBD5E1]">your documents</span>
            <h2 className="text-xl font-bold text-[#111111] dark:text-white">Recent CVs &amp; Drafts</h2>
          </div>
          <Link
            href="/my-cvs"
            className="text-xs font-bold text-[#1845E8] dark:text-[#60A5FA] hover:underline"
          >
            VIEW ALL ({totalCount})
          </Link>
        </div>

        <div className="rounded-2xl border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#1E2333] p-4 sm:p-6 shadow-sticker">
          <CvCardList initialCvs={cvs.slice(0, 5)} hasActiveSubscription={hasActiveSubscription} />
        </div>
      </section>
    </div>
  );
}
