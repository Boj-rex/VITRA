import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://vitra.app").replace(/\/$/, "");

  const publicRoutes = [
    "/",
    "/templates",
    "/pricing",
    "/how-it-works",
    "/about",
    "/faq",
    "/contact",
    "/privacy",
    "/terms",
    "/llms.txt",
  ];

  const privateRoutes = [
    "/dashboard/",
    "/create/",
    "/editor/",
    "/my-cvs/",
    "/settings/",
    "/upload/",
    "/analysis/",
    "/api/",
    "/auth/",
    "/backoffice/",
    "/admin/",
    "/pricing/receipt",
    "/pricing/callback",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: publicRoutes,
        disallow: privateRoutes,
      },
      // Generative AI engines & LLM search crawlers (GEO)
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "Google-Extended",
          "PerplexityBot",
          "ClaudeBot",
          "anthropic-ai",
          "Applebot-Extended",
          "cohere-ai",
        ],
        allow: publicRoutes,
        disallow: privateRoutes,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
