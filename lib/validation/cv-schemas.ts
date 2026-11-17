import { z } from "zod";

export const careerProfileSchema = z.enum([
  "student",
  "recent-graduate",
  "first-time-job-seeker",
  "entry-level",
  "experienced-professional",
  "career-changer",
  "freelancer",
]);

export const templateIdSchema = z.enum([
  "classic-professional",
  "modern-minimal",
  "corporate-executive",
  "graduate-entry",
  "tech-innovator",
  "nordic-clean",
  "ivy-league",
  "compact-hybrid",
  "international-banking",
]);

export const sectionKeySchema = z.enum([
  "summary",
  "experience",
  "education",
  "skills",
  "projects",
  "certifications",
  "additional",
]);

const optionalUrlSchema = z
  .string()
  .trim()
  .max(300)
  .refine(
    (val) => !val || /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(val),
    { message: "Please enter a valid web address (e.g. linkedin.com/in/yourname)" }
  );

export const phoneSchema = z
  .string()
  .trim()
  .min(7, "Please enter a valid telephone number")
  .max(25, "Telephone number is too long")
  .refine(
    (val) => /^\+?[\d\s\-()]{7,25}$/.test(val),
    { message: "Use digits and optional + country code (e.g. +234 803 123 4567)" }
  );

export const personalInfoSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(120),
  professionalTitle: z.string().trim().max(120).default(""),
  email: z.string().trim().email("Please enter a valid email address").max(160),
  phone: phoneSchema,
  city: z.string().trim().min(1, "City is required").max(80),
  country: z.string().trim().min(2, "Country is required").max(80),
  linkedinUrl: optionalUrlSchema.default(""),
  portfolioUrl: optionalUrlSchema.default(""),
  websiteUrl: optionalUrlSchema.default(""),
});

export const educationItemSchema = z.object({
  id: z.string().min(1),
  institution: z.string().trim().min(2, "Institution name is required").max(160),
  qualification: z.string().trim().min(1, "Qualification is required").max(120),
  fieldOfStudy: z.string().trim().max(140).default(""),
  startDate: z.string().trim().max(40).default(""),
  endDate: z.string().trim().max(40).default(""),
  isCurrent: z.boolean().default(false),
  achievements: z.string().trim().max(600).default(""),
});

export const workExperienceItemSchema = z.object({
  id: z.string().min(1),
  jobTitle: z.string().trim().min(2, "Job title is required").max(120),
  company: z.string().trim().min(1, "Company or organization is required").max(140),
  location: z.string().trim().max(100).default(""),
  employmentType: z.string().trim().max(60).default("Full-time"),
  startDate: z.string().trim().max(40).default(""),
  endDate: z.string().trim().max(40).default(""),
  isCurrent: z.boolean().default(false),
  responsibilities: z.string().trim().max(2500).default(""),
  achievements: z.array(z.string().trim().max(500)).default([]),
});

export const alternativeExperienceItemSchema = z.object({
  id: z.string().min(1),
  category: z.enum([
    "academic-project",
    "personal-project",
    "internship",
    "siwes",
    "nysc",
    "volunteering",
    "leadership",
    "freelance",
    "practical-training",
    "extracurricular",
  ]),
  title: z.string().trim().min(2, "Role or project title is required").max(140),
  organization: z.string().trim().max(140).default(""),
  location: z.string().trim().max(100).default(""),
  startDate: z.string().trim().max(40).default(""),
  endDate: z.string().trim().max(40).default(""),
  isCurrent: z.boolean().default(false),
  description: z.string().trim().max(1500).default(""),
});

export const skillItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(80),
  category: z.enum([
    "technical",
    "digital",
    "communication",
    "leadership",
    "administrative",
    "industry",
    "languages",
  ]),
});

export const certificationItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2, "Certification name is required").max(160),
  issuingOrganization: z.string().trim().max(140).default(""),
  issueDate: z.string().trim().max(40).default(""),
  expiryDate: z.string().trim().max(40).default(""),
  credentialUrl: optionalUrlSchema.default(""),
});

