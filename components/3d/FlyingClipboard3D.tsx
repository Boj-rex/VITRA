"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Check, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

const ATS_TIPS = [
  "Candidate #2026: Hired on first review! 🎯",
  "ATS Score: 100% — Clean single-column layout! ✨",
  "Boardroom ready: +38% revenue impact bullets! 📄",
  "Universal font parsed: Calibri 10.5pt detected! ⚡",
  "Zero tables, zero graphics: 10/10 ATS readable! 💼",
  "Taleo & Workday parser approved! 🚀",
];

export function FlyingClipboard3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [showTipBubble, setShowTipBubble] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Permanently disable on mobile devices (screens < 768px)
  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Position & Velocity Physics State (stored in refs for 60fps buttery smoothness)
  const posRef = useRef({ x: 120, y: 180 });
  const targetRef = useRef({ x: 300, y: 250 });
  const velRef = useRef({ vx: 1.2, vy: 0.8 });
  const rotRef = useRef({ rx: 0, ry: 0, rz: 0 });
  const flipAngleRef = useRef(0);
  const isHoveredRef = useRef(false);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const zoneIndexRef = useRef(0);

  // Update hover ref
  useEffect(() => {
    isHoveredRef.current = isHovered;
  }, [isHovered]);

  // Unrestricted Full-Screen Waypoint Generator (Reaches every corner, edge, and center)
  const pickNewTarget = useCallback(() => {
    if (typeof window === "undefined") return;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // 8 expansive full-screen zones covering every edge, diagonal, and corner without restrictions
    const zones = [
      { minX: 10, maxX: Math.max(40, width * 0.3), minY: 10, maxY: Math.max(40, height * 0.3) }, // Top-Left Corner
      { minX: Math.max(50, width * 0.7), maxX: Math.max(60, width - 120), minY: Math.max(50, height * 0.65), maxY: Math.max(60, height - 120) }, // Bottom-Right Corner
      { minX: Math.max(50, width * 0.7), maxX: Math.max(60, width - 120), minY: 10, maxY: Math.max(40, height * 0.3) }, // Top-Right Corner
      { minX: 10, maxX: Math.max(40, width * 0.3), minY: Math.max(50, height * 0.65), maxY: Math.max(60, height - 120) }, // Bottom-Left Corner
      { minX: 5, maxX: Math.max(30, width * 0.25), minY: Math.max(40, height * 0.35), maxY: Math.max(50, height * 0.65) }, // Far Left Edge
      { minX: Math.max(50, width * 0.75), maxX: Math.max(60, width - 110), minY: Math.max(40, height * 0.35), maxY: Math.max(50, height * 0.65) }, // Far Right Edge
      { minX: Math.max(30, width * 0.25), maxX: Math.max(50, width * 0.75), minY: 5, maxY: Math.max(30, height * 0.25) }, // Top Edge Sweep
      { minX: Math.max(30, width * 0.25), maxX: Math.max(50, width * 0.75), minY: Math.max(50, height * 0.7), maxY: Math.max(60, height - 110) }, // Bottom Edge Sweep
    ];

    // Sequentially alternate across opposite screen quadrants so flight crosses the entire screen
    zoneIndexRef.current = (zoneIndexRef.current + 1) % zones.length;
    const currentZone = zones[zoneIndexRef.current];

    const targetX = currentZone.minX + Math.random() * Math.max(10, currentZone.maxX - currentZone.minX);
    const targetY = currentZone.minY + Math.random() * Math.max(10, currentZone.maxY - currentZone.minY);

    targetRef.current = { x: targetX, y: targetY };
  }, []);

  // Main 60 FPS Physics & Flight Loop (Only executed on desktop)
  useEffect(() => {
    if (!mounted || isMobile) return;
    let animId: number;
    let lastTime = performance.now();

    // Initial target
    pickNewTarget();

    const loop = (currentTime: number) => {
      const dt = Math.min(32, currentTime - lastTime);
      lastTime = currentTime;

      const container = containerRef.current;
      if (!container || document.hidden) {
        animId = requestAnimationFrame(loop);
        return;
      }

      if (!isDraggingRef.current) {
        const pos = posRef.current;
        const target = targetRef.current;

        // Vector to target
        const dx = target.x - pos.x;
        const dy = target.y - pos.y;
        const dist = Math.hypot(dx, dy);

        // If reached waypoint, pick a new destination across the screen
        if (dist < 70) {
          pickNewTarget();
        }

        // Speed adjustment: smooth free-cruising speed
        const targetSpeed = isHoveredRef.current ? 0.3 : 1.95;

        // Desired velocity vector
        let desiredVx = 0;
        let desiredVy = 0;
        if (dist > 1) {
          desiredVx = (dx / dist) * targetSpeed;
          desiredVy = (dy / dist) * targetSpeed;
        }

        // Smooth steering (organic inertia)
        const steerStrength = 0.032;
        velRef.current.vx += (desiredVx - velRef.current.vx) * steerStrength;
        velRef.current.vy += (desiredVy - velRef.current.vy) * steerStrength;

        // Update position
        pos.x += velRef.current.vx * (dt / 16.6);
        pos.y += velRef.current.vy * (dt / 16.6);

        // Unrestricted edge bounds: softly deflects only at absolute viewport borders
        const minEdgeX = -15;
        const maxEdgeX = Math.max(50, window.innerWidth - 130);
        const minEdgeY = -10;
        const maxEdgeY = Math.max(50, window.innerHeight - 150);

        if (pos.x < minEdgeX) {
          pos.x = minEdgeX;
          velRef.current.vx = Math.abs(velRef.current.vx);
          pickNewTarget();
        } else if (pos.x > maxEdgeX) {
          pos.x = maxEdgeX;
          velRef.current.vx = -Math.abs(velRef.current.vx);
          pickNewTarget();
        }

        if (pos.y < minEdgeY) {
          pos.y = minEdgeY;
          velRef.current.vy = Math.abs(velRef.current.vy);
          pickNewTarget();
        } else if (pos.y > maxEdgeY) {
          pos.y = maxEdgeY;
          velRef.current.vy = -Math.abs(velRef.current.vy);
          pickNewTarget();
        }

        // 3D Banking & Tilt calculation based on flight direction and speed
        const targetRotY = isHoveredRef.current ? 0 : Math.max(-28, Math.min(28, velRef.current.vx * 15));
        const targetRotX = isHoveredRef.current ? 0 : Math.max(-20, Math.min(20, -velRef.current.vy * 12));
        const targetRotZ = isHoveredRef.current ? 0 : Math.max(-15, Math.min(15, velRef.current.vx * 8));

        // Smooth rotation interpolation
        rotRef.current.ry += (targetRotY - rotRef.current.ry) * 0.08;
        rotRef.current.rx += (targetRotX - rotRef.current.rx) * 0.08;
        rotRef.current.rz += (targetRotZ - rotRef.current.rz) * 0.08;

        // Ambient hovering sine wave
        const ambientBob = Math.sin(currentTime * 0.003) * 6;
        const ambientTilt = Math.cos(currentTime * 0.002) * 3;

        // Extra flip angle when clicked
        if (flipAngleRef.current > 0) {
          flipAngleRef.current -= 12;
          if (flipAngleRef.current < 0) flipAngleRef.current = 0;
        }

        const totalRotY = rotRef.current.ry + flipAngleRef.current;
        const totalRotX = rotRef.current.rx + ambientTilt;
        const totalRotZ = rotRef.current.rz;
        const totalY = pos.y + ambientBob;

        // Apply hardware-accelerated 3D transform pushed back in Z-space so it floats behind the page sheet
        container.style.transform = `translate3d(${pos.x}px, ${totalY}px, -30px) rotateX(${totalRotX}deg) rotateY(${totalRotY}deg) rotateZ(${totalRotZ}deg) scale(${isHoveredRef.current ? 1.08 : 1})`;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [pickNewTarget, mounted, isMobile]);

  // Click / Tap Handler: does a 360-degree 3D spin & advances career tip
  const handleClipboardClick = () => {
    setIsFlipping(true);
    flipAngleRef.current = 360;
    setTipIndex((prev) => (prev + 1) % ATS_TIPS.length);
    setShowTipBubble(true);

    setTimeout(() => {
      setIsFlipping(false);
    }, 700);

    // Auto-dismiss tip bubble after 6s
    setTimeout(() => {
      setShowTipBubble(false);
    }, 6000);
  };

  // Drag Support (Desktop & Mobile)
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: posRef.current.x,
      posY: posRef.current.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    posRef.current.x = dragStartRef.current.posX + dx;
    posRef.current.y = dragStartRef.current.posY + dy;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe catch
      }
      pickNewTarget();
    }
  };

  // Permanently unmounted & removed on mobile devices
  if (!mounted || isMobile) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleClipboardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      aria-label="3D Flying ATS Clipboard. Click to spin and read tips."
      className={cn(
        "hidden md:block fixed top-0 left-0 z-[1] select-none cursor-grab active:cursor-grabbing will-change-transform pointer-events-auto",
        "transition-shadow duration-300 opacity-90 hover:opacity-100",
        isDragging && "cursor-grabbing"
      )}
      style={{
        perspective: 1200,
        transformStyle: "preserve-3d",
        touchAction: "pan-y",
      }}
    >
      {/* Speech / Reaction Bubble attached to the clipboard */}
      {showTipBubble && (
        <div
          className="absolute -top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-200 hidden md:block"
          style={{ transformStyle: "flat" }}
        >
          <div className="relative rounded-xl border-2 border-black dark:border-[#3A4256] bg-white dark:bg-[#1E2333] px-3.5 py-1.5 font-tech text-xs font-bold text-black dark:text-white shadow-[3px_3px_0px_#111] dark:shadow-[3px_3px_0px_#000] flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
            <span className="text-black dark:text-white">{ATS_TIPS[tipIndex]}</span>
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-0 w-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-black dark:border-t-[#1E2333]" />
          </div>
        </div>
      )}

      {/* ==============================================================
          THE 3D REALISTIC PHYSICAL CLIPBOARD STRUCTURE
          ============================================================== */}
      <div
        className={cn(
          "relative w-28 sm:w-40 md:w-44 h-40 sm:h-56 md:h-64 rounded-xl sm:rounded-2xl p-2 sm:p-2.5 transition-transform duration-200",
          "bg-gradient-to-br from-[#3D2C1E] via-[#2A1D13] to-[#1C130B]",
          "border border-[#5A422D]/60",
          "shadow-[0_20px_40px_rgba(0,0,0,0.38),0_8px_16px_rgba(0,0,0,0.22),inset_0_1px_2px_rgba(255,255,255,0.2)]",
          isHovered && "shadow-[0_28px_55px_rgba(0,0,0,0.45),0_12px_24px_rgba(0,0,0,0.3)]"
        )}
        style={{
          transformStyle: "preserve-3d",
        }}
      >
        {/* Board Edge Bevel / Depth Rim */}
        <div className="absolute inset-0 rounded-xl sm:rounded-2xl border-2 border-black/40 pointer-events-none" />

        {/* Ambient Top Shadow beneath the Clip */}
        <div className="absolute top-0 inset-x-0 h-8 sm:h-10 rounded-t-xl sm:rounded-t-2xl bg-gradient-to-b from-black/40 to-transparent pointer-events-none z-10" />

        {/* ==============================================================
            THE METAL MECHANICAL CLIP AT THE TOP
            ============================================================== */}
        <div
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 w-20 sm:w-26 md:w-28 flex flex-col items-center pointer-events-none"
          style={{ transform: "translateZ(12px)" }}
        >
          {/* Top Hanging Hole Grommet */}
          <div className="h-3 sm:h-3.5 w-5 sm:w-6 rounded-t-md bg-gradient-to-b from-[#D4AF37] to-[#A68020] border border-black/40 flex items-center justify-center shadow-sm">
            <div className="h-1.5 w-2 sm:w-2.5 rounded-full bg-[#1C130B] border border-black/50" />
          </div>

          {/* Main Metallic Stainless & Brass Clamp Bar */}
          <div className="relative w-full h-5 sm:h-6 md:h-7 rounded-md bg-gradient-to-b from-[#F3EFE6] via-[#D5CDBD] to-[#9E9382] border-2 border-[#544C3F] shadow-[0_4px_8px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.8)] flex items-center justify-between px-1.5 sm:px-2">
            {/* Left Rivet */}
            <div className="h-1.5 sm:h-2 w-1.5 sm:w-2 rounded-full bg-[#3D372E] border border-[#C5BBAA] shadow-inner" />
            {/* Center Spring Arch */}
            <div className="h-2 sm:h-2.5 w-8 sm:w-10 md:w-12 rounded-sm bg-gradient-to-r from-[#8E8474] via-[#D5CDBD] to-[#8E8474] border border-[#544C3F]" />
            {/* Right Rivet */}
            <div className="h-1.5 sm:h-2 w-1.5 sm:w-2 rounded-full bg-[#3D372E] border border-[#C5BBAA] shadow-inner" />
          </div>

          {/* Metallic Clip Lip Shadow on the Paper */}
          <div className="w-[94%] h-2 sm:h-2.5 bg-black/40 blur-[2px] -mt-0.5 rounded-full" />
        </div>

        {/* ==============================================================
            THE PINNED CV DOCUMENT PAPER (RULED & VERIFIED)
            ============================================================== */}
        <div
          data-keep-white="true"
          data-clipboard-paper="true"
          className="cv-document-sheet relative w-full h-full rounded-lg sm:rounded-xl bg-[#FFFDF9] border border-[#E5E0D5] p-2 sm:p-2.5 md:p-3 overflow-hidden shadow-[inset_0_1px_3px_rgba(0,0,0,0.06)] flex flex-col justify-between"
          style={{
            transform: "translateZ(4px)",
            backgroundImage: "linear-gradient(rgba(180, 200, 220, 0.25) 1px, transparent 1px)",
            backgroundSize: "100% 16px",
          }}
        >
          {/* Top Paper Header */}
          <div className="pt-1.5 sm:pt-2 md:pt-3">
            <div className="flex items-center justify-between border-b border-black/15 pb-1">
              <span className="font-tech text-[7px] sm:text-[8px] md:text-[9px] font-bold text-black uppercase tracking-wider">
                ✦ VITRA ATS AUDIT
              </span>
              <span className="rounded bg-emerald-600 px-1 sm:px-1.5 py-0.2 text-[6.5px] sm:text-[7.5px] md:text-[8px] font-bold text-white uppercase font-tech shadow-sm">
                98% MATCH
              </span>
            </div>

            {/* Candidate Title & Role */}
            <div className="mt-1 sm:mt-1.5 space-y-0.5 font-tech">
              <p className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-[#111111] truncate">
                ADAEZE CHIDINMA
              </p>
              <p className="text-[6.5px] sm:text-[7.5px] md:text-[8px] font-semibold text-[#55574F] truncate">
                Operations Lead · Lagos
              </p>
            </div>

            {/* Mini ATS Checklist Rows */}
            <div className="mt-1.5 sm:mt-2 space-y-0.5 sm:space-y-1 font-tech text-[6.5px] sm:text-[7.5px] md:text-[8px] text-[#222222]">
              <div className="flex items-center gap-1">
                <Check className="h-2 sm:h-2.5 w-2 sm:w-2.5 text-emerald-600 stroke-[3] shrink-0" />
                <span className="truncate font-medium text-[#222222]">1-Column Linear Layout</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="h-2 sm:h-2.5 w-2 sm:w-2.5 text-emerald-600 stroke-[3] shrink-0" />
                <span className="truncate font-medium text-[#222222]">Standard Calibri 10.5pt</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="h-2 sm:h-2.5 w-2 sm:w-2.5 text-emerald-600 stroke-[3] shrink-0" />
                <span className="truncate font-medium text-[#222222]">+38% Revenue Impact</span>
              </div>
            </div>
          </div>

          {/* Bottom Area: Red Stamped Seal & Floating Badge */}
          <div className="relative pt-1 flex items-end justify-between">
            {/* Rubber Stamp: PASSED */}
            <div className="rounded border-2 border-red-600/90 px-1 sm:px-1.5 py-0.5 font-tech text-[7px] sm:text-[8px] md:text-[9px] font-bold text-red-600 -rotate-12 shadow-sm uppercase tracking-wider select-none">
              PASSED ✓
            </div>

            {/* Tap Hint */}
            <span className="font-handwriting text-[10px] sm:text-xs font-bold text-[#55574F] select-none">
              tap to flip ✨
            </span>
          </div>
        </div>

        {/* Board Bottom Shadow Ring */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4/5 h-2 rounded-full bg-black/40 blur-[3px] pointer-events-none" />
      </div>
    </div>
  );
}

