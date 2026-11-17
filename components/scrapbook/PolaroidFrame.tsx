import React from "react";
import { cn } from "@/lib/utils";
import { WashiTape } from "./WashiTape";

interface PolaroidFrameProps {
  children?: React.ReactNode;
  caption?: string;
  className?: string;
  tapeColor?: "blue" | "yellow" | "pink" | "white" | "mint";
  rotation?: "left" | "right" | "none";
}

export function PolaroidFrame({
  children,
  caption,
  className,
  tapeColor = "blue",
  rotation = "left",
}: PolaroidFrameProps) {
  const rotationClass = {
    left: "-rotate-3 hover:-rotate-1",
    right: "rotate-2 hover:rotate-0",
    none: "rotate-0",
  }[rotation];

  return (
    <div
      className={cn(
        "relative transition-transform duration-300 ease-out select-none cursor-pointer interactive-tap active:scale-95",
        rotationClass,
        className
      )}
    >
      {/* Top Left Washi Tape */}
      <WashiTape
        color={tapeColor}
        angle="steep-left"
        className="-top-3 -left-3"
      />

      {/* Top Right Washi Tape */}
      <WashiTape
        color={tapeColor}
        angle="steep-right"
        className="-top-3 -right-3"
      />

      {/* Polaroid Body */}
      <div className="rounded-sm border border-black/10 dark:border-[#333C52] bg-white dark:bg-[#1E2333] p-2.5 pb-5 shadow-[0_8px_20px_rgba(0,0,0,0.14)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.5)]">
        {/* Photo Canvas */}
        <div className="relative overflow-hidden rounded-[2px] bg-[#E8ECEF] dark:bg-[#283046] aspect-[4/5] sm:aspect-square flex items-center justify-center">
          {children}
        </div>

        {/* Handwritten Chin Caption */}
        {caption && (
          <p className="mt-2 text-center font-handwriting text-base font-semibold tracking-wide text-[#333333] dark:text-[#E2E8F0]">
            {caption}
          </p>
        )}
      </div>
    </div>
  );
}

