"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CreditCard,
  FilePlus2,
  FileUp,
  FolderKanban,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Menu,
  Settings,
  X,
  Sparkles,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SystemStatus } from "@/lib/config/env";
import type { AuthenticatedUser } from "@/lib/auth/session";
import { WashiTape } from "@/components/scrapbook/WashiTape";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { VitraLogo } from "@/components/layout/VitraLogo";

const SIDEBAR_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/create", label: "Create a CV", icon: FilePlus2 },
  { href: "/upload", label: "Improve existing CV", icon: FileUp },
  { href: "/my-cvs", label: "My Documents", icon: FolderKanban },
  { href: "/templates", label: "Templates", icon: LayoutTemplate },
  { href: "/pricing", label: "Packages & Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

function SidebarContent({
  pathname,
  user,
  systemStatus,
  loggingOut,
  onLogout,
  onNavigate,
}: {
  pathname: string;
  user: AuthenticatedUser;
  systemStatus: SystemStatus;
  loggingOut: boolean;
  onLogout: () => void;
  onNavigate: () => void;
}) {
  return (
    <div className="flex min-h-full flex-col justify-between p-4 font-tech">
      <div>
        {/* Brand Logo & Theme Switcher */}
        <div className="px-2 py-2 flex items-center justify-between gap-2">
          <VitraLogo href="/dashboard" />
          <ThemeToggle variant="segmented" />
        </div>

        {/* Navigation Items */}
        <nav className="mt-6 space-y-1.5" aria-label="Workspace navigation">
          {user.role === "admin" && (
            <Link
              href="/backoffice"
              onClick={onNavigate}
              className="flex items-center gap-2 rounded-lg border-2 border-black dark:border-[#333C52] bg-[#F8D849] px-3 py-2 text-xs font-black text-[#111111] shadow-[2px_2px_0px_#000000] hover:-translate-y-0.5 active:translate-y-0.5 select-none mb-3"
            >
              <Crown className="h-4 w-4 text-[#111111]" />
              <span>Super User Back Office</span>
            </Link>
          )}
          {SIDEBAR_ITEMS.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-bold transition-all duration-150 cursor-pointer select-none",
                  "hover:-translate-y-0.5 active:translate-y-0.5 active:scale-[0.98]",
                  active
                    ? "border-2 border-black dark:border-[#333C52] bg-[#111111] dark:bg-[#1E2536] text-white shadow-[2px_2px_0px_#1B3AFF]"
                    : "border-2 border-transparent text-[#252821] dark:text-[#E2E8F0] hover:bg-[#F3F4F6] dark:hover:bg-[#242A3D] hover:border-black/20 dark:hover:border-white/20"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer Details */}
      <div className="space-y-3 border-t-2 border-black/10 dark:border-white/10 pt-4">
        {/* Package Allowance Post-it */}
        <div className="relative rounded-xl border-2 border-black dark:border-[#333C52] bg-[#FEF9C3] dark:bg-[#252110] p-3 shadow-sticker-sm text-xs">
          <WashiTape color="yellow" angle="left" className="-top-2.5 left-3" />
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#854D0E] dark:text-[#FBBF24] uppercase text-[10px] tracking-wider">
              Allowance
            </span>
            <span className="rounded-full bg-[#854D0E]/15 dark:bg-[#FBBF24]/20 px-2 py-0.5 font-bold text-[#854D0E] dark:text-[#FBBF24] text-[10px] capitalize">
              {user.role === "admin"
                ? "Admin (Unlimited)"
                : user.planId
                  ? `${user.planId} (${user.maxCvs} CVs)`
                  : "No Active Plan"}
            </span>
          </div>
          <Link
            href={user.role === "admin" ? "/backoffice" : "/pricing"}
            onClick={onNavigate}
            className="mt-2 block text-center font-bold text-[#111111] dark:text-white hover:underline text-[11px]"
          >
            {user.role === "admin"
              ? "Super User Controls"
              : user.planId
                ? "View / Upgrade Plan"
                : "Activate Package (from ₦6k)"}
          </Link>
        </div>

        {/* User Card */}
        <Link
          href="/settings"
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-xl border border-black/10 dark:border-[#333C52] bg-white dark:bg-[#242A3D] p-2.5 hover:bg-[#F3F4F6] dark:hover:bg-[#2D3548] transition-colors"
        >
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-black dark:border-[#333C52] bg-[#173B30] text-white text-xs font-black shadow-[1px_1px_0px_#000000]">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt={user.fullName ? `${user.fullName}'s avatar` : "Candidate avatar"}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{user.fullName ? user.fullName[0].toUpperCase() : "U"}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-[#111111] dark:text-white">{user.fullName}</p>
            <p className="truncate text-[10px] text-[#77786F] dark:text-[#94A3B8]">{user.email}</p>
          </div>
        </Link>

        {/* Logout Button */}
        <button
          type="button"
          onClick={onLogout}
          disabled={loggingOut}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#242A3D] px-3 py-2 text-xs font-bold text-[#111111] dark:text-white shadow-[2px_2px_0px_#111111] dark:shadow-[2px_2px_0px_#000000] hover:bg-[#FEE2E2] dark:hover:bg-[#3D1A1A] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#111111] dark:hover:shadow-[3px_3px_0px_#EF4444] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 select-none"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>{loggingOut ? "Signing out..." : "Log out"}</span>
        </button>
      </div>
    </div>
  );
}

export function DashboardShell({
  user,
  systemStatus,
  children,
}: {
  user: AuthenticatedUser;
  systemStatus: SystemStatus;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-drafting-grid">
      {/* Desktop Fixed Stationary Sidebar (Stays locked on screen when scrolling) */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-20 w-64 flex-col border-r-2 border-black dark:border-[#2D3548] bg-white dark:bg-[#181C28] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <SidebarContent
          pathname={pathname}
          user={user}
          systemStatus={systemStatus}
          loggingOut={loggingOut}
          onLogout={handleLogout}
          onNavigate={() => setMobileNavOpen(false)}
        />
      </aside>

      {/* Main Content Area (Offset by sidebar width on desktop) */}
      <div className="flex flex-1 flex-col min-w-0 lg:pl-64">
        {/* Mobile Top Bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b-2 border-black dark:border-[#2D3548] bg-white dark:bg-[#181C28] px-4 lg:hidden font-tech">
          <VitraLogo href="/dashboard" compact />
          <div className="flex items-center gap-2">
            <ThemeToggle variant="segmented" />
            <Link
              href="/settings"
              className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-black dark:border-[#333C52] bg-[#173B30] text-white text-xs font-black"
              aria-label="User profile settings"
            >
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt={user.fullName ? `${user.fullName}'s avatar` : "Candidate avatar"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{user.fullName ? user.fullName[0].toUpperCase() : "U"}</span>
              )}
            </Link>
            <button
              type="button"
              onClick={() => setMobileNavOpen((v) => !v)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border-2 border-black dark:border-[#333C52] text-[#111111] dark:text-white bg-white dark:bg-[#242A3D] shadow-[2px_2px_0px_#111111] dark:shadow-[2px_2px_0px_#000000]"
              aria-label="Toggle workspace menu"
            >
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </header>

        {/* Mobile Drawer */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-40 flex lg:hidden">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileNavOpen(false)}
            />
            <div className="relative z-50 w-72 max-w-[85vw] h-full overflow-y-auto bg-white dark:bg-[#181C28] border-r-2 border-black dark:border-[#2D3548]">
              <SidebarContent
                pathname={pathname}
                user={user}
                systemStatus={systemStatus}
                loggingOut={loggingOut}
                onLogout={handleLogout}
                onNavigate={() => setMobileNavOpen(false)}
              />
            </div>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
