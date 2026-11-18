import React from "react";
import { getSiteUrl } from "@/lib/config/site";

export interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

const BASE_URL = getSiteUrl();

export function RootStructuredData() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${BASE_URL}/#organization`,
    name: "Vitra Career Studio",
    alternateName: "Vitra",
    url: BASE_URL,
    logo: `${BASE_URL}/icon.png`,
    description:
      "Vitra is a modern ATS-conscious CV builder and career studio tailored for Nigerian professionals, graduates, and global remote job seekers.",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Lagos",
      addressRegion: "Lagos State",
      addressCountry: "NG",
    },
    areaServed: [
      {
        "@type": "Country",
        name: "Nigeria",
      },
      {
        "@type": "Country",
        name: "United Kingdom",
      },
      {
        "@type": "Country",
        name: "United States",
      },
      {
        "@type": "Country",
        name: "Canada",
      },
      {
        "@type": "Country",
        name: "United Arab Emirates",
      },
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      url: `${BASE_URL}/contact`,
      availableLanguage: ["English", "Yoruba", "Hausa", "Igbo"],
    },
  };

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${BASE_URL}/#webapp`,
    name: "Vitra ATS CV Builder",
    url: BASE_URL,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web Browser (Chrome, Safari, Edge, Firefox, Mobile)",
    browserRequirements: "Requires modern web browser with JavaScript enabled",
    description:
      "Create professional, ATS-compliant CVs tailored for Nigerian roles, NYSC graduates, and international career paths with AI writing, deterministic keyword checking, and vector PDF & Word (.docx) downloads.",
    offers: [
      {
        "@type": "Offer",
        name: "Starter Package",
        price: "6000",
        priceCurrency: "NGN",
        description: "2 distinct CVs with full ATS template access and AI writing support",
        url: `${BASE_URL}/pricing`,
        eligibleRegion: "NG",
      },
      {
        "@type": "Offer",
        name: "Standard Career Pro",
        price: "15000",
        priceCurrency: "NGN",
        description: "Up to 6 distinct tailored CVs for multi-industry applications",
        url: `${BASE_URL}/pricing`,
        eligibleRegion: "NG",
      },
      {
        "@type": "Offer",
        name: "Executive & Multi-Track",
        price: "20000",
        priceCurrency: "NGN",
        description: "Up to 13 tailored CVs for senior executives and consultants",
        url: `${BASE_URL}/pricing`,
        eligibleRegion: "NG",
      },
    ],
    featureList: [
      "9 Professional ATS-Compliant Templates (Modern, Corporate Executive, Ivy League, Scrapbook)",
      "Nigerian NYSC & Education Guidance without fabricated credentials",
      "Deterministic Hard-Coded ATS Engine + Gemini AI Keyword Alignment",
      "Instant Vector PDF and Editable DOCX Word Exports",
      "Secure Paystack Naira Payment Gateway with Instant Quota Activation",
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "1280",
      bestRating: "5",
      worstRating: "1",
    },
    creator: {
      "@type": "Organization",
      name: "Vitra Career Studio",
    },
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${BASE_URL}/#website`,
    url: BASE_URL,
    name: "Vitra — ATS CV Studio",
    publisher: {
      "@id": `${BASE_URL}/#organization`,
    },
    inLanguage: "en-NG",
  };

  return (
    <>
      <JsonLd data={organizationSchema} />
      <JsonLd data={softwareSchema} />
      <JsonLd data={websiteSchema} />
    </>
  );
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function BreadcrumbStructuredData({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${BASE_URL}${item.url.startsWith("/") ? item.url : `/${item.url}`}`,
    })),
  };

  return <JsonLd data={schema} />;
}
