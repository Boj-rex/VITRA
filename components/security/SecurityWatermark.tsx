import React from "react";

export function SecurityWatermark({
  text = "VITRA SECURE · DO NOT SCREENSHOT · EXPORT FOR CLEAN COPY",
}: {
  text?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden select-none opacity-[0.13] dark:opacity-[0.18]"
    >
      <div className="flex h-full w-full rotate-[-26deg] scale-125 flex-wrap items-center justify-around gap-12 font-mono text-[11px] font-black tracking-widest text-[#111111] dark:text-white">
        {Array.from({ length: 36 }).map((_, i) => (
          <span key={i} className="whitespace-nowrap uppercase select-none">
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}
