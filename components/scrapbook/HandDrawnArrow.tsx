import React from "react";
import { cn } from "@/lib/utils";

interface HandDrawnArrowProps {
  direction?: "curve-right" | "curve-left" | "down-curve";
  className?: string;
  color?: string;
}

export function HandDrawnArrow({
  direction = "curve-right",
  className,
  color = "#252821",
}: HandDrawnArrowProps) {
  if (direction === "curve-right") {
    // Arrow curving up and to the right
    return (
      <svg
        className={cn("w-10 h-7 overflow-visible pointer-events-none", className)}
        viewBox="0 0 45 30"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M3 24C12 25 24 20 38 6"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M30 6H39V15"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (direction === "curve-left") {
    // Arrow curving up and to the left
    return (
      <svg
        className={cn("w-10 h-7 overflow-visible pointer-events-none", className)}
        viewBox="0 0 45 30"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M42 24C33 25 21 20 7 6"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M15 6H6V15"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // Downward wiggle
  return (
    <svg
      className={cn("w-6 h-12 overflow-visible pointer-events-none", className)}
      viewBox="0 0 24 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 4C14 16 8 26 12 40"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M6 34L12 41L18 34"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

