"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { VitraLogo } from "@/components/layout/VitraLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { cn } from "@/lib/utils";

interface ScrapbookNavbarProps {
  isAuthenticated?: boolean;
}

const NAV_LINKS = [
  { href: "/templates", label: "Templates" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/upload", label: "ATS Checker" },
];

export function ScrapbookNavbar({ isAuthenticated = false }: ScrapbookNavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // Close mobile menu when user taps / clicks outside the menu box or presses Escape
  useEffect(() => {
    if (!mobileMenuOpen) return;

    function handleOutsideClick(event: MouseEvent | TouchEvent | PointerEvent) {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handleOutsideClick);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  return (
    <header
      ref={headerRef}
      className="fixed top-0 inset-x-0 z-50 w-full border-b border-[#D8D4C8] dark:border-[#2D3548] bg-[#FFFEFA]/90 dark:bg-[#141722]/90 backdrop-blur-md transition-all shadow-[0_2px_10px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.4)]"
    >
      <div className="mx-auto flex h-14 sm:h-16 max-w-6xl items-center justify-between px-3 sm:px-6 lg:px-8">
        {/* Left Side: Brand Logo (Horizontal lockup with yellow squircle & typography) */}
        <VitraLogo href="/" size="md" />

        {/* Center: Clean Uncluttered Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 font-tech bg-transparent border-0 outline-none shadow-none" aria-label="Main navigation">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3.5 py-1.5 text-xs font-bold tracking-wide rounded-full transition-all duration-150 cursor-pointer select-none",
                  "hover:-translate-y-0.5 active:translate-y-0.5 active:scale-95",
                  isActive
                    ? "bg-[#111111] text-white dark:bg-[#242A3D] dark:text-white dark:border dark:border-[#333C52] shadow-[2px_2px_0px_rgba(0,0,0,0.15)] dark:shadow-[2px_2px_0px_rgba(0,0,0,0.4)]"
                    : "bg-transparent border-0 outline-none shadow-none text-[#55564E] dark:text-[#CBD5E1] hover:text-[#111111] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Side: Theme Switcher & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Segmented Light / Dark Toggle */}
          <ThemeToggle variant="segmented" />

          {/* Action Button */}
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 rounded-full border-2 border-[#111111] dark:border-[#333C52] bg-[#111111] dark:bg-[#1A202C] px-2.5 sm:px-4 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold text-white font-tech shadow-[2px_2px_0px_#1B3AFF] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#1B3AFF] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none active:scale-[0.97] transition-all cursor-pointer select-none"
            >
              <span>WORKSPACE</span>
            </Link>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2 font-tech">
              <Link
                href="/login"
                className="hidden md:inline-flex px-3 py-1.5 text-xs font-bold text-[#55564E] dark:text-[#CBD5E1] hover:text-black dark:hover:text-white rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:scale-95 select-none"
              >
                SIGN IN
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1 rounded-full border-2 border-[#111111] dark:border-[#333C52] bg-[#F8D849] dark:bg-[#F8D849] px-2.5 sm:px-4 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold text-[#111111] shadow-[2px_2px_0px_#111111] dark:shadow-[2px_2px_0px_#000] hover:bg-[#FACC15] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#111111] dark:hover:shadow-[3px_3px_0px_#F59E0B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none active:scale-[0.97] transition-all cursor-pointer select-none"
              >
                <span>GET STARTED</span>
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Button with Smooth Morphing Micro-Animation */}
          <button
            type="button"
            className="md:hidden flex h-8 w-8 min-h-[32px] min-w-[32px] items-center justify-center rounded-lg border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#1E2333] text-[#111111] dark:text-white shadow-[1.5px_1.5px_0px_#111111] dark:shadow-[1.5px_1.5px_0px_#000] hover:-translate-y-0.5 hover:shadow-[2.5px_2.5px_0px_#111111] active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-none active:scale-95 transition-all select-none cursor-pointer"
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            <div className="relative flex h-3.5 w-4 flex-col justify-between items-center pointer-events-none">
              <span
                className={cn(
                  "h-0.5 w-4 rounded-full bg-current transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-center",
                  mobileMenuOpen && "translate-y-[5.5px] rotate-45"
                )}
              />
              <span
                className={cn(
                  "h-0.5 w-4 rounded-full bg-current transition-all duration-200 ease-out",
                  mobileMenuOpen && "opacity-0 scale-x-0"
                )}
              />
              <span
                className={cn(
                  "h-0.5 w-4 rounded-full bg-current transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-center",
                  mobileMenuOpen && "-translate-y-[5.5px] -rotate-45"
                )}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu with Animated Open & Close Micro-Transitions */}
      <div
        className={cn(
          "md:hidden overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] border-t",
          mobileMenuOpen
            ? "max-h-[460px] opacity-100 translate-y-0 border-[#D8D4C8] dark:border-[#2D3548]"
            : "max-h-0 opacity-0 -translate-y-3 border-transparent pointer-events-none"
        )}
      >
        <div className="bg-[#FFFEFA]/95 dark:bg-[#141722]/95 backdrop-blur-md px-4 py-4 space-y-2 font-tech shadow-lg">
          {NAV_LINKS.map((link, idx) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                style={{ transitionDelay: `${mobileMenuOpen ? idx * 35 : 0}ms` }}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-bold tracking-wide border-0 outline-none transition-all duration-200 active:scale-[0.98]",
                  mobileMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2",
                  isActive
                    ? "bg-[#111111] text-white dark:bg-[#242A3D] dark:text-white dark:border dark:border-[#333C52]"
                    : "bg-transparent text-[#55564E] dark:text-[#CBD5E1] hover:bg-black/5 dark:hover:bg-white/10"
                )}
              >
                <span>{link.label}</span>
                {isActive && <span>●</span>}
              </Link>
            );
          })}
          {!isAuthenticated ? (
            <div className="pt-2 border-t border-black/10 dark:border-white/10 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#1E2333] px-3 py-2.5 text-center text-xs font-bold text-[#111111] dark:text-white hover:-translate-y-0.5 active:scale-95 transition-all"
              >
                SIGN IN
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg border-2 border-black dark:border-[#333C52] bg-[#F8D849] px-3 py-2.5 text-center text-xs font-bold text-[#111111] shadow-[2px_2px_0px_#111111] hover:-translate-y-0.5 active:scale-95 transition-all"
              >
                GET STARTED
              </Link>
            </div>
          ) : (
            <div className="pt-2 border-t border-black/10 dark:border-white/10 flex flex-col gap-2">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg border-2 border-black dark:border-[#333C52] bg-[#111111] dark:bg-[#1A202C] px-3 py-2.5 text-center text-xs font-bold text-white shadow-[2px_2px_0px_#1B3AFF] hover:-translate-y-0.5 active:scale-95 transition-all"
              >
                WORKSPACE
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer Menu Backdrop (Tapping anywhere outside the menu box closes it) */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 top-14 sm:top-16 bg-black/40 dark:bg-black/60 backdrop-blur-[2px] -z-10 md:hidden transition-opacity duration-200"
          aria-hidden="true"
        />
      )}
    </header>
  );
}
