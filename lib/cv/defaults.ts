import type {
  CareerProfile,
  CvEditorSettings,
  NoExperienceCategory,
  SkillCategory,
  StructuredCvContent,
  TemplateId,
} from "@/types/cv";

export function createEmptyStructuredCv(country = "Nigeria"): StructuredCvContent {
  return {
    personalInfo: {
      fullName: "",
      professionalTitle: "",
      email: "",
      phone: "",
      city: "",
      country,
      linkedinUrl: "",
      portfolioUrl: "",
      websiteUrl: "",
    },
    summary: "",
    summaryContext: {
      background: "",
      strengths: "",
      interests: "",
      relevantExperience: "",
      targetRole: "",
    },
    hasFormalExperience: true,
    experience: [],
    alternativeExperience: [],
    education: [],
    skills: [],
    certifications: [],
    projects: [],
    additional: {
      memberships: [],
      publications: [],
      awards: [],
      volunteerSummary: "",
      languages: [],
      interests: [],
      references: [],
      omitReferences: true,
    },
  };
}

export function createDefaultEditorSettings(profile?: CareerProfile): CvEditorSettings {
  const isEntry =
    profile === "student" ||
    profile === "recent-graduate" ||
    profile === "first-time-job-seeker";

  return {
    fontSize: "medium",
    spacing: "normal",
    fontFamily: "calibri",
    hiddenSections: [],
    sectionOrder: isEntry
      ? ["summary", "education", "projects", "skills", "experience", "certifications", "additional"]
      : ["summary", "experience", "education", "skills", "projects", "certifications", "additional"],
  };
}

export function getRecommendedTemplateForProfile(profile: CareerProfile): TemplateId {
  switch (profile) {
    case "student":
    case "recent-graduate":
    case "first-time-job-seeker":
      return "graduate-entry";
    case "experienced-professional":
      return "corporate-executive";
    case "freelancer":
    case "career-changer":
      return "modern-minimal";
    default:
      return "classic-professional";
  }
}

export const CAREER_PROFILES: {
  id: CareerProfile;
  label: string;
  description: string;
  guidance: string;
  defaultHasFormalExperience: boolean;
}[] = [
  {
    id: "student",
    label: "Student or undergraduate",
    description: "Currently studying at a university, polytechnic or college.",
    guidance: "We will highlight your degree in progress, SIWES, coursework, academic projects and campus leadership.",
    defaultHasFormalExperience: false,
  },
  {
    id: "recent-graduate",
    label: "Recent graduate",
    description: "Completed your degree or diploma, including NYSC corps members or alumni.",
    guidance: "We will emphasize your qualification, NYSC service, internships, projects and transferable skills.",
    defaultHasFormalExperience: false,
  },
  {
    id: "first-time-job-seeker",
    label: "First-time job seeker",
    description: "Entering the workforce for the first time without prior formal employment.",
    guidance: "No work history needed—we guide you through practical training, volunteering, projects and strengths.",
    defaultHasFormalExperience: false,
  },
  {
    id: "entry-level",
    label: "Entry-level professional",
    description: "1 to 2 years of early career work experience, internships or NYSC.",
    guidance: "We balance your early roles, achievements and academic foundation clearly for recruiters.",
    defaultHasFormalExperience: true,
  },
  {
    id: "experienced-professional",
    label: "Experienced professional",
    description: "Established career track with multiple roles or leadership responsibilities.",
    guidance: "We structure your work history around clear responsibilities, scope and user-verified accomplishments.",
    defaultHasFormalExperience: true,
  },
  {
    id: "career-changer",
    label: "Career changer",
    description: "Transitioning skills and experience into a new field or industry.",
    guidance: "We spotlight transferable skills, recent certifications and relevant projects aligned to your target role.",
    defaultHasFormalExperience: true,
  },
  {
    id: "freelancer",
    label: "Freelancer or self-employed",
    description: "Independent consultant, contractor, artisan or business operator.",
    guidance: "We organize client engagements, delivered projects and core capabilities cleanly.",
    defaultHasFormalExperience: true,
  },
];

export const NIGERIAN_AND_INTL_QUALIFICATIONS = [
  "SSCE (WAEC / NECO)",
  "ND (National Diploma)",
  "HND (Higher National Diploma)",
  "NCE (Nigeria Certificate in Education)",
  "BSc (Bachelor of Science)",
  "BA (Bachelor of Arts)",
  "BEng (Bachelor of Engineering)",
  "LLB (Bachelor of Laws)",
  "BTech (Bachelor of Technology)",
  "PGD (Postgraduate Diploma)",
  "MSc (Master of Science)",
  "MA (Master of Arts)",
  "MBA (Master of Business Administration)",
  "PhD (Doctor of Philosophy)",
  "ICAN / ACCA / CIPM / NSE (Professional Qualification)",
  "Other / International Equivalent",
];

