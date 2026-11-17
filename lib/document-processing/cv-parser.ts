import { createId } from "@/lib/utils";
import { createEmptyStructuredCv } from "@/lib/cv/defaults";
import type {
  CertificationItem,
  EducationItem,
  ProjectItem,
  SkillItem,
  StructuredCvContent,
  WorkExperienceItem,
} from "@/types/cv";

type SectionHeadingKey =
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "languages"
  | "references"
  | "awards";

const HEADING_PATTERNS: { key: SectionHeadingKey; regex: RegExp }[] = [
  { key: "summary", regex: /^(professional\s+summary|summary|profile|career\s+objective|objective|about\s+me)$/i },
  { key: "experience", regex: /^(work\s+experience|professional\s+experience|experience|employment\s+history|career\s+history)$/i },
  { key: "education", regex: /^(education|academic\s+background|qualifications|academic\s+qualifications)$/i },
  { key: "skills", regex: /^(skills|core\s+competencies|technical\s+skills|key\s+skills|competencies)$/i },
  { key: "projects", regex: /^(projects|key\s+projects|academic\s+projects|personal\s+projects)$/i },
  { key: "certifications", regex: /^(certifications|licenses|certificates|professional\s+certifications|training)$/i },
  { key: "languages", regex: /^(languages)$/i },
  { key: "awards", regex: /^(awards|honours|honors|achievements)$/i },
  { key: "references", regex: /^(references|referees)$/i },
];

function matchHeading(line: string): SectionHeadingKey | null {
  const cleaned = line.replace(/[:\-–—_•|]+$/g, "").trim();
  if (cleaned.length < 3 || cleaned.length > 48) return null;
  for (const h of HEADING_PATTERNS) {
    if (h.regex.test(cleaned)) return h.key;
  }
  return null;
}

/**
 * Deterministic structured parser that converts extracted CV raw text into
 * Vitra's StructuredCvContent without inventing or silently discarding data.
 */
