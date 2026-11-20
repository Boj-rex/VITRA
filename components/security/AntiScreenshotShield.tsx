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
  documentTitle = "CV Preview",
  enabled = true,
}: AntiScreenshotShieldProps) {
  const [isShielded, setIsShielded] = useState(false);
  const [shieldReason, setShieldReason] = useState<"blur" | "printscreen" | "shortcut">("blur");
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activateShield = useCallback((reason: "blur" | "printscreen" | "shortcut", temporaryMs?: number) => {
    if (!enabled) return;
    setShieldReason(reason);
    setIsShielded(true);

    if (temporaryMs) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        // Only unshield if document still has focus
        if (typeof document !== "undefined" && document.hasFocus() && !document.hidden) {
          setIsShielded(false);
        }
      }, temporaryMs);
    }
  }, [enabled]);

  const deactivateShield = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsShielded(false);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Window blur event (e.g., Windows Snipping Tool, Win+Shift+S, Lightshot, ShareX, switching windows)
    const handleBlur = () => {
      // Small timeout to avoid false positives during normal intra-page focus changes
      setTimeout(() => {
        if (typeof document !== "undefined" && (!document.hasFocus() || document.hidden)) {
          activateShield("blur");
        }
      }, 50);
    };

    // Window focus event (user returned to browser tab)
    const handleFocus = () => {
      deactivateShield();
    };

    // Tab visibility change (switching tabs or minimizing browser)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        activateShield("blur");
      } else if (document.hasFocus()) {
        deactivateShield();
      }
    };

    // Keydown listeners for PrintScreen, Ctrl+P, Win+Shift+S, etc.
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Hardware PrintScreen key
      if (e.key === "PrintScreen" || e.code === "PrintScreen" || e.keyCode === 44) {
        e.preventDefault();
        e.stopPropagation();

        // Clear or overwrite clipboard
        if (navigator.clipboard?.writeText) {
          navigator.clipboard
            .writeText(
              "Vitra Document Protection: Screenshotting CV previews is disabled. Please use the official Download PDF or Download DOCX button."
            )
            .catch(() => {});
        }

        activateShield("printscreen", 4500);
      }

      // 2. Browser Print shortcut (Ctrl+P / Cmd+P)
      if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        e.stopPropagation();
        activateShield("shortcut", 3000);
      }

      // 3. Screen snip shortcuts (Ctrl+Shift+S, Cmd+Shift+3, Cmd+Shift+4)
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        (e.key === "s" || e.key === "S" || e.key === "3" || e.key === "4")
      ) {
        e.preventDefault();
        e.stopPropagation();
        activateShield("shortcut", 4500);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen" || e.code === "PrintScreen" || e.keyCode === 44) {
        e.preventDefault();
        activateShield("printscreen", 4500);
      }
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", handleKeyUp, true);

    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("keyup", handleKeyUp, true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [enabled, activateShield, deactivateShield]);

  return (
    <div
      ref={containerRef}
      className={cn("relative select-none", className)}
      onContextMenu={(e) => {
        // Prevent right-click context menu (blocks browser "Take Screenshot" / "Web Capture")
        e.preventDefault();
      }}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Underlying Content with dynamic blur filter when shielded */}
      <div
        className={cn(
          "transition-all duration-150 ease-out",
          isShielded && "pointer-events-none filter blur-[32px] contrast-50 opacity-10 select-none"
        )}
        style={
          isShielded
            ? {
                WebkitFilter: "blur(32px) contrast(50%)",
                filter: "blur(32px) contrast(50%)",
                opacity: 0.05,
              }
            : undefined
        }
      >
        {children}
      </div>

      {/* Security Overlay when screenshot / blur is detected */}
      {isShielded && (
        <div
          role="alert"
          aria-live="assertive"
          onClick={deactivateShield}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#FAF8F5]/96 dark:bg-[#141722]/96 backdrop-blur-md p-6 text-center select-none cursor-pointer border-2 border-dashed border-[#173B30]/40 dark:border-[#34D399]/40 rounded-xl"
        >
          <div className="max-w-md rounded-2xl border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#1E2333] p-6 shadow-sticker flex flex-col items-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border-2 border-black dark:border-[#333C52] bg-[#FEF3C7] dark:bg-[#252210] text-[#92400E] dark:text-[#FBBF24] mb-3">
              <ShieldAlert className="h-6 w-6" />
            </div>

            <span className="inline-flex items-center gap-1 rounded-full border border-black/20 dark:border-white/20 bg-[#D1FAE5] dark:bg-[#0E2E23] px-2.5 py-0.5 text-[10px] font-bold text-[#065F46] dark:text-[#34D399] uppercase tracking-wider mb-2">
              <Lock className="h-2.5 w-2.5" />
              Document Privacy Shield
            </span>

            <h3 className="font-tech text-base font-bold text-[#111111] dark:text-white">
              {shieldReason === "printscreen"
                ? "Screenshot Disabled"
                : shieldReason === "shortcut"
                  ? "Screen Capture Blocked"
                  : "Document Temporarily Hidden"}
            </h3>

            <p className="mt-2 text-xs font-tech text-[#55564E] dark:text-[#CBD5E1] leading-relaxed">
              {shieldReason === "printscreen"
                ? "Direct screenshots of candidate CVs are restricted to protect intellectual property. Please use the official Download PDF or Download DOCX export buttons."
                : shieldReason === "shortcut"
                  ? "Capture shortcuts and browser printing are restricted. Use official PDF or Word export buttons above."
                  : "This preview is shielded while your window is out of focus to prevent background screen recorders and screen snip utilities."}
            </p>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                deactivateShield();
              }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border-2 border-black dark:border-[#333C52] bg-[#173B30] dark:bg-[#10B981] px-4 py-2 text-xs font-bold text-white dark:text-black shadow-sticker-sm hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Click to Resume Viewing {documentTitle}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