export const NO_EXPERIENCE_CATEGORIES: {
  id: NoExperienceCategory;
  label: string;
  example: string;
}[] = [
  { id: "nysc", label: "NYSC Primary Assignment & CDS", example: "Served as Mathematics Teacher at Government Secondary School, organizing exam prep sessions." },
  { id: "siwes", label: "SIWES / Industrial Training", example: "Completed 6-month Student Industrial Work Experience Scheme assisting lab analysts with quality tests." },
  { id: "internship", label: "Internship", example: "Supported the operations team with weekly inventory reconciliations and vendor correspondence." },
  { id: "academic-project", label: "Academic Project", example: "Designed a solar-powered water monitoring prototype for final-year engineering capstone." },
  { id: "personal-project", label: "Personal Project", example: "Built an invoice tracking spreadsheet and web tool for a local family retail shop." },
  { id: "volunteering", label: "Volunteering", example: "Coordinated attendee check-in and logistics for a 200-person community health outreach." },
  { id: "leadership", label: "Leadership Role", example: "Elected Financial Secretary of departmental student association, managing budget records." },
  { id: "freelance", label: "Freelance Work", example: "Created social media graphics and product flyers for three small local businesses." },
  { id: "practical-training", label: "Practical Training / Bootcamp", example: "Completed 12-week intensive data analytics fellowship covering Excel and SQL queries." },
  { id: "extracurricular", label: "Relevant Extracurricular Activity", example: "Debate society captain representing faculty at inter-university competitions." },
];

export const SKILL_CATEGORIES: {
  id: SkillCategory;
  label: string;
  suggestions: string[];
}[] = [
  {
    id: "technical",
    label: "Technical Skills",
    suggestions: [
      "Data Analysis",
      "SQL",
      "Python",
      "JavaScript / TypeScript",
      "AutoCAD",
      "Financial Modeling",
      "Bookkeeping",
      "Graphic Design",
      "Quality Control",
      "Network Administration",
    ],
  },
  {
    id: "digital",
    label: "Digital & Office Tools",
    suggestions: [
      "Microsoft Excel",
      "Microsoft Word",
      "PowerPoint",
      "Google Workspace",
      "CRM Software",
      "Canva",
      "QuickBooks",
      "Slack & Collaboration Tools",
    ],
  },
  {
    id: "communication",
    label: "Communication Skills",
    suggestions: [
      "Written Communication",
      "Client Relations",
      "Stakeholder Reporting",
      "Public Speaking",
      "Active Listening",
      "Customer Support",
      "Technical Documentation",
    ],
  },
  {
    id: "leadership",
    label: "Leadership & Teamwork",
    suggestions: [
      "Team Coordination",
      "Project Planning",
      "Mentoring",
      "Conflict Resolution",
      "Cross-Functional Collaboration",
      "Decision Making",
    ],
  },
  {
    id: "administrative",
    label: "Administrative & Operations",
    suggestions: [
      "Record Keeping",
      "Scheduling & Calendar Management",
      "Inventory Management",
      "Procurement Support",
      "Office Administration",
      "Report Preparation",
    ],
  },
  {
    id: "industry",
    label: "Industry-Specific Skills",
    suggestions: [
      "Supply Chain Coordination",
      "Retail Merchandising",
      "Healthcare Patient Intake",
      "Curriculum Delivery",
      "Compliance & Auditing",
      "Hospitality Operations",
    ],
  },
  {
    id: "languages",
    label: "Languages",
    suggestions: ["English", "Yoruba", "Igbo", "Hausa", "Pidgin English", "French"],
  },
];

