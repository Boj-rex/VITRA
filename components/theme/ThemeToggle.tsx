"use client";

import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  variant?: "floating" | "navbar" | "segmented" | "compact";
}

/**
 * Calculates whether the current time of day is daytime (Light) or nighttime (Dark).
 * Daytime: 6:00 AM to 5:59 PM (06:00 - 17:59) -> Light Mode (Moon Sand)
 * Evening/Nighttime: 6:00 PM to 5:59 AM (18:00 - 05:59) -> Dark Mode (Obsidian)
 */
export function getTimeBasedTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18 ? "light" : "dark";
}

function applyThemeToDom(mode: "light" | "dark") {
  const root = document.documentElement;
  const body = document.body;
  if (mode === "dark") {
    root.classList.add("dark");
    body.classList.add("dark");
    root.setAttribute("data-theme", "dark");
    body.setAttribute("data-theme", "dark");
  } else {
    root.classList.remove("dark");
    body.classList.remove("dark");
    root.setAttribute("data-theme", "light");
    body.setAttribute("data-theme", "light");
  }
}

export function ThemeToggle({ className, variant = "navbar" }: ThemeToggleProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  // Sync state and apply to both html and body elements
  useEffect(() => {
    setMounted(true);
    const root = document.documentElement;

    const sessionTheme =
      typeof window !== "undefined" ? sessionStorage.getItem("vitra_theme") : null;
    const initialTheme: "light" | "dark" =
      sessionTheme === "dark" || sessionTheme === "light"
        ? sessionTheme
        : getTimeBasedTheme();

    applyThemeToDom(initialTheme);
    setTheme(initialTheme);

    // Periodic check to adjust smoothly across 6am / 6pm if user hasn't set a manual session choice
    const syncTimeTheme = () => {
      const hasManualSession = Boolean(sessionStorage.getItem("vitra_theme"));
      if (!hasManualSession) {
        const expected = getTimeBasedTheme();
        const currentIsDark =
          root.classList.contains("dark") || root.getAttribute("data-theme") === "dark";
        const currentTheme = currentIsDark ? "dark" : "light";
        if (currentTheme !== expected) {
          applyThemeToDom(expected);
          setTheme(expected);
        }
      }
    };

    const intervalId = setInterval(syncTimeTheme, 60000);
    document.addEventListener("visibilitychange", syncTimeTheme);

    const handleThemeChange = (e: Event) => {
      const customTheme = (e as CustomEvent)?.detail?.theme;
      if (customTheme) {
        setTheme(customTheme);
      } else {
        const darkNow =
          root.classList.contains("dark") || root.getAttribute("data-theme") === "dark";
        setTheme(darkNow ? "dark" : "light");
      }
    };

    window.addEventListener("vitra:theme-changed", handleThemeChange);
    return () => {
      window.removeEventListener("vitra:theme-changed", handleThemeChange);
      document.removeEventListener("visibilitychange", syncTimeTheme);
      clearInterval(intervalId);
    };
  }, []);

  const setThemeMode = (mode: "light" | "dark") => {
    applyThemeToDom(mode);

    try {
      sessionStorage.setItem("vitra_theme", mode);
    } catch {
      // safe catch
    }

    setTheme(mode);
    window.dispatchEvent(
      new CustomEvent("vitra:theme-changed", { detail: { theme: mode } })
    );
  };

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setThemeMode(nextTheme);
  };

  const isDarkMode = mounted ? theme === "dark" : false;

  // Segmented Pill (Shows both Light and Obsidian states clearly with active badge)
  if (variant === "navbar" || variant === "segmented") {
    return (
      <div
        className={cn(
          "inline-flex items-center rounded-full border-2 border-black dark:border-[#3A4256] bg-white dark:bg-[#12151E] p-0.5 font-tech text-xs shadow-[1.5px_1.5px_0px_#111111] dark:shadow-[1.5px_1.5px_0px_#000] select-none",
          className
        )}
        role="group"
        aria-label="Theme switcher"
      >
        <button
          type="button"
          onClick={() => setThemeMode("light")}
          aria-pressed={!isDarkMode}
          title="Switch to Moon Sand Light Mode"
          className={cn(
            "flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full text-xs font-bold transition-all duration-150 cursor-pointer select-none",
            "hover:-translate-y-0.5 active:translate-y-0.5 active:scale-95",
            !isDarkMode
              ? "bg-[#111111] text-white shadow-[1px_1px_0px_rgba(0,0,0,0.2)]"
              : "text-[#77786F] hover:text-black dark:text-[#94A3B8] dark:hover:text-white"
          )}
        >
          <Sun className={cn("h-3 w-3", !isDarkMode ? "text-amber-300" : "text-amber-500/70")} />
          <span className="hidden md:inline whitespace-nowrap">Light</span>
        </button>
        <button
          type="button"
          onClick={() => setThemeMode("dark")}
          aria-pressed={isDarkMode}
          title="Switch to 75% Obsidian Black Dark Mode"
          className={cn(
            "flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full text-xs font-bold transition-all duration-150 cursor-pointer select-none",
            "hover:-translate-y-0.5 active:translate-y-0.5 active:scale-95",
            isDarkMode
              ? "bg-amber-400 text-black shadow-[1px_1px_0px_rgba(0,0,0,0.4)] font-extrabold"
              : "text-[#55564E] hover:text-black dark:text-[#CBD5E1] dark:hover:text-white"
          )}
        >
          <Moon className={cn("h-3 w-3", isDarkMode ? "text-black fill-black" : "text-amber-500")} />
          <span className="hidden md:inline whitespace-nowrap">Obsidian</span>
        </button>
      </div>
    );
  }

  // Compact Single-Button Variant (for tight spaces)
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        isDarkMode ? "Switch to Moon Sand Light Mode" : "Switch to Obsidian Black Dark Mode"
      }
      title={
        isDarkMode ? "Switch to Moon Sand Light Mode" : "Switch to Obsidian Black Dark Mode"
      }
      className={cn(
        "group flex items-center gap-1.5 rounded-full border-2 px-2.5 py-1 sm:px-3 sm:py-1.5 font-tech text-[11px] font-bold transition-all duration-150 cursor-pointer select-none focus:outline-none hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1.5px] active:scale-95 active:shadow-none",
        isDarkMode
          ? "border-[#3A4256] bg-[#0E1118] text-amber-300 shadow-[2px_2px_0px_#000] hover:bg-[#171B26] hover:shadow-[3px_3px_0px_#F59E0B]"
          : "border-black bg-[#111111] text-white shadow-[2px_2px_0px_#111111] hover:bg-[#252821] hover:shadow-[3px_3px_0px_#111111]",
        className
      )}
    >
      <span
        className={cn(
          "flex h-4 w-4 items-center justify-center rounded-full",
          isDarkMode ? "bg-amber-400/20 text-amber-300" : "bg-white/20 text-amber-300"
        )}
      >
        {isDarkMode ? (
          <Sun className="h-2.5 w-2.5 text-amber-400 fill-amber-400/30" />
        ) : (
          <Moon className="h-2.5 w-2.5 text-amber-300" />
        )}
      </span>
      <span className="whitespace-nowrap">
        {isDarkMode ? "Moon Sand" : "Obsidian Dark"}
      </span>
    </button>
  );
}
