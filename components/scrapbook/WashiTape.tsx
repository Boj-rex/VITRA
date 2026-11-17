import React from "react";
import { cn } from "@/lib/utils";

interface WashiTapeProps {
  className?: string;
  color?: "blue" | "yellow" | "pink" | "white" | "mint";
  angle?: "left" | "right" | "horizontal" | "steep-left" | "steep-right";
}

export function WashiTape({
  className,
  color = "blue",
  angle = "left",
}: WashiTapeProps) {
  const colorClasses = {
    blue: "bg-[#B4CDFA]/80 border-t border-b border-[#9DBAF2]/40",
    yellow: "bg-[#FEF08A]/85 border-t border-b border-[#FACC15]/40",
    pink: "bg-[#FBCFE8]/85 border-t border-b border-[#F472B6]/40",
    white: "bg-white/80 border-t border-b border-black/10",
    mint: "bg-[#A7F3D0]/80 border-t border-b border-[#34D399]/40",
  }[color];

  const angleClasses = {
    left: "-rotate-6",
    right: "rotate-6",
    horizontal: "rotate-0",
    "steep-left": "-rotate-12",
    "steep-right": "rotate-12",
  }[angle];

  return (
    <div
      aria-hidden="true"
      className={cn(
        "absolute z-20 h-5 w-16 sm:w-20 backdrop-blur-[1px] transition-transform duration-200 hover:scale-105 active:scale-95 cursor-pointer",
        "shadow-[0_1px_3px_rgba(0,0,0,0.12)]",
        colorClasses,
        angleClasses,
        className
      )}
      style={{
        clipPath: "polygon(0% 0%, 4% 50%, 0% 100%, 100% 100%, 96% 50%, 100% 0%)",
      }}
    />
  );
}