export const TEMPLATE_METADATA: {
  id: TemplateId;
  name: string;
  tagline: string;
  description: string;
  bestFor: string;
  atsNote: string;
  category: "all" | "tech" | "executive" | "academic" | "minimal" | "finance" | "entry";
}[] = [
  {
    id: "classic-professional",
    name: "Classic Professional",
    tagline: "Single-column ATS standard",
    description: "Clean single-column layout on crisp white paper with timeless section hierarchy and readable typography.",
    bestFor: "All industries, banking, engineering, civil service, corporate roles and online ATS portals.",
    atsNote: "Strongly ATS-oriented single-column structure",
    category: "all",
  },
  {
    id: "modern-minimal",
    name: "Modern Minimal",
    tagline: "Refined forest green accents",
    description: "Generous editorial spacing, subtle forest green rule accents and clean section dividers.",
    bestFor: "Technology, design, consulting, startups and modern international roles.",
    atsNote: "Clean reading order with subtle visual polish",
    category: "minimal",
  },
  {
    id: "corporate-executive",
    name: "Corporate Executive",
    tagline: "Formal leadership hierarchy",
    description: "Commanding header framing, restrained serif/sans pairing and structured accomplishment blocks.",
    bestFor: "Senior managers, directors, finance leaders and experienced specialists.",
    atsNote: "Clear heading structure for senior recruiters",
    category: "executive",
  },
  {
    id: "graduate-entry",
    name: "Graduate & Entry Level",
    tagline: "Education & potential first",
    description: "Elevates qualifications, NYSC, SIWES, academic projects and core skills ahead of formal history.",
    bestFor: "Students, fresh graduates, NYSC members and first-time applicants.",
    atsNote: "Highlights potential without requiring job history",
    category: "entry",
  },
  {
    id: "tech-innovator",
    name: "Tech Innovator",
    tagline: "Engineered for developers & tech roles",
    description: "Clean steel-blue accents with technical skill tag pills, live repository/portfolio links, and structured project callouts.",
    bestFor: "Software engineers, data scientists, DevOps, product managers, and cloud architects.",
    atsNote: "Linear chronological flow optimized for tech keyword scrapers",
    category: "tech",
  },
  {
    id: "nordic-clean",
    name: "Nordic Clean",
    tagline: "Airy, modern Scandinavian clarity",
    description: "Spacious balanced typography with subtle stone dividers, refined letter-spacing, and maximum whitespace legibility.",
    bestFor: "Consulting, operations, healthcare, administration, and modern global remote roles.",
    atsNote: "Generous margin architecture with standard heading semantics",
    category: "minimal",
  },
  {
    id: "ivy-league",
    name: "Ivy League & Academic",
    tagline: "Traditional scholarship & prestige",
    description: "Classic serif typography with distinguished deep burgundy double rules, scholarly hierarchy, and formal credentials structure.",
    bestFor: "Legal counsel, medical practitioners, researchers, university faculty, and policy analysts.",
    atsNote: "Formal academic citation layout without multi-column tables",
    category: "academic",
  },
  {
    id: "compact-hybrid",
    name: "Compact 1-Page Maximum",
    tagline: "Ultra-efficient high-density layout",
    description: "Space-saving single-line headers and compact bullet density designed to fit rich experience into 1 or 2 tight pages.",
    bestFor: "Experienced professionals who want maximum content density without spilling onto extra pages.",
    atsNote: "High-density single-column format that parses cleanly",
    category: "executive",
  },
  {
    id: "international-banking",
    name: "International Banking",
    tagline: "Wall Street & financial services standard",
    description: "Authoritative deep navy and bronze styling, formal centered header with bullet separators, and metrics-first accomplishment bullets.",
    bestFor: "Investment banking, private equity, accounting, corporate finance, and audit professionals.",
    atsNote: "Strict Wall Street format trusted by bulge-bracket recruiters",
    category: "finance",
  },
];

