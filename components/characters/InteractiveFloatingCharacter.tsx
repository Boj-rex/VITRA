"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

interface InteractiveFloatingCharacterProps {
  character: "man" | "woman";
  side: "left" | "right";
  initialAction?: 1 | 2 | 3;
}

interface ChapterMeta {
  startFrame: number;
  label: string;
  quote: string;
}

const TOTAL_FRAMES = 192; // 16 seconds at 12 fps from exact reference video

// 3 Story Chapters matching the continuous 16-second video progression
const MAN_CHAPTERS: ChapterMeta[] = [
  {
    startFrame: 0,
    label: "Checking Fit & Lapels",
    quote: "Checking the fit... Lapels sharp, 100% ATS aligned. 💼",
  },
  {
    startFrame: 64,
    label: "Executive Presence",
    quote: "Prepared and confident. Ready for the boardroom. ✨",
  },
  {
    startFrame: 128,
    label: "Reading Your CV",
    quote: "Reviewing candidate CV... +38% revenue impact? Hired immediately! 📄✨",
  },
];

const WOMAN_CHAPTERS: ChapterMeta[] = [
  {
    startFrame: 0,
    label: "Checking Blazer & Stance",
    quote: "Checking presentation... Executive styling: 10/10. 🌸",
  },
  {
    startFrame: 64,
    label: "Executive Confidence",
    quote: "Poised, professional, and ready to outshine 500 applicants! 🎯",
  },
  {
    startFrame: 128,
    label: "Reading Your CV",
    quote: "Analyzing CV layout... Clean typography, 98% ATS score! 📋✨",
  },
];

