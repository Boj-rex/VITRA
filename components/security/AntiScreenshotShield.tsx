"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { ShieldAlert, Lock, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface AntiScreenshotShieldProps {
  children: React.ReactNode;
  className?: string;
  documentTitle?: string;
  enabled?: boolean;
}

export function AntiScreenshotShield({
  children,
  className,
  documentTitle = "CV Editor",
  enabled = true,
}: AntiScreenshotShieldProps) {
  const [isShielded, setIsShielded] = useState(false);
  const [shieldReason, setShieldReason] = useState<"blur" | "printscreen" | "shortcut">("blur");
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activateShield = useCallback(
    (reason: "blur" | "printscreen" | "shortcut", temporaryMs?: number) => {
      if (!enabled) return;
      setShieldReason(reason);
      setIsShielded(true);

      if (temporaryMs) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          if (typeof document !== "undefined" && document.hasFocus() && !document.hidden) {
            setIsShielded(false);
          }
        }, temporaryMs);
      }
    },
    [enabled]
  );

  const deactivateShield = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsShielded(false);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // 1. Immediate blur handler
    const handleBlur = () => {
      activateShield("blur");
    };

    // 2. Focus restoration handler
    const handleFocus = () => {
      deactivateShield();
    };

    // 3. Tab visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        activateShield("blur");
      } else if (document.hasFocus()) {
        deactivateShield();
      }
    };

    // 4. Polling guard to catch screen-snip tools that steal OS focus silently
    const focusGuardInterval = setInterval(() => {
      if (typeof document !== "undefined") {
        if (!document.hasFocus() || document.hidden) {
          activateShield("blur");
        }
      }
    }, 180);

    // 5. Intercept key combinations for screen capture and printing
    const handleKeyDown = (e: KeyboardEvent) => {
      // Hardware PrintScreen Key
      if (
        e.key === "PrintScreen" ||
        e.code === "PrintScreen" ||
        e.keyCode === 44 ||
        e.which === 44
      ) {
        e.preventDefault();
        e.stopPropagation();

        if (navigator.clipboard?.writeText) {
          navigator.clipboard
            .writeText(
              "Vitra Document Privacy: Screenshots and screen capture are strictly restricted to protect candidate intellectual property. Please use the official Download PDF or Download DOCX button."
            )
            .catch(() => {});
        }

        activateShield("printscreen", 5000);
      }

      // Windows Snipping Tool (Win+Shift+S / Ctrl+Shift+S) & Mac Screenshot (Cmd+Shift+3/4/5)
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        (e.key === "s" ||
          e.key === "S" ||
          e.key === "3" ||
          e.key === "4" ||
          e.key === "5" ||
          e.code === "KeyS" ||
          e.code === "Digit3" ||
          e.code === "Digit4" ||
          e.code === "Digit5")
      ) {
        e.preventDefault();
        e.stopPropagation();
        activateShield("shortcut", 5000);
      }

      // Browser Print (Ctrl+P / Cmd+P)
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "p" || e.key === "P" || e.code === "KeyP")
      ) {
        e.preventDefault();
        e.stopPropagation();
        activateShield("shortcut", 3500);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (
        e.key === "PrintScreen" ||
        e.code === "PrintScreen" ||
        e.keyCode === 44 ||
        e.which === 44
      ) {
        e.preventDefault();
        e.stopPropagation();

        if (navigator.clipboard?.writeText) {
          navigator.clipboard
            .writeText(
              "Vitra Document Privacy: Screenshots and screen capture are strictly restricted to protect candidate intellectual property. Please use the official Download PDF or Download DOCX button."
            )
            .catch(() => {});
        }

        activateShield("printscreen", 5000);
      }
    };

    window.addEventListener("blur", handleBlur, true);
    window.addEventListener("focus", handleFocus, true);
    document.addEventListener("visibilitychange", handleVisibilityChange, true);
    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", handleKeyUp, true);
    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("keyup", handleKeyUp, true);

    return () => {
      window.removeEventListener("blur", handleBlur, true);
      window.removeEventListener("focus", handleFocus, true);
      document.removeEventListener("visibilitychange", handleVisibilityChange, true);
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("keyup", handleKeyUp, true);
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("keyup", handleKeyUp, true);
      clearInterval(focusGuardInterval);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [enabled, activateShield, deactivateShield]);

  return (
    <div
      ref={containerRef}
      className={cn("relative select-none", className)}
      onContextMenu={(e) => {
        // Block right-click context menu (blocks browser "Web Capture", "Take Screenshot", etc.)
        e.preventDefault();
      }}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Target Content with deep blur filter when shielded */}
      <div
        className={cn(
          "transition-all duration-150 ease-out",
          isShielded &&
            "pointer-events-none filter blur-[40px] grayscale contrast-50 opacity-0 select-none"
        )}
        style={
          isShielded
            ? {
                WebkitFilter: "blur(40px) grayscale(100%) brightness(10%)",
                filter: "blur(40px) grayscale(100%) brightness(10%)",
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              }
            : undefined
        }
      >
        {children}
      </div>

      {/* Security Lock Overlay Covering the Protected Area */}
      {isShielded && (
        <div
          role="alert"
          aria-live="assertive"
          onClick={deactivateShield}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#141722]/98 backdrop-blur-xl p-6 text-center select-none cursor-pointer"
        >
          <div className="max-w-md rounded-2xl border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#1E2333] p-6 sm:p-8 shadow-sticker flex flex-col items-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-black dark:border-[#333C52] bg-[#FEF3C7] dark:bg-[#252210] text-[#92400E] dark:text-[#FBBF24] mb-4">
              <ShieldAlert className="h-7 w-7" />
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-black/20 dark:border-white/20 bg-[#D1FAE5] dark:bg-[#0E2E23] px-3 py-1 text-[11px] font-bold text-[#065F46] dark:text-[#34D399] uppercase tracking-wider mb-2 font-tech">
              <Lock className="h-3 w-3" />
              Document Privacy Shield Active
            </span>

            <h3 className="font-tech text-lg font-bold text-[#111111] dark:text-white">
              {shieldReason === "printscreen"
                ? "Screenshot Disabled"
                : shieldReason === "shortcut"
                  ? "Screen Capture Restricted"
                  : "Workspace Temporarily Hidden"}
            </h3>

            <p className="mt-2 text-xs font-tech text-[#55564E] dark:text-[#CBD5E1] leading-relaxed">
              {shieldReason === "printscreen"
                ? "Direct screenshots of CV documents and candidate forms are disabled to protect candidate data and intellectual property. Please use the official Download PDF or Download DOCX buttons."
                : shieldReason === "shortcut"
                  ? "Screen capture shortcuts and browser printing are restricted. Official clean documents can be exported using the buttons at the top of your workspace."
                  : "The CV editor and live document preview are automatically shielded while your browser window is out of focus to prevent background screen recorders and external snip utilities."}
            </p>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                deactivateShield();
              }}
              className="mt-5 inline-flex items-center gap-2 rounded-xl border-2 border-black dark:border-[#333C52] bg-[#173B30] dark:bg-[#10B981] px-5 py-2.5 text-xs font-bold text-white dark:text-black shadow-sticker hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer font-tech"
            >
              <Eye className="h-4 w-4" />
              <span>Click to Resume Editing {documentTitle}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