export const projectItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(2, "Project title is required").max(160),
  role: z.string().trim().max(120).default(""),
  description: z.string().trim().max(1200).default(""),
  technologies: z.array(z.string().trim().max(60)).default([]),
  outcome: z.string().trim().max(600).default(""),
  projectUrl: optionalUrlSchema.default(""),
});

export const referenceItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2).max(120),
  role: z.string().trim().max(120).default(""),
  organization: z.string().trim().max(120).default(""),
  contact: z.string().trim().max(140).default(""),
});

export const structuredCvContentSchema = z.object({
  personalInfo: z.object({
    fullName: z.string().trim().max(120).default(""),
    professionalTitle: z.string().trim().max(120).default(""),
    email: z.string().trim().max(160).default(""),
    phone: z.string().trim().max(30).default(""),
    city: z.string().trim().max(80).default(""),
    country: z.string().trim().max(80).default("Nigeria"),
    linkedinUrl: z.string().trim().max(300).default(""),
    portfolioUrl: z.string().trim().max(300).default(""),
    websiteUrl: z.string().trim().max(300).default(""),
  }),
  summary: z.string().trim().max(2000).default(""),
  summaryContext: z
    .object({
      background: z.string().max(800).default(""),
      strengths: z.string().max(600).default(""),
      interests: z.string().max(500).default(""),
      relevantExperience: z.string().max(800).default(""),
      targetRole: z.string().max(200).default(""),
    })
    .optional(),
  hasFormalExperience: z.boolean().default(true),
  experience: z.array(workExperienceItemSchema).default([]),
  alternativeExperience: z.array(alternativeExperienceItemSchema).default([]),
  education: z.array(educationItemSchema).default([]),
  skills: z.array(skillItemSchema).default([]),
  certifications: z.array(certificationItemSchema).default([]),
  projects: z.array(projectItemSchema).default([]),
  additional: z.object({
    memberships: z.array(z.string().trim().max(200)).default([]),
    publications: z.array(z.string().trim().max(300)).default([]),
    awards: z.array(z.string().trim().max(200)).default([]),
    volunteerSummary: z.string().trim().max(1000).default(""),
    languages: z.array(z.string().trim().max(80)).default([]),
    interests: z.array(z.string().trim().max(80)).default([]),
    references: z.array(referenceItemSchema).default([]),
    omitReferences: z.boolean().default(true),
  }),
});

export const cvEditorSettingsSchema = z.object({
  fontSize: z.enum(["small", "medium", "large", "extra-large"]).default("medium"),
  spacing: z.enum(["compact", "normal", "relaxed"]).default("normal"),
  fontFamily: z
    .enum([
      "calibri",
      "times",
      "arial",
      "georgia",
      "garamond",
      "trebuchet",
      "verdana",
      "cambria",
    ])
    .default("calibri"),
  headingCase: z.enum(["uppercase", "titlecase"]).default("uppercase"),
  hiddenSections: z.array(sectionKeySchema).default([]),
  sectionOrder: z
    .array(sectionKeySchema)
    .default(["summary", "experience", "education", "skills", "projects", "certifications", "additional"]),
});

export const createCvRequestSchema = z.object({
  title: z.string().trim().min(1).max(120).default("Untitled CV"),
  careerProfile: careerProfileSchema.default("experienced-professional"),
  templateId: templateIdSchema.default("classic-professional"),
  structuredContent: structuredCvContentSchema.optional(),
  settings: cvEditorSettingsSchema.optional(),
  status: z.enum(["draft", "complete", "tailored"]).default("draft"),
  parentCvId: z.string().uuid().nullable().optional(),
});

export const updateCvRequestSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  careerProfile: careerProfileSchema.optional(),
  templateId: templateIdSchema.optional(),
  structuredContent: structuredCvContentSchema.optional(),
  settings: cvEditorSettingsSchema.optional(),
  status: z.enum(["draft", "complete", "tailored"]).optional(),
});

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, "Please enter your full name").max(120),
    email: z.string().trim().email("Please enter a valid email address").max(160),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(/[A-Za-z]/, "Password must contain at least one letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(1, "Please enter your password"),
});

