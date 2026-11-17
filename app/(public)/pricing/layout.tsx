import type { Metadata } from "next";
import { BreadcrumbStructuredData } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Packages & Pricing — Clear Nigerian Naira Rates for ATS CVs",
  description:
    "Transparent CV packages starting from ₦6,000 for 2 CVs, ₦15,000 for up to 6 CVs, and ₦20,000 for up to 13 CVs. Includes all 9 ATS templates, Gemini AI writing assistance, and instant PDF/DOCX downloads via Paystack.",
  keywords: [
    "CV builder price Nigeria",
    "Paystack resume builder",
    "ATS CV cost Lagos",
    "professional CV pricing Nigeria",
    "Naira payment CV builder",
    "graduate CV package Nigeria",
  ],
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Vitra Packages & Pricing — Transparent Naira Plans",
    description:
      "Get recruiter-approved ATS CVs starting at ₦6,000. Unlock instant PDF & Word exports, AI keyword alignment, and 9 templates.",
    url: "/pricing",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BreadcrumbStructuredData
        items={[
          { name: "Home", url: "/" },
          { name: "Pricing & Packages", url: "/pricing" },
        ]}
      />
      {children}
    </>
  );
}
