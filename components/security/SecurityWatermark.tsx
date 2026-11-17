import React from "react";

export function SecurityWatermark({ text = "VITRA SECURE · DO NOT CAPTURE" }: { text?: string }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden select-none opacity-[0.045]"
    >
      <div className="flex h-full w-full rotate-[-25deg] scale-125 flex-wrap items-center justify-around gap-16 font-mono text-[13px] font-bold tracking-widest text-[#252821]">
        {Array.from({ length: 18 }).map((_, i) => (
          <span key={i} className="whitespace-nowrap uppercase">
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}

