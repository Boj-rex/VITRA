import React from "react";

export function SecurityWatermark({
  text = "VITRA SECURE · DO NOT SCREENSHOT · EXPORT FOR OFFICIAL COPY",
}: {
  text?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden select-none opacity-[0.08] dark:opacity-[0.12]"
    >
      <div className="flex h-full w-full rotate-[-28deg] scale-125 flex-wrap items-center justify-around gap-14 font-mono text-[11px] font-extrabold tracking-widest text-[#111111] dark:text-[#CBD5E1]">
        {Array.from({ length: 28 }).map((_, i) => (
          <span key={i} className="whitespace-nowrap uppercase select-none">
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}
