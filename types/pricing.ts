export type PricingPlanId = "starter" | "pro" | "executive";

export interface PricingPlan {
  id: PricingPlanId;
  name: string;
  tagline: string;
  priceNaira: number;
  formattedPrice: string;
  cvAllowance: number;
  minCvs: number;
  maxCvs: number;
  popular?: boolean;
  badge?: string;
  features: string[];
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter Package",
    tagline: "Focused package for targeted applications",
    priceNaira: 6000,
    formattedPrice: "₦6,000",
    cvAllowance: 2,
    minCvs: 1,
    maxCvs: 2,
    badge: "2 CVs",
    features: [
      "Create up to 2 distinct, fully-editable CVs",
      "All 4 professional ATS-conscious templates",
      "Gemini AI writing assistant & polish tools",
      "Unlimited PDF and Word (.docx) downloads",
      "Real-time ATS structural readability checks",
      "Built-in screenshot & document privacy protection",
    ],
  },
  {
    id: "pro",
    name: "Standard Career Pro",
    tagline: "Most popular for multi-industry and tailored applications",
    priceNaira: 15000,
    formattedPrice: "₦15,000",
    cvAllowance: 6,
    minCvs: 3,
    maxCvs: 6,
    popular: true,
    badge: "Up to 6 CVs",
    features: [
      "Create and manage up to 6 tailored CVs",
      "Tailor for different industries (Fintech, FMCG, Remote, etc.)",
      "All 4 professional ATS-conscious templates",
      "Gemini AI role polishing & achievement suggestions",
      "Job description keyword matching & gap analysis",
      "Unlimited PDF & Word (.docx) downloads",
      "Snapshot version history per CV",
      "Built-in screenshot & document privacy protection",
    ],
  },
  {
    id: "executive",
    name: "Executive & Multi-Track",
    tagline: "Maximum allowance for senior professionals & consultants",
    priceNaira: 20000,
    formattedPrice: "₦20,000",
    cvAllowance: 13,
    minCvs: 7,
    maxCvs: 13,
    badge: "Max 13 CVs",
    features: [
      "Create and manage up to 13 tailored CVs (maximum platform cap)",
      "Tailor for local, multinational, board, and consulting roles",
      "All 4 professional ATS-conscious templates",
      "Priority Gemini AI writing & restructuring",
      "Full job-tailoring keyword analysis",
      "Unlimited PDF & Word (.docx) downloads",
      "Complete snapshot version history & CV duplication",
      "Built-in screenshot & document privacy protection",
    ],
  },
];

export const ABSOLUTE_MAX_CVS = 13;

export function getPlanById(id: string): PricingPlan | undefined {
  return PRICING_PLANS.find((p) => p.id === id);
}

export function getRecommendedPlanForCount(count: number): PricingPlan {
  if (count <= 2) return PRICING_PLANS[0];
  if (count <= 6) return PRICING_PLANS[1];
  return PRICING_PLANS[2];
}

