import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { ScreenCaptureProtection } from "@/components/security/ScreenCaptureProtection";
import { CookieConsentBanner } from "@/components/legal/CookieConsentBanner";
import { FloatingSupportWidget } from "@/components/support/FloatingSupportWidget";
import { RootStructuredData } from "@/components/seo/JsonLd";
import "./globals.css";

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://vitra.app").replace(/\/$/, "");

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFEFA" },
    { media: "(prefers-color-scheme: dark)", color: "#161B26" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Vitra — Thoughtful, ATS-Friendly CV Builder & Career Studio",
    template: "%s | Vitra Career Studio",
  },
  description:
    "Craft ATS-compliant CVs tailored for Nigerian professionals, NYSC graduates, and global remote opportunities. Features 9 modern & scrapbook templates, Gemini AI writing assistance, deterministic ATS scoring, and instant PDF/DOCX downloads.",
  keywords: [
    "ATS CV builder Nigeria",
    "ATS resume builder",
    "NYSC CV format",
    "Nigerian graduate CV template",
    "Lagos job application CV",
    "corporate executive CV template",
    "remote job CV Africa",
    "UK visa job application CV",
    "Paystack CV maker",
    "AI CV writer Nigeria",
    "ATS-friendly resume templates",
    "download CV Word docx Nigeria",
    "PDF CV maker Lagos",
  ],
  authors: [{ name: "Vitra Career Studio", url: siteUrl }],
  creator: "Vitra Career Studio",
  publisher: "Vitra Career Studio",
  formatDetection: {
    telephone: false,
    date: false,
    email: false,
    address: false,
  },
  alternates: {
    canonical: "/",
    languages: {
      "en-NG": "/",
      "en-GB": "/",
      "en-US": "/",
      "x-default": "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    alternateLocale: ["en_GB", "en_US"],
    url: siteUrl,
    siteName: "Vitra Career Studio",
    title: "Vitra — Thoughtful, ATS-Friendly CV Builder & Career Studio",
    description:
      "Craft ATS-compliant CVs tailored for Nigerian roles, NYSC graduates, and global remote jobs with 9 templates, AI writing, and instant PDF & Word exports.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Vitra — Thoughtful, ATS-Friendly CV Studio for Nigeria & Global Careers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vitra — Thoughtful, ATS-Friendly CV Builder & Career Studio",
    description:
      "Craft ATS-compliant CVs tailored for Nigerian roles, NYSC graduates, and global remote jobs with 9 templates, AI writing, and instant PDF & Word exports.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  other: {
    "geo.region": "NG-LA",
    "geo.placename": "Lagos, Nigeria",
    "geo.position": "6.5244;3.3792",
    "ICBM": "6.5244, 3.3792",
    "content-language": "en-NG, en",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&family=Press+Start+2P&family=Space+Grotesk:wght@500;700&display=swap"
          rel="stylesheet"
        />
        <Script
          id="vitra-theme-init"
          src="/theme-init.js"
          strategy="beforeInteractive"
        />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-full bg-moon-sand text-[#252821] dark:text-[#F1F5F9] font-sans flex flex-col selection:bg-[#173B30] selection:text-[#FFFEFA]"
      >
        <ScreenCaptureProtection>
          <RootStructuredData />
          {children}
          <CookieConsentBanner />
          <FloatingSupportWidget />
        </ScreenCaptureProtection>
      </body>
    </html>
  );
}
