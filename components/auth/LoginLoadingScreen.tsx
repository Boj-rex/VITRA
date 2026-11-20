"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

export interface LoginLoadingScreenProps {
  active: boolean;
  isZooming: boolean;
  onTransitionComplete?: () => void;
}

export function LoginLoadingScreen({
  active,
  isZooming,
  onTransitionComplete,
}: LoginLoadingScreenProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isZooming && onTransitionComplete) {
      // Allow the zoom animation to fully cover the screen before redirecting
      const timer = setTimeout(() => {
        onTransitionComplete();
      }, 750);
      return () => clearTimeout(timer);
    }
  }, [isZooming, onTransitionComplete]);

  if (!mounted || !active) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-[#FAF8F5] dark:bg-[#0E131F] transition-opacity duration-300 pointer-events-auto select-none"
      style={{
        opacity: active ? 1 : 0,
      }}
      aria-live="polite"
      aria-label="Signing into Vitra"
    >
      {/* Background yellow wash that spreads to cover the entire screen during zoom */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-700 ease-in-out"
        style={{
          backgroundColor: isZooming ? "#F8D849" : "transparent",
          opacity: isZooming ? 1 : 0,
        }}
      />

      {/* Subtle radial ambient glow while authenticating */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          background: "radial-gradient(circle at center, rgba(248, 216, 73, 0.35) 0%, transparent 65%)",
          opacity: isZooming ? 0 : 0.7,
        }}
      />

      {/* Central Zooming Container */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <div
          className="relative transition-transform will-change-transform"
          style={{
            transform: isZooming ? "scale(60)" : "scale(1)",
            transitionDuration: isZooming ? "800ms" : "300ms",
            transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <div className={!isZooming ? "animate-pulse" : ""}>
            <Image
              src="/brand/vitra-login-badge.png"
              alt="Vitra Logo"
              width={140}
              height={140}
              priority
              className="h-28 w-28 sm:h-36 sm:w-36 object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.25)]"
            />
          </div>
        </div>

        {/* Text and status indicator — fade out immediately when zoom starts */}
        <div
          className="mt-8 flex flex-col items-center gap-2 transition-all duration-200"
          style={{
            opacity: isZooming ? 0 : 1,
            transform: isZooming ? "translateY(20px)" : "translateY(0)",
          }}
        >
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#1845E8] animate-ping" />
            <span className="font-tech text-xs sm:text-sm font-bold tracking-widest text-[#111111] dark:text-white uppercase">
              Entering Vitra Workspace
            </span>
          </div>
          <p className="text-[11px] font-tech text-[#77786F] dark:text-[#94A3B8]">
            Securing candidate session...
          </p>
        </div>
      </div>
    </div>
  );
}
