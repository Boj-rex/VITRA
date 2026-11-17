"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { VitraLogo } from "@/components/layout/VitraLogo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/templates", label: "Templates" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
];

export function PublicNavbar({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;

    function handleOutsideClick(event: MouseEvent | TouchEvent | PointerEvent) {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setMobileOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    }

    document.addEventListener("pointerdown", handleOutsideClick);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen]);

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 border-b border-[#E2DDD2] bg-[#F6F3ED]/95 backdrop-blur-sm"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <VitraLogo href="/" size="md" />

        <nav className="hidden items-center gap-7 md:flex" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors",
                pathname === link.href
                  ? "text-[#173B30]"
                  : "text-[#77786F] hover:text-[#173B30]"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className={buttonVariants({ variant: "primary", size: "sm" })}
            >
              Go to workspace
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-2 text-sm font-medium text-[#252821] hover:text-[#173B30] transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className={buttonVariants({ variant: "primary", size: "sm" })}
              >
                Create my CV
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#D4CFC3] bg-[#FFFEFA] text-[#252821] md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-[#E2DDD2] bg-[#FFFEFA] px-4 py-4 md:hidden">
          <div className="flex flex-col space-y-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-medium",
                  pathname === link.href
                    ? "bg-[#173B30]/8 text-[#173B30]"
                    : "text-[#252821] hover:bg-[#F6F3ED]"
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-[#E2DDD2] pt-3">
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className={buttonVariants({ variant: "primary", className: "w-full" })}
                >
                  Go to workspace
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className={buttonVariants({ variant: "outline", className: "w-full" })}
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className={buttonVariants({ variant: "primary", className: "w-full" })}
                  >
                    Create my CV
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Backdrop Overlay: Tapping anywhere outside the menu box closes it */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 top-16 bg-black/40 backdrop-blur-[2px] -z-10 md:hidden transition-opacity duration-200"
          aria-hidden="true"
        />
      )}
    </header>
  );
}

