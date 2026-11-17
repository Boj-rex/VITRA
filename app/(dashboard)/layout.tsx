import React from "react";
import type { Metadata } from "next";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { getSystemStatus } from "@/lib/config/env";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuthenticatedUser("/login");
  const systemStatus = getSystemStatus();

  return (
    <DashboardShell user={user} systemStatus={systemStatus}>
      {children}
    </DashboardShell>
  );
}

