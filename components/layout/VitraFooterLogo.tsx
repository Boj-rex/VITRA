import React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface VitraFooterLogoProps {
  href?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function VitraFooterLogo({
  href = "/",
  className,
  size = "md",
}: VitraFooterLogoProps) {
  const heightClass = {
    sm: "h-12 sm:h-14",
    md: "h-14 sm:h-16",
    lg: "h-16 sm:h-20",
  }[size];

  const inner = (
    <span className={cn("inline-flex flex-col items-start group select-none transition-transform hover:scale-105", className)}>
      {/* Light Mode Footer Logo (Black Text) */}
      <Image
        src="/brand/vitra-footer-logo.png"
        alt="Vitra Career Studio official logo"
        width={120}
        height={148}
        className={cn("w-auto object-contain dark:hidden drop-shadow-sm", heightClass)}
      />
      {/* Dark Mode Footer Logo (Crisp White Text) */}
      <Image
        src="/brand/vitra-footer-logo-dark.png"
        alt="Vitra Career Studio official logo"
        width={120}
        height={148}
        className={cn("w-auto object-contain hidden dark:inline-block drop-shadow-sm", heightClass)}
      />
    </span>
  );

  if (!href) return inner;
  return (
    <Link
      href={href}
      className="inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-xl"
      aria-label="Vitra home"
    >
      {inner}
    </Link>
  );
}

