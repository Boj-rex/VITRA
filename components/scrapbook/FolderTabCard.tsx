import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { WashiTape } from "./WashiTape";

interface FolderTabCardProps {
  tabLabel: string;
  tabColor?: "blue" | "yellow" | "forest" | "dark";
  theme?: "dark" | "yellow" | "forest";
  date?: string;
  title: string;
  description: string;
  linkText?: string;
  linkHref?: string;
  children?: React.ReactNode;
  className?: string;
}

export function FolderTabCard({
  tabLabel,
  tabColor = "blue",
  theme = "dark",
  date,
  title,
  description,
  linkText = "VIEW FEATURE",
  linkHref = "/create",
  children,
  className,
}: FolderTabCardProps) {
  const tabStyles = {
    blue: "bg-[#1845E8] text-white",
    yellow: "bg-[#F5C518] text-[#111111]",
    forest: "bg-[#173B30] text-white",
    dark: "bg-[#252821] text-white",
  }[tabColor];

  const bodyStyles = {
    dark: "bg-[#141619] dark:bg-[#1E2333] text-[#F3F4F6] border border-[#2D3139] dark:border-[#333C52]",
    yellow: "bg-[#F9D648] dark:bg-[#252110] text-[#111111] dark:text-[#FEF08A] border border-[#E5BE32] dark:border-[#4D3914]",
    forest: "bg-[#173B30] dark:bg-[#0E2E23] text-[#FFFEFA] border border-[#112921] dark:border-[#174233]",
  }[theme];

  const linkColorStyles = {
    dark: "text-white/90 hover:text-white border-b border-white/40",
    yellow: "text-[#111111] dark:text-[#FEF08A] hover:text-black dark:hover:text-white border-b border-black/40 dark:border-[#FEF08A]/40",
    forest: "text-[#C4A46B] hover:text-white border-b border-[#C4A46B]/40",
  }[theme];

  return (
    <div className={cn("relative mt-6 group select-none", className)}>
      {/* Chamfered Folder Tab Header */}
      <div className="flex items-center">
        <div
          className={cn(
            "relative z-10 inline-flex items-center gap-2 px-5 py-2 text-xs font-bold uppercase tracking-wider",
            tabStyles
          )}
          style={{
            clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 100%, 0 100%)",
            paddingRight: "28px",
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
          <span className="font-tech">{tabLabel}</span>
        </div>
      </div>

      {/* Main Folder Card Body */}
      <div
        className={cn(
          "relative -mt-[1px] rounded-b-2xl rounded-tr-2xl p-6 sm:p-9 shadow-[0_12px_30px_rgba(0,0,0,0.18)]",
          bodyStyles
        )}
      >
        <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
          {/* Left Column: Metadata & Copy */}
          <div className="lg:col-span-6 space-y-4">
            {date && (
              <p
                className={cn(
                  "font-tech text-xs uppercase tracking-widest font-semibold flex items-center gap-1.5",
                  theme === "yellow" ? "text-black/70 dark:text-[#FEF08A]/70" : "text-white/60"
                )}
              >
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
                {date}
              </p>
            )}

            <h3 className="font-tech text-3xl sm:text-4xl font-bold tracking-tight">
              {title}
            </h3>

            <p
              className={cn(
                "text-sm sm:text-base leading-relaxed max-w-md",
                theme === "yellow" ? "text-[#2B2B2B] dark:text-[#F3F4F6]" : "text-[#B8BDC6]"
              )}
            >
              {description}
            </p>

            <div className="pt-2">
              <Link
                href={linkHref}
                className={cn(
                  "inline-flex items-center gap-1.5 font-tech text-xs font-bold uppercase tracking-wider transition-colors pb-0.5",
                  linkColorStyles
                )}
              >
                <span>{linkText}</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Taped Preview Mockup */}
          <div className="relative lg:col-span-6 flex justify-center items-center">
            <div className="relative w-full max-w-md">
              {/* Taped Mockup Corners */}
              <WashiTape
                color="white"
                angle="steep-left"
                className="-top-3 left-4"
              />
              <WashiTape
                color="white"
                angle="steep-right"
                className="-top-3 right-4"
              />

              <div className="relative overflow-hidden rounded-xl border border-white/20 bg-black/30 backdrop-blur-sm p-4 shadow-xl">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

