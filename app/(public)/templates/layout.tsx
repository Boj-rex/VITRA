import type { Metadata } from "next";
import { BreadcrumbStructuredData } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "9 Professional ATS CV Templates — Modern, Academic & Executive",
  description:
    "Explore 9 recruiter-tested, ATS-friendly CV templates designed for Nigerian and international job markets. Choose Classic Professional, Corporate Executive, Ivy League Academic, Minimalist, Technical, and Tactile Scrapbook designs with instant PDF & Word downloads.",
  keywords: [
    "ATS CV templates Nigeria",
    "ATS-friendly resume templates",
    "corporate executive CV template",
    "academic CV layout",
    "modern CV templates Lagos",
    "best CV formats Nigeria",
    "Word docx CV templates",
  ],
  alternates: {
    canonical: "/templates",
  },
  openGraph: {
    title: "9 Recruiter-Approved ATS CV Templates — Vitra Career Studio",
    description:
      "Explore 9 ATS-friendly templates built for Nigerian and global career success. Instant PDF and DOCX export with clean parsing.",
    url: "/templates",
  },
};

export default function TemplatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BreadcrumbStructuredData
        items={[
          { name: "Home", url: "/" },
          { name: "CV Templates", url: "/templates" },
        ]}
      />
      {children}
    </>
  );
}
