import React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface VitraLogoProps {
  href?: string;
  compact?: boolean;
  className?: string;
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg";
}

export function VitraLogo({
  href = "/",
  compact = false,
  className,
  iconOnly = false,
  size,
}: VitraLogoProps) {
  const resolvedSize = size ?? (compact ? "sm" : "md");

  const heightClass = {
    sm: "h-6 sm:h-7.5",
    md: "h-7 sm:h-9",
    lg: "h-10 sm:h-11",
  }[resolvedSize];

  const inner = (
    <span
      className={cn(
        "inline-flex items-center group select-none transition-transform duration-200 hover:scale-105",
        className
      )}
    >
      {iconOnly ? (
        /* Standalone Squircle Icon */
        <Image
          src="/brand/vitra-icon.png"
          alt="Vitra icon — ATS CV Studio"
          width={resolvedSize === "lg" ? 48 : resolvedSize === "sm" ? 30 : 38}
          height={resolvedSize === "lg" ? 48 : resolvedSize === "sm" ? 30 : 38}
          className={cn(
            "shrink-0 object-contain drop-shadow-sm",
            resolvedSize === "lg"
              ? "h-11 w-11"
              : resolvedSize === "sm"
              ? "h-7 w-7"
              : "h-9 w-9 sm:h-10 sm:w-10"
          )}
          priority
        />
      ) : (
        /* Horizontal Brand Lockup (Yellow Squircle + VITRA Typography) */
        <span className="inline-flex items-center">
          {/* Light Mode Horizontal Logo (Black Typography) */}
          <Image
            src="/brand/vitra-nav-logo.png"
            alt="Vitra — Thoughtful ATS CV Studio logo"
            width={144}
            height={40}
            className={cn("w-auto object-contain dark:hidden drop-shadow-sm", heightClass)}
            priority
          />
          {/* Dark Mode Horizontal Logo (Crisp White Typography) */}
          <Image
            src="/brand/vitra-nav-logo-dark.png"
            alt="Vitra — Thoughtful ATS CV Studio logo"
            width={144}
            height={40}
            className={cn("w-auto object-contain hidden dark:inline-block drop-shadow-sm", heightClass)}
            priority
          />
        </span>
      )}
    </span>
  );

  if (!href) return inner;
  return (
    <Link
      href={href}
      className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-xl"
      aria-label="Vitra home"
    >
      {inner}
    </Link>
  );
}
