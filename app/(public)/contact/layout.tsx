import type { Metadata } from "next";
import { BreadcrumbStructuredData } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Contact Support & Career Help Desk — Lagos, Nigeria",
  description:
    "Have questions about your CV, package activation, ATS formatting, or Paystack billing? Reach out to our dedicated support team in Lagos, Nigeria. Prompt turnaround within 2 to 6 business hours.",
  keywords: [
    "Vitra contact support",
    "CV assistance Lagos",
    "ATS resume help Nigeria",
    "career studio Lagos contact",
  ],
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact Vitra Career Studio — Lagos & Global Support",
    description:
      "Get in touch with Vitra support for payment assistance, CV review questions, and formatting guidance.",
    url: "/contact",
  },
  other: {
    "geo.region": "NG-LA",
    "geo.placename": "Lagos, Nigeria",
    "geo.position": "6.5244;3.3792",
    "ICBM": "6.5244, 3.3792",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BreadcrumbStructuredData
        items={[
          { name: "Home", url: "/" },
          { name: "Contact Support", url: "/contact" },
        ]}
      />
      {children}
    </>
  );
}