export const FONT_METADATA: {
  id: CvEditorSettings["fontFamily"];
  name: string;
  category: "Sans-Serif" | "Serif";
  cssFont: string;
  description: string;
  atsScore: string;
}[] = [
  {
    id: "calibri",
    name: "Calibri",
    category: "Sans-Serif",
    cssFont: "Calibri, 'Segoe UI', Arial, sans-serif",
    description: "Modern Microsoft standard with warm rounded curves. Ideal default for ATS systems.",
    atsScore: "100% ATS Friendly",
  },
  {
    id: "times",
    name: "Times New Roman",
    category: "Serif",
    cssFont: "'Times New Roman', Times, Georgia, serif",
    description: "Classic newspaper & academic font. Formal, authoritative and universally recognized.",
    atsScore: "99% ATS Friendly",
  },
  {
    id: "arial",
    name: "Arial",
    category: "Sans-Serif",
    cssFont: "Arial, Helvetica, sans-serif",
    description: "Universal clean grotesque sans-serif. Highly legible across all screens and print.",
    atsScore: "100% ATS Friendly",
  },
  {
    id: "georgia",
    name: "Georgia",
    category: "Serif",
    cssFont: "Georgia, 'Times New Roman', serif",
    description: "Designed specifically for screen and print readability. Elegant letterforms with tall x-height.",
    atsScore: "98% ATS Friendly",
  },
  {
    id: "garamond",
    name: "Garamond",
    category: "Serif",
    cssFont: "Garamond, 'EB Garamond', Georgia, serif",
    description: "Refined, timeless book serif. Compact and graceful, perfect for executive and legal CVs.",
    atsScore: "98% ATS Friendly",
  },
  {
    id: "trebuchet",
    name: "Trebuchet MS",
    category: "Sans-Serif",
    cssFont: "'Trebuchet MS', 'Lucida Grande', sans-serif",
    description: "Open humanist sans-serif with personality. Crisp, modern and very easy on the eyes.",
    atsScore: "98% ATS Friendly",
  },
  {
    id: "verdana",
    name: "Verdana",
    category: "Sans-Serif",
    cssFont: "Verdana, Geneva, sans-serif",
    description: "Wide letter spacing and generous aperture designed for maximum legibility.",
    atsScore: "99% ATS Friendly",
  },
  {
    id: "cambria",
    name: "Cambria",
    category: "Serif",
    cssFont: "Cambria, Georgia, serif",
    description: "Robust, sturdy serif with even proportions. Built for business reports and formal documents.",
    atsScore: "99% ATS Friendly",
  },
];

export const SAMPLE_SHOWCASE_CV: StructuredCvContent = {
  personalInfo: {
    fullName: "Adaeze Chidinma Okafor",
    professionalTitle: "Operations & Customer Experience Coordinator",
    email: "adaeze.okafor@example.com",
    phone: "+234 803 000 0142",
    city: "Lagos",
    country: "Nigeria",
    linkedinUrl: "linkedin.com/in/adaeze-okafor",
    portfolioUrl: "",
    websiteUrl: "",
  },
  summary:
    "Detail-oriented operations and customer experience coordinator with experience managing daily service workflows, resolving client enquiries, and maintaining accurate administrative records. Skilled in Excel reporting, cross-team coordination, and structured process documentation.",
  hasFormalExperience: true,
  experience: [
    {
      id: "exp-1",
      jobTitle: "Customer Operations Associate",
      company: "Kora Commerce Ltd",
      location: "Lagos, Nigeria",
      employmentType: "Full-time",
      startDate: "Jan 2024",
      endDate: "Present",
      isCurrent: true,
      responsibilities:
        "Coordinate order tracking, handle client enquiries across email and telephone, and maintain weekly reconciliation logs.",
      achievements: [
        "Responded to customer enquiries, provided accurate service updates, and documented recurring issues for the operations lead.",
        "Maintained daily dispatch and inventory spreadsheets across three fulfillment zones.",
      ],
    },
    {
      id: "exp-2",
      jobTitle: "NYSC Administrative Assistant",
      company: "Ministry of Commerce & Industry",
      location: "Abuja, Nigeria",
      employmentType: "NYSC",
      startDate: "Nov 2022",
      endDate: "Oct 2023",
      isCurrent: false,
      responsibilities:
        "Supported departmental correspondence, filing, and stakeholder meeting preparation.",
      achievements: [
        "Organized digital archive of correspondence folders and prepared weekly briefing minutes.",
      ],
    },
  ],
  alternativeExperience: [],
  education: [
    {
      id: "edu-1",
      institution: "University of Nigeria, Nsukka",
      qualification: "BSc",
      fieldOfStudy: "Business Administration",
      startDate: "2018",
      endDate: "2022",
      isCurrent: false,
      achievements: "Second Class Honours (Upper Division)",
    },
  ],
  skills: [
    { id: "sk-1", name: "Microsoft Excel", category: "digital" },
    { id: "sk-2", name: "Client Relations", category: "communication" },
    { id: "sk-3", name: "Operations Coordination", category: "administrative" },
    { id: "sk-4", name: "Record Keeping", category: "administrative" },
    { id: "sk-5", name: "Written Communication", category: "communication" },
    { id: "sk-6", name: "English", category: "languages" },
  ],
  certifications: [
    {
      id: "cert-1",
      name: "Google Project Management Foundations",
      issuingOrganization: "Coursera",
      issueDate: "2024",
      expiryDate: "",
      credentialUrl: "",
    },
  ],
  projects: [],
  additional: {
    memberships: [],
    publications: [],
    awards: [],
    volunteerSummary: "",
    languages: ["English (Fluent)", "Igbo (Native)"],
    interests: [],
    references: [],
    omitReferences: true,
  },
};

