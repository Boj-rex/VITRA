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
  const isPrintScreenLockedRef = useRef(false);
  const unlockTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronous DOM manipulation: 0ms latency, bypasses React batching
  const applyInstantDomLock = useCallback(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.add("vitra-screen-lock-instant");
    }
  }, []);

  const removeInstantDomLock = useCallback(() => {
    if (typeof document !== "undefined" && !isPrintScreenLockedRef.current) {
      document.documentElement.classList.remove("vitra-screen-lock-instant");
    }
  }, []);

  const activateShield = useCallback(
    (reason: "blur" | "printscreen" | "shortcut", lockDurationMs?: number) => {
      if (!enabled) return;
      applyInstantDomLock();
      setShieldReason(reason);
      setIsShielded(true);

      if (lockDurationMs) {
        isPrintScreenLockedRef.current = true;
        if (unlockTimerRef.current) clearTimeout(unlockTimerRef.current);
        unlockTimerRef.current = setTimeout(() => {
          isPrintScreenLockedRef.current = false;
          if (typeof document !== "undefined" && document.hasFocus() && !document.hidden) {
            removeInstantDomLock();
            setIsShielded(false);
          }
        }, lockDurationMs);
      }
    },
    [enabled, applyInstantDomLock, removeInstantDomLock]
  );

  const deactivateShield = useCallback(() => {
    if (unlockTimerRef.current) clearTimeout(unlockTimerRef.current);
    isPrintScreenLockedRef.current = false;
    removeInstantDomLock();
    setIsShielded(false);
  }, [removeInstantDomLock]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    // 1. Instant Synchronous Blur Handler
    const handleBlur = () => {
      applyInstantDomLock();
      activateShield("blur");
    };

    // 2. Instant Window Focus Handler
    const handleFocus = () => {
      if (!isPrintScreenLockedRef.current) {
        deactivateShield();
      }
    };

    // 3. Tab Visibility Handler
    const handleVisibilityChange = () => {
      if (document.hidden) {
        applyInstantDomLock();
        activateShield("blur");
      } else if (document.hasFocus() && !isPrintScreenLockedRef.current) {
        deactivateShield();
      }
    };

    // 4. Mouse Exits Viewport (Blocks clicking Taskbar / Extension screenshot buttons)
    const handleMouseLeave = (e: MouseEvent) => {
      if (
        e.clientY <= 0 ||
        e.clientX <= 0 ||
        e.clientX >= window.innerWidth ||
        e.clientY >= window.innerHeight
      ) {
        applyInstantDomLock();
        activateShield("blur");
      }
    };

    // 5. Mouse Moves Inside Viewport (Restores view if window is focused)
    const handleMouseMove = () => {
      if (
        !isPrintScreenLockedRef.current &&
        document.hasFocus() &&
        !document.hidden
      ) {
        removeInstantDomLock();
        if (isShielded) setIsShielded(false);
      }
    };

    // 6. Zero-Delay Hardware Keydown Listener at Capture Phase (runs before OS snip)
    const handleKeyDownCapture = (e: KeyboardEvent) => {
      // Hardware PrintScreen Key (PrtScn)
      if (
        e.key === "PrintScreen" ||
        e.code === "PrintScreen" ||
        e.keyCode === 44 ||
        e.which === 44
      ) {
        e.preventDefault();
        e.stopPropagation();
        applyInstantDomLock();

        // Wipe and overwrite clipboard immediately
        if (navigator.clipboard?.writeText) {
          navigator.clipboard
            .writeText(
              "Vitra Document Privacy: Screenshots and screen capture are strictly restricted to protect candidate intellectual property. Please use the official Download PDF or Download DOCX button."
            )
            .catch(() => {});
        }

        activateShield("printscreen", 4000);
        return;
      }

      // Windows Snipping Tool (Win+Shift+S / Ctrl+Shift+S) & Mac Screen Snip (Cmd+Shift+3/4/5)
      // NOTE: Checking Shift + (Meta OR Ctrl) catches the combo immediately when keys go down!
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
        applyInstantDomLock();
        activateShield("shortcut", 4500);
        return;
      }

      // Browser Print shortcut (Ctrl+P / Cmd+P)
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "p" || e.key === "P" || e.code === "KeyP")
      ) {
        e.preventDefault();
        e.stopPropagation();
        applyInstantDomLock();
        activateShield("shortcut", 3000);
        return;
      }
    };

    const handleKeyUpCapture = (e: KeyboardEvent) => {
      if (
        e.key === "PrintScreen" ||
        e.code === "PrintScreen" ||
        e.keyCode === 44 ||
        e.which === 44
      ) {
        e.preventDefault();
        applyInstantDomLock();
        activateShield("printscreen", 4000);
      }
    };

    // 7. Polling Guard at 100ms interval for silent OS capture overlays
    const focusPollingInterval = setInterval(() => {
      if (typeof document !== "undefined") {
        if (!document.hasFocus() || document.hidden) {
          applyInstantDomLock();
          if (!isShielded) activateShield("blur");
        }
      }
    }, 100);

    // Register capture-phase listeners (highest priority in browser event queue)
    window.addEventListener("blur", handleBlur, true);
    window.addEventListener("focus", handleFocus, true);
    document.addEventListener("visibilitychange", handleVisibilityChange, true);
    document.documentElement.addEventListener("mouseleave", handleMouseLeave, true);
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("keydown", handleKeyDownCapture, { capture: true, passive: false });
    window.addEventListener("keyup", handleKeyUpCapture, { capture: true, passive: false });
    document.addEventListener("keydown", handleKeyDownCapture, { capture: true, passive: false });

    return () => {
      window.removeEventListener("blur", handleBlur, true);
      window.removeEventListener("focus", handleFocus, true);
      document.removeEventListener("visibilitychange", handleVisibilityChange, true);
      document.documentElement.removeEventListener("mouseleave", handleMouseLeave, true);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keydown", handleKeyDownCapture, true);
      window.removeEventListener("keyup", handleKeyUpCapture, true);
      document.removeEventListener("keydown", handleKeyDownCapture, true);
      clearInterval(focusPollingInterval);
      if (unlockTimerRef.current) clearTimeout(unlockTimerRef.current);
      if (typeof document !== "undefined") {
        document.documentElement.classList.remove("vitra-screen-lock-instant");
      }
    };
  }, [
    enabled,
    applyInstantDomLock,
    removeInstantDomLock,
    activateShield,
    deactivateShield,
    isShielded,
  ]);

  return (
    <div
      className={cn("relative select-none", className)}
      onContextMenu={(e) => {
        // Blocks right-click context menu (blocks browser "Web Capture", "Take Screenshot", etc.)
        e.preventDefault();
      }}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Content wrapper with immediate 0ms blur/cutout */}
      <div
        className={cn(
          isShielded &&
            "pointer-events-none filter blur-[50px] grayscale contrast-50 opacity-0 select-none"
        )}
        style={
          isShielded
            ? {
                WebkitFilter: "blur(50px) grayscale(100%) brightness(0%)",
                filter: "blur(50px) grayscale(100%) brightness(0%)",
                opacity: 0,
                visibility: "hidden",
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
          className="fixed inset-0 z-[2147483646] flex flex-col items-center justify-center bg-[#0E121B]/98 backdrop-blur-2xl p-6 text-center select-none cursor-pointer"
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
                  : "Workspace Protected"}
            </h3>

            <p className="mt-2 text-xs font-tech text-[#55564E] dark:text-[#CBD5E1] leading-relaxed">
              {shieldReason === "printscreen"
                ? "Direct screenshots of CV documents and candidate forms are disabled to protect candidate data and intellectual property. Please use the official Download PDF or Download DOCX buttons."
                : shieldReason === "shortcut"
                  ? "Screen capture shortcuts and browser printing are restricted. Official clean documents can be exported using the buttons at the top of your workspace."
                  : "The CV editor and document preview are shielded to prevent background screen grabbers and snipping utilities from capturing your data."}
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
