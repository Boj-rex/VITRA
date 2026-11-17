import React from "react";
import type { Metadata } from "next";
import { requireSuperUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Super User Back Office | Vitra Command Center",
  description: "Administrative command center for payment history, authentication tracking, and candidate management.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function BackOfficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Enforce server-side Super User authentication
  await requireSuperUser("/login?next=/backoffice");

  return <>{children}</>;
}

