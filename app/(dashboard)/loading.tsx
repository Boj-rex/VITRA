import React from "react";

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-3 w-32 rounded bg-[#E2DDD2]" />
        <div className="h-9 w-64 rounded bg-[#E2DDD2]" />
        <div className="h-4 w-96 max-w-full rounded bg-[#E2DDD2]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-36 rounded-xl border border-[#E2DDD2] bg-[#FFFEFA]" />
        <div className="h-36 rounded-xl border border-[#E2DDD2] bg-[#FFFEFA]" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-44 rounded-xl border border-[#E2DDD2] bg-[#FFFEFA]" />
        <div className="h-44 rounded-xl border border-[#E2DDD2] bg-[#FFFEFA]" />
      </div>
    </div>
  );
}