export function InteractiveFloatingCharacter({
  character,
  side,
  initialAction = 1,
}: InteractiveFloatingCharacterProps) {
  const asideRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const frameIndexRef = useRef(initialAction === 2 ? 128 : initialAction === 3 ? 64 : 0);
  const directionRef = useRef(1);
  const holdCountRef = useRef(0);

  const chapters = character === "man" ? MAN_CHAPTERS : WOMAN_CHAPTERS;

  const [isHovered, setIsHovered] = useState(false);
  const [bubbleText, setBubbleText] = useState("");
  const [activeChapterLabel, setActiveChapterLabel] = useState(chapters[0].label);
  const [hasDrawnCanvas, setHasDrawnCanvas] = useState(false);

  const initialFrame = initialAction === 2 ? 128 : initialAction === 3 ? 64 : 0;

  // 1. Prioritized Cooperative Preloading of frames (Both characters load initial frames instantly)
  useEffect(() => {
    let isCancelled = false;
    const targetInitialFrame = frameIndexRef.current;
    const preloaded: HTMLImageElement[] = new Array(TOTAL_FRAMES);

    const getFrameUrl = (idx: number) =>
      `/characters/${character}/anim_${String(idx).padStart(3, "0")}.webp`;

    const loadFrame = (idx: number): Promise<HTMLImageElement> => {
      return new Promise((resolve) => {
        if (preloaded[idx]) {
          resolve(preloaded[idx]);
          return;
        }
        const img = new Image();
        img.src = getFrameUrl(idx);
        img.onload = () => {
          preloaded[idx] = img;
          resolve(img);
        };
        img.onerror = () => {
          resolve(img);
        };
      });
    };

    // Step 1: Immediately load and draw the initial frame
    loadFrame(targetInitialFrame).then((firstImg) => {
      if (isCancelled) return;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx && firstImg.complete && firstImg.naturalWidth > 0) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(firstImg, 0, 0, canvas.width, canvas.height);
          setHasDrawnCanvas(true);
        }
      }

      // Step 2: Buffer immediate upcoming 16 frames & chapter anchors (0, 64, 128)
      const bufferPromises: Promise<HTMLImageElement>[] = [];
      for (let offset = 1; offset <= 16; offset++) {
        const nextIdx = (targetInitialFrame + offset) % TOTAL_FRAMES;
        bufferPromises.push(loadFrame(nextIdx));
      }
      [0, 64, 128].forEach((anchorIdx) => {
        if (!preloaded[anchorIdx]) {
          bufferPromises.push(loadFrame(anchorIdx));
        }
      });

      Promise.all(bufferPromises).then(() => {
        if (isCancelled) return;

        // Step 3: Progressively stream the remaining frames in small gentle batches
        // Prevents network connection saturation so man and woman stream cooperatively
        let batchStart = 0;
        const loadNextBatch = () => {
          if (isCancelled || batchStart >= TOTAL_FRAMES) return;
          const batchEnd = Math.min(batchStart + 12, TOTAL_FRAMES);
          for (let i = batchStart; i < batchEnd; i++) {
            if (!preloaded[i]) {
              loadFrame(i);
            }
          }
          batchStart = batchEnd;
          if (batchStart < TOTAL_FRAMES) {
            if (typeof window !== "undefined" && "requestIdleCallback" in window) {
              (window as unknown as { requestIdleCallback: (cb: () => void, opts: { timeout: number }) => void }).requestIdleCallback(
                () => loadNextBatch(),
                { timeout: 150 }
              );
            } else {
              setTimeout(loadNextBatch, 50);
            }
          }
        };

        loadNextBatch();
      });
    });

    imagesRef.current = preloaded;

    return () => {
      isCancelled = true;
    };
  }, [character]);

  // 2. High-Performance Double-Buffered Canvas Animation Loop (12 FPS = 83.3ms)
  // Seamless bidirectional loop: smoothly transitions between poses without jump cuts or popping
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animFrameId: number;
    let lastFrameTime = 0;
    const FRAME_INTERVAL = 83.33; // 12 FPS smooth video playback rate
    const HOLD_FRAMES = 12; // ~1.0s natural pause at key action endpoints

    const renderLoop = (timestamp: number) => {
      if (timestamp - lastFrameTime >= FRAME_INTERVAL) {
        lastFrameTime = timestamp;

        if (holdCountRef.current > 0) {
          holdCountRef.current--;
        } else {
          let nextIdx = frameIndexRef.current + directionRef.current;
          if (nextIdx >= TOTAL_FRAMES) {
            nextIdx = TOTAL_FRAMES - 1;
            directionRef.current = -1;
            holdCountRef.current = HOLD_FRAMES; // Pause naturally while reading CV
          } else if (nextIdx < 0) {
            nextIdx = 0;
            directionRef.current = 1;
            holdCountRef.current = HOLD_FRAMES; // Pause naturally at opening stance
          }
          frameIndexRef.current = nextIdx;
        }

        const currentIdx = frameIndexRef.current;
        const img = imagesRef.current[currentIdx];

        if (img && img.complete && img.naturalWidth > 0) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          setHasDrawnCanvas(true);
        }
      }

      animFrameId = requestAnimationFrame(renderLoop);
    };

    animFrameId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [character]);

  // Click / Tap character to jump between story chapters (Checking Fit -> Presence -> Reading CV)
  const handleCharacterClick = useCallback(() => {
    let nextFrame = 0;
    const currentFrame = frameIndexRef.current;
    if (currentFrame < 64) {
      nextFrame = 64;
    } else if (currentFrame < 128) {
      nextFrame = 128; // Jump straight to reading CV!
    } else {
      nextFrame = 0;
    }
    frameIndexRef.current = nextFrame;
    directionRef.current = 1;
    holdCountRef.current = 0;

    const targetChapter =
      nextFrame === 128 ? chapters[2] : nextFrame === 64 ? chapters[1] : chapters[0];
    setBubbleText(targetChapter.quote);
    setActiveChapterLabel(targetChapter.label);
    setIsHovered(true);
  }, [chapters]);

  // Tap outside to close speech bubble (dismiss floating text)
  useEffect(() => {
    if (!bubbleText && !isHovered) return;

    const handleTapOutside = (event: MouseEvent | TouchEvent | PointerEvent) => {
      if (asideRef.current && !asideRef.current.contains(event.target as Node)) {
        setBubbleText("");
        setIsHovered(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setBubbleText("");
        setIsHovered(false);
      }
    };

    document.addEventListener("pointerdown", handleTapOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handleTapOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [bubbleText, isHovered]);

  // Listen for custom trigger from background canvas buttons
  useEffect(() => {
    const handleCustomTrigger = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || detail.character === "both" || detail.character === character) {
        handleCharacterClick();
      }
    };

    window.addEventListener("vitra:trigger-character-speech", handleCustomTrigger);
    return () => {
      window.removeEventListener("vitra:trigger-character-speech", handleCustomTrigger);
    };
  }, [character, handleCharacterClick]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    const currentFrame = frameIndexRef.current;
    const targetChapter =
      currentFrame >= 128 ? chapters[2] : currentFrame >= 64 ? chapters[1] : chapters[0];
    setActiveChapterLabel(targetChapter.label);
    if (!bubbleText) {
      setBubbleText(targetChapter.quote);
    }
  };

  const currentChapter =
    frameIndexRef.current >= 128
      ? chapters[2]
      : frameIndexRef.current >= 64
        ? chapters[1]
        : chapters[0];

  return (
    <aside
      ref={asideRef}
      aria-label={`${character === "man" ? "Stylist" : "Executive"} animated character`}
      className={`fixed bottom-1 sm:bottom-6 lg:bottom-8 z-30 pointer-events-none transition-all duration-300 block ${side === "left"
          ? "left-0.5 sm:left-4 lg:left-7"
          : "right-0.5 sm:right-4 lg:right-7"
        }`}
    >
      {/* Speech / Reaction Bubble (Click or Tap to dismiss or cycle) */}
      <div
        onClick={handleCharacterClick}
        role="button"
        tabIndex={0}
        aria-label="Character quote. Click to view next tip."
        className={`absolute -top-16 sm:-top-24 z-50 transition-all duration-300 pointer-events-auto cursor-pointer interactive-tap ${side === "left" ? "left-0 sm:left-6" : "right-0 sm:right-6"
          } ${isHovered || bubbleText
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-2 pointer-events-none"
          }`}
      >
        <div className="relative rounded-xl sm:rounded-2xl border-2 border-[#111111] dark:border-[#333C52] bg-white dark:bg-[#1E2333] px-2.5 sm:px-4 py-1.5 sm:py-2.5 font-bold text-[#111111] dark:text-white shadow-[0_8px_20px_rgba(0,0,0,0.22)] font-handwriting text-xs sm:text-base max-w-[155px] sm:max-w-[240px] leading-snug">
          {/* Subtle Dismiss '×' Button on Speech Bubble */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setBubbleText("");
              setIsHovered(false);
            }}
            aria-label="Close speech bubble"
            className="absolute -top-1.5 -right-1.5 h-4 w-4 sm:h-5 sm:w-5 rounded-full border border-black dark:border-white/30 bg-[#FEF08A] dark:bg-[#252A3D] text-[#111111] dark:text-white flex items-center justify-center text-[11px] font-bold shadow-sm hover:scale-110 active:scale-90 transition-transform cursor-pointer"
          >
            ×
          </button>
          <span>{bubbleText || currentChapter.quote}</span>
          <span className="block mt-0.5 sm:mt-1 text-[8px] sm:text-[9px] font-tech font-bold text-[#77786F] dark:text-[#94A3B8] uppercase tracking-wider">
            (Tap for next tip)
          </span>
          <div
            className={`absolute -bottom-2 h-0 w-0 border-l-[6px] sm:border-l-[7px] border-l-transparent border-r-[6px] sm:border-r-[7px] border-r-transparent border-t-[7px] sm:border-t-[8px] border-t-[#111111] dark:border-t-[#333C52] ${side === "left" ? "left-4 sm:left-8" : "right-4 sm:right-8"
              }`}
          />
        </div>
      </div>

      {/* Main Character Structure Standing Physically on the 3D Elevated Platform */}
      <div
        ref={containerRef}
        onClick={handleCharacterClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsHovered(false)}
        className="relative cursor-pointer pointer-events-auto select-none origin-bottom transition-transform will-change-transform group pb-2 sm:pb-4 active:scale-95 w-[52px] sm:w-[76px] md:w-[clamp(90px,16vw,240px)]"
        style={{
          maxHeight: "82vh",
        }}
        title="Click or tap to interact & jump chapters (Checking Fit · Presence · Reading CV)"
      >
        {/* =========================================
            SOLID ELEVATED 3D PLATFORM / PODIUM
            ========================================= */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[118%] max-w-[240px] h-6 sm:h-12 pointer-events-none z-0">
          {/* 1. Deep Ambient Floor Shadow cast by the platform */}
          <div className="absolute -bottom-1 sm:-bottom-2 left-1/2 -translate-x-1/2 w-[92%] h-2.5 sm:h-6 rounded-full bg-black/50 blur-[3px] sm:blur-[8px]" />

          {/* 2. Platform 3D Cylindrical Base Edge (Physical Thickness & Depth) */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[86%] h-2.5 sm:h-5 rounded-b-[12px] sm:rounded-b-[24px] bg-gradient-to-b from-[#2A4D41] via-[#173B30] to-[#0F2620] border-x border-b sm:border-x-2 sm:border-b-2 border-[#C4A46B] shadow-md sm:shadow-xl" />

          {/* 3. Platform Top Surface (Tilted Ellipse Disk Where Character Stands) */}
          <div
            className="absolute bottom-0.5 sm:bottom-1.5 left-1/2 -translate-x-1/2 w-[86%] h-5 sm:h-11 rounded-full border sm:border-2 border-[#C4A46B] bg-gradient-to-t from-[#173B30] via-[#224A3D] to-[#2E5E4E] shadow-[inset_0_2px_6px_rgba(255,255,255,0.25)]"
            style={{
              transform: "rotateX(68deg)",
            }}
          >
            {/* Elegant Static Gold Stage Rim Accent */}
            <div className="absolute inset-0.5 sm:inset-1 rounded-full border border-amber-300/35 pointer-events-none" />
            {/* Ambient Radial Spotlight on the Platform Top */}
            <div className="absolute inset-1 sm:inset-2 rounded-full bg-radial from-amber-200/30 via-transparent to-transparent" />
          </div>

          {/* 4. Realistic Grounded Contact Shadow on the Platform Top Surface */}
          <div className="absolute bottom-1.5 sm:bottom-3.5 left-1/2 -translate-x-1/2 w-[60%] h-1.5 sm:h-3 rounded-full bg-black/85 blur-[1.5px] sm:blur-[2.5px]" />
        </div>

        {/* Character Body - Standing Directly on Top of the Platform */}
        <div className="relative z-10">
          <canvas
            ref={canvasRef}
            width={480}
            height={720}
            className="w-full h-auto drop-shadow-[0_12px_24px_rgba(0,0,0,0.30)] block select-none pointer-events-none"
            style={{
              imageRendering: "auto",
            }}
          />
          {/* Instant High-Priority Poster: Guarantees female & male characters appear instantly at the exact same moment on first load */}
          {!hasDrawnCanvas && (
            <img
              src={`/characters/${character}/anim_${String(initialFrame).padStart(3, "0")}.webp`}
              alt=""
              width={480}
              height={720}
              fetchPriority="high"
              decoding="async"
              className="w-full h-auto drop-shadow-[0_12px_24px_rgba(0,0,0,0.30)] absolute inset-0 select-none pointer-events-none"
            />
          )}
        </div>

        {/* Chapter Badge Mounted on the Platform Front (Interactive on Mobile & PC) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleCharacterClick();
          }}
          aria-label={`Current status: ${activeChapterLabel}. Click to advance chapter.`}
          className="absolute -bottom-2 sm:-bottom-2.5 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap pointer-events-auto cursor-pointer interactive-tap transition-all duration-200 group focus:outline-none"
        >
          <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full border border-black sm:border-2 dark:border-[#4B5563] bg-white dark:bg-[#1E2333] px-1.5 sm:px-3 py-0.5 sm:py-1 text-[8px] sm:text-[10px] font-bold font-tech shadow-[1.5px_1.5px_0px_#111111] sm:shadow-[2px_2px_0px_#111111] dark:shadow-[1.5px_1.5px_0px_#000000] hover:bg-[#F8D849] hover:text-[#111111] dark:hover:bg-[#F59E0B] dark:hover:text-[#111111] active:translate-y-0.5 transition-all select-none">
            <span className="h-1 sm:h-1.5 w-1 sm:w-1.5 rounded-full bg-[#10B981] dark:bg-[#34D399] animate-pulse shrink-0" />
            <span className="truncate max-w-[58px] sm:max-w-none text-[#111111] dark:text-white dark:group-hover:text-[#111111]">
              {activeChapterLabel.toUpperCase()}
            </span>
          </span>
        </button>
      </div>
    </aside>
  );
}