export function parseRawTextToStructuredCv(rawText: string): {
  structured: StructuredCvContent;
  uncertainFields: string[];
} {
  const cv = createEmptyStructuredCv("Nigeria");
  const uncertainFields: string[] = [];

  const lines = rawText
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    uncertainFields.push("No readable text lines detected in the uploaded document.");
    return { structured: cv, uncertainFields };
  }

  // Extract Email, Phone, LinkedIn, Portfolio from top / whole text
  const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    cv.personalInfo.email = emailMatch[0];
  } else {
    uncertainFields.push("Email address could not be automatically detected.");
  }

  const phoneMatch = rawText.match(/(\+?\d{1,3}[\s\-()]*)?(\(?\d{3,4}\)?[\s\-()]*){2,3}\d{3,4}/);
  if (phoneMatch) {
    const candidate = phoneMatch[0].trim();
    if (candidate.replace(/\D/g, "").length >= 7) {
      cv.personalInfo.phone = candidate;
    }
  } else {
    uncertainFields.push("Telephone number could not be automatically detected.");
  }

  const linkedinMatch = rawText.match(/(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  if (linkedinMatch) {
    cv.personalInfo.linkedinUrl = linkedinMatch[0];
  }

  // Heuristic for Name: usually first non-contact line before first heading
  const firstHeadingIdx = lines.findIndex((l) => matchHeading(l) !== null);
  const headerLines = lines.slice(0, firstHeadingIdx === -1 ? Math.min(6, lines.length) : firstHeadingIdx);

  for (const line of headerLines) {
    if (
      !cv.personalInfo.fullName &&
      !line.includes("@") &&
      !/\d{5,}/.test(line) &&
      !/linkedin\.com/i.test(line) &&
      line.split(/\s+/).length >= 2 &&
      line.split(/\s+/).length <= 5
    ) {
      cv.personalInfo.fullName = line.replace(/[|•]/g, "").trim();
      continue;
    }

    if (
      cv.personalInfo.fullName &&
      !cv.personalInfo.professionalTitle &&
      !line.includes("@") &&
      !/\d{5,}/.test(line) &&
      !/linkedin\.com/i.test(line) &&
      line.length <= 80 &&
      !/lagos|abuja|nigeria|london|uk|usa|port harcourt|ibadan|kano/i.test(line)
    ) {
      cv.personalInfo.professionalTitle = line;
    }

    const locationMatch = line.match(
      /(Lagos|Abuja|Port Harcourt|Ibadan|Kano|Enugu|Benin City|London|Manchester|Toronto|New York)[,\s]+(Nigeria|UK|United Kingdom|USA|United States|Canada)?/i
    );
    if (locationMatch) {
      cv.personalInfo.city = locationMatch[1];
      if (locationMatch[2]) cv.personalInfo.country = locationMatch[2];
    }
  }

  if (!cv.personalInfo.fullName) {
    uncertainFields.push("Full name could not be reliably identified.");
  }

  // Group lines into sections
  const sections: Record<SectionHeadingKey, string[]> = {
    summary: [],
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
    references: [],
    awards: [],
  };

  let activeSection: SectionHeadingKey | null = null;
  for (const line of lines) {
    const heading = matchHeading(line);
    if (heading) {
      activeSection = heading;
      continue;
    }
    if (activeSection) {
      sections[activeSection].push(line);
    }
  }

  // Summary
  if (sections.summary.length > 0) {
    cv.summary = sections.summary.join(" ");
  }

  // Skills
  if (sections.skills.length > 0) {
    const rawSkills = sections.skills
      .join(", ")
      .split(/[,|•·;\n]+/)
      .map((s) => s.replace(/^[-–*]\s*/, "").trim())
      .filter((s) => s.length >= 2 && s.length <= 60);

    const uniqueSkills = Array.from(new Set(rawSkills));
    cv.skills = uniqueSkills.map(
      (name): SkillItem => ({
        id: createId(),
        name,
        category: "technical",
      })
    );
  }

  // Languages
  if (sections.languages.length > 0) {
    cv.additional.languages = sections.languages
      .join(", ")
      .split(/[,|•;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  // Awards
  if (sections.awards.length > 0) {
    cv.additional.awards = sections.awards;
  }

  // Education
  if (sections.education.length > 0) {
    const eduItems: EducationItem[] = [];
    let currentEdu: EducationItem | null = null;
    const dateRangeRegex = /(\b(19|20)\d{2}\b|\bPresent\b)/i;

    for (const line of sections.education) {
      const looksLikeDegree =
        /\b(B\.?Sc|B\.?A|B\.?Eng|M\.?Sc|M\.?B\.?A|Ph\.?D|HND|ND|SSCE|Bachelor|Master|Diploma|University|Polytechnic|College)\b/i.test(
          line
        );
      if (looksLikeDegree || !currentEdu) {
        if (currentEdu) eduItems.push(currentEdu);
        const dates = line.match(/(19|20)\d{2}/g) || [];
        currentEdu = {
          id: createId(),
          institution: line,
          qualification: "",
          fieldOfStudy: "",
          startDate: dates[0] || "",
          endDate: dates[1] || (/\bpresent\b/i.test(line) ? "Present" : ""),
          isCurrent: /\bpresent\b/i.test(line),
          achievements: "",
        };
      } else {
        if (!currentEdu.qualification && /\b(BSc|BA|BEng|MSc|MBA|HND|ND|SSCE)\b/i.test(line)) {
          currentEdu.qualification = line;
        } else if (!currentEdu.startDate && dateRangeRegex.test(line)) {
          const dates = line.match(/(19|20)\d{2}/g) || [];
          currentEdu.startDate = dates[0] || "";
          currentEdu.endDate = dates[1] || "";
        } else {
          currentEdu.achievements = [currentEdu.achievements, line].filter(Boolean).join(" ");
        }
      }
    }
    if (currentEdu) eduItems.push(currentEdu);
    cv.education = eduItems;
  }

  // Work experience
  if (sections.experience.length > 0) {
    const expItems: WorkExperienceItem[] = [];
    let currentExp: WorkExperienceItem | null = null;

    for (const line of sections.experience) {
      const isBullet = /^[•\-–*]/.test(line);
      const hasDate = /((19|20)\d{2}|present|current)/i.test(line);
      if (!isBullet && (hasDate || line.includes("|") || line.includes("—") || !currentExp)) {
        if (currentExp) expItems.push(currentExp);
        const dates = line.match(/((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+)?(19|20)\d{2}/gi) || [];
        const isCurrent = /\bpresent\b|\bcurrent\b/i.test(line);
        const parts = line.split(/[|—–-]/).map((p) => p.trim()).filter(Boolean);
        currentExp = {
          id: createId(),
          jobTitle: parts[0] || line,
          company: parts[1] && !/\d{4}/.test(parts[1]) ? parts[1] : "",
          location: "",
          employmentType: "Full-time",
          startDate: dates[0] || "",
          endDate: isCurrent ? "Present" : dates[1] || "",
          isCurrent,
          responsibilities: "",
          achievements: [],
        };
      } else if (currentExp) {
        const cleanBullet = line.replace(/^[•\-–*]\s*/, "").trim();
        if (isBullet) {
          currentExp.achievements.push(cleanBullet);
        } else if (!currentExp.company && line.length < 70 && !hasDate) {
          currentExp.company = line;
        } else {
          currentExp.responsibilities = [currentExp.responsibilities, cleanBullet]
            .filter(Boolean)
            .join(" ");
        }
      }
    }
    if (currentExp) expItems.push(currentExp);
    cv.experience = expItems;
    cv.hasFormalExperience = expItems.length > 0;
  }

  // Certifications
  if (sections.certifications.length > 0) {
    cv.certifications = sections.certifications.map(
      (line): CertificationItem => ({
        id: createId(),
        name: line.replace(/^[•\-–*]\s*/, "").trim(),
        issuingOrganization: "",
        issueDate: (line.match(/(19|20)\d{2}/) || [""])[0],
        expiryDate: "",
        credentialUrl: "",
      })
    );
  }

  // Projects
  if (sections.projects.length > 0) {
    cv.projects = sections.projects.map(
      (line): ProjectItem => ({
        id: createId(),
        title: line.replace(/^[•\-–*]\s*/, "").slice(0, 100),
        role: "",
        description: line.replace(/^[•\-–*]\s*/, ""),
        technologies: [],
        outcome: "",
        projectUrl: "",
      })
    );
  }

  if (cv.experience.length === 0 && cv.education.length === 0) {
    uncertainFields.push(
      "Could not automatically separate Work Experience and Education sections. Please review and organize them below."
    );
  }

  return { structured: cv, uncertainFields };
}

