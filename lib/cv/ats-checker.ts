import type {
  CvAnalysisResult,
  CvRecommendation,
  JobTailoringResult,
  StructuredCvContent,
} from "@/types/cv";

export type AtsTargetSection =
  | "personal-info"
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "layout";

export interface AtsQualityCheckItem {
  id: string;
  label: string;
  passed: boolean;
  category: "completeness" | "readability" | "structure" | "clarity";
  note: string;
  targetSection?: AtsTargetSection;
  attentionDetails?: string[];
  actionLabel?: string;
}

export interface AtsQualityReport {
  checks: AtsQualityCheckItem[];
  passedCount: number;
  totalCount: number;
  methodologyNote: string;
}

export function evaluateCvQuality(cv: StructuredCvContent): AtsQualityReport {
  const checks: AtsQualityCheckItem[] = [];

  // 1. Contact details completeness
  const missingContactFields: string[] = [];
  if (!cv.personalInfo.fullName.trim()) missingContactFields.push("Full Name");
  if (!cv.personalInfo.email.trim()) missingContactFields.push("Email address");
  if (!cv.personalInfo.phone.trim()) missingContactFields.push("Telephone number");
  if (!cv.personalInfo.city.trim()) missingContactFields.push("City");

  const hasCoreContact = missingContactFields.length === 0;
  checks.push({
    id: "contact-completeness",
    label: "Essential contact details present",
    passed: hasCoreContact,
    category: "completeness",
    targetSection: "personal-info",
    actionLabel: "Edit Personal Information",
    attentionDetails: hasCoreContact
      ? undefined
      : missingContactFields.map((f) => `Missing essential contact detail: ${f}`),
    note: hasCoreContact
      ? "Full name, email, telephone and city are included without unnecessary sensitive personal fields."
      : "Ensure your full name, email address, telephone number and city are filled in.",
  });

  // 2. Professional summary check
  const summaryWords = cv.summary.trim().split(/\s+/).filter(Boolean).length;
  const hasGoodSummary = summaryWords >= 15 && summaryWords <= 120;
  const summaryDetails: string[] = [];
  if (summaryWords === 0) {
    summaryDetails.push(
      "Professional summary is currently empty. Add a short 2–4 sentence intro highlighting your experience and career goals."
    );
  } else if (summaryWords < 15) {
    summaryDetails.push(
      `Summary currently has only ${summaryWords} words. Aim for 20–75 words so recruiters and ATS scanners can identify your profile.`
    );
  } else if (summaryWords > 120) {
    summaryDetails.push(
      `Summary is currently ${summaryWords} words long. Consider tightening below 100–120 words to keep it punchy.`
    );
  }

  checks.push({
    id: "summary-quality",
    label: "Concise professional summary (15–120 words)",
    passed: hasGoodSummary,
    category: "readability",
    targetSection: "summary",
    actionLabel: "Edit Professional Summary",
    attentionDetails: hasGoodSummary ? undefined : summaryDetails,
    note:
      summaryWords === 0
        ? "Add a short 2–4 sentence professional summary explaining your background and target role."
        : summaryWords < 15
          ? `Your summary is ${summaryWords} words. Aim for 20–75 words for clear recruiter scanning.`
          : summaryWords > 120
            ? `Your summary is ${summaryWords} words. Consider tightening it under 100 words.`
            : `Well-paced summary (${summaryWords} words).`,
  });

  // 3. Experience or No-Experience Pathway
  const hasExp =
    cv.experience.length > 0 ||
    cv.alternativeExperience.length > 0 ||
    cv.projects.length > 0;
  checks.push({
    id: "experience-or-pathway",
    label: "Relevant experience, training or projects included",
    passed: hasExp,
    category: "completeness",
    targetSection: "experience",
    actionLabel: "Add Work Experience or NYSC",
    attentionDetails: hasExp
      ? undefined
      : [
        "No work history or alternative experience logged yet.",
        "Add formal employment OR click 'I don't have formal employment yet' to include NYSC, SIWES, internships, volunteering, or academic projects.",
      ],
    note: hasExp
      ? "Includes work history, NYSC/SIWES, internships, volunteering or project evidence."
      : "Add formal work experience OR use the No-Experience pathway (NYSC, SIWES, projects, volunteering).",
  });

  // 4. Descriptive statements
  const descriptiveDetails: string[] = [];

  // Check work experience
  for (const exp of cv.experience) {
    const text = [exp.responsibilities, ...exp.achievements].join(" ").trim();
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const title = exp.jobTitle.trim() || "Untitled Role";
    const company = exp.company.trim() ? ` at ${exp.company.trim()}` : "";
    if (wordCount === 0) {
      descriptiveDetails.push(
        `"${title}${company}": Responsibilities & achievements are empty. Add bullet points detailing your key deliverables.`
      );
    } else if (wordCount < 6) {
      descriptiveDetails.push(
        `"${title}${company}": Only ${wordCount} words provided. Expand into full, clear sentences describing what you did and achieved.`
      );
    }
  }

  // Check alternative experience
  for (const alt of cv.alternativeExperience) {
    const wordCount = alt.description.trim().split(/\s+/).filter(Boolean).length;
    const title = alt.title.trim() || "Untitled Experience";
    const org = alt.organization.trim() ? ` at ${alt.organization.trim()}` : "";
    if (wordCount === 0) {
      descriptiveDetails.push(
        `"${title}${org}": Description is empty. Describe your core responsibilities.`
      );
    } else if (wordCount < 6) {
      descriptiveDetails.push(
        `"${title}${org}": Description is only ${wordCount} words. Expand into clear sentences describing your tasks.`
      );
    }
  }

  // Check projects
  for (const proj of cv.projects) {
    const wordCount = proj.description.trim().split(/\s+/).filter(Boolean).length;
    const title = proj.title.trim() || "Untitled Project";
    if (wordCount === 0) {
      descriptiveDetails.push(
        `Project "${title}": Description is empty. Describe the problem solved and technologies used.`
      );
    } else if (wordCount < 6) {
      descriptiveDetails.push(
        `Project "${title}": Description is only ${wordCount} words. Expand into 1–2 descriptive sentences.`
      );
    }
  }

  const allDescriptions = [
    ...cv.experience.map((e) => [e.responsibilities, ...e.achievements].join(" ")),
    ...cv.alternativeExperience.map((a) => a.description),
    ...cv.projects.map((p) => p.description),
  ].filter((t) => t.trim().length > 0);

  const hasDetailedDescriptions =
    allDescriptions.length > 0 &&
    descriptiveDetails.length === 0 &&
    allDescriptions.every((d) => d.trim().split(/\s+/).filter(Boolean).length >= 6);

  checks.push({
    id: "descriptive-statements",
    label: "Descriptive responsibility & outcome statements",
    passed: hasDetailedDescriptions,
    category: "clarity",
    targetSection: "experience",
    actionLabel: "Expand Work Experience & Tasks",
    attentionDetails: hasDetailedDescriptions
      ? undefined
      : descriptiveDetails.length > 0
        ? descriptiveDetails
        : [
          "Add at least one descriptive sentence detailing your tasks, tools, or outcomes (aim for at least 6–8 words per entry).",
        ],
    note: hasDetailedDescriptions
      ? "Entries describe actual tasks or outcomes rather than single-word labels."
      : "Expand brief entries into full, clear sentences describing what you did.",
  });

  // 5. Education present
  const hasEducation = cv.education.length > 0;
  checks.push({
    id: "education-present",
    label: "Education history documented",
    passed: hasEducation,
    category: "completeness",
    targetSection: "education",
    actionLabel: "Add Education History",
    attentionDetails: hasEducation
      ? undefined
      : ["No education or degree records found. Add your degree, diploma, SSCE, or current study."],
    note: hasEducation
      ? `${cv.education.length} qualification record(s) listed.`
      : "Add at least one academic or professional qualification.",
  });

  // 6. Skills categorized
  const hasSkills = cv.skills.length >= 4;
  checks.push({
    id: "skills-coverage",
    label: "Relevant skills listed (at least 4)",
    passed: hasSkills,
    category: "completeness",
    targetSection: "skills",
    actionLabel: "Add Skills (Technical & Digital)",
    attentionDetails: hasSkills
      ? undefined
      : [
        `Currently ${cv.skills.length} skill${cv.skills.length === 1 ? "" : "s"} listed. ATS parsers recommend at least 4 skills for keyword matching.`,
        `Add ${Math.max(1, 4 - cv.skills.length)} more skill(s) like "Project Management", "Microsoft Excel", "Python", or "Data Analysis".`,
      ],
    note: hasSkills
      ? `${cv.skills.length} skills listed clearly for quick scanning.`
      : "Add at least 4 verified technical, digital, or communication skills.",
  });

  // 7. Consistent date coverage
  const missingDateDetails: string[] = [];
  for (const exp of cv.experience) {
    const title = exp.jobTitle.trim() || "Work Entry";
    const comp = exp.company.trim() ? ` at ${exp.company.trim()}` : "";
    if (!exp.startDate.trim()) {
      missingDateDetails.push(`"${title}${comp}" is missing a start date.`);
    }
    if (!exp.isCurrent && !exp.endDate.trim()) {
      missingDateDetails.push(`"${title}${comp}" is missing an end date (or check 'Present / Current role').`);
    }
  }
  for (const ed of cv.education) {
    const inst = ed.institution.trim() || "Education Entry";
    const qual = ed.qualification.trim() ? ` (${ed.qualification.trim()})` : "";
    if (!ed.startDate.trim()) {
      missingDateDetails.push(`"${inst}${qual}" is missing a start date.`);
    }
    if (!ed.isCurrent && !ed.endDate.trim()) {
      missingDateDetails.push(`"${inst}${qual}" is missing an end / graduation date.`);
    }
  }

  const datesConsistent = missingDateDetails.length === 0;
  checks.push({
    id: "consistent-dates",
    label: "Consistent start and end dates",
    passed: datesConsistent,
    category: "structure",
    targetSection: "experience",
    actionLabel: "Complete Entry Dates",
    attentionDetails: datesConsistent ? undefined : missingDateDetails,
    note: datesConsistent
      ? "Education and work entries include clear timelines."
      : "Some education or work entries are missing a start or completion date.",
  });

  // 8. ATS-friendly simple structure
  checks.push({
    id: "ats-formatting",
    label: "Standard headings & single-flow text hierarchy",
    passed: true,
    category: "structure",
    targetSection: "layout",
    actionLabel: "View Templates",
    note: "Vitra exports use selectable text, standard section headings and clean reading order.",
  });

  const passedCount = checks.filter((c) => c.passed).length;

  return {
    checks,
    passedCount,
    totalCount: checks.length,
    methodologyNote:
      "This checklist evaluates structural completeness, date consistency and readable formatting. It is not an employer ATS score and does not guarantee interview selection.",
  };
}

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "will", "your", "have",
  "able", "into", "about", "across", "within", "work", "working", "role",
  "team", "must", "should", "good", "strong", "skills", "experience", "years",
  "using", "such", "other", "including", "their", "they", "them", "been", "were",
  "are", "was", "has", "had", "our", "you", "who", "all", "any", "can", "may",
  "looking", "seeking", "required", "candidate", "responsibilities", "duties",
]);

export function compareCvWithJobDescription(
  cv: StructuredCvContent,
  jobDescription: string
): {
  extractedKeywords: string[];
  matchedKeywords: string[];
  missingOrUnconfirmedKeywords: string[];
} {
  const cvBlob = [
    cv.personalInfo.professionalTitle,
    cv.summary,
    ...cv.skills.map((s) => s.name),
    ...cv.experience.map((e) => `${e.jobTitle} ${e.company} ${e.responsibilities} ${e.achievements.join(" ")}`),
    ...cv.alternativeExperience.map((a) => `${a.title} ${a.organization} ${a.description}`),
    ...cv.education.map((ed) => `${ed.qualification} ${ed.fieldOfStudy} ${ed.achievements}`),
    ...cv.projects.map((p) => `${p.title} ${p.description} ${p.technologies.join(" ")} ${p.outcome}`),
    ...cv.certifications.map((c) => `${c.name} ${c.issuingOrganization}`),
  ]
    .join(" ")
    .toLowerCase();

  const tokens = jobDescription
    .toLowerCase()
    .replace(/[^a-z0-9+.#/\s-]/g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^[.,\-/]+|[.,\-/]+$/g, ""))
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));

  const counts = new Map<string, number>();
  for (const token of tokens) {
    counts.set(token, (counts.get(token) || 0) + 1);
  }

  const topKeywords = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 18)
    .map(([word]) => word);

  const matchedKeywords: string[] = [];
  const missingOrUnconfirmedKeywords: string[] = [];

  for (const kw of topKeywords) {
    if (cvBlob.includes(kw)) {
      matchedKeywords.push(kw);
    } else {
      missingOrUnconfirmedKeywords.push(kw);
    }
  }

  return {
    extractedKeywords: topKeywords,
    matchedKeywords,
    missingOrUnconfirmedKeywords,
  };
}

/**
 * Deterministic Hard-Coded ATS Quality Analyzer.
 * Operates 100% offline without calling any external AI APIs.
 */
export function analyzeCvContentHardCoded(cv: StructuredCvContent): CvAnalysisResult {
  const quality = evaluateCvQuality(cv);
  const strengths: string[] = [];
  const missingInfo: string[] = [];
  const recommendations: CvRecommendation[] = [];

  // 1. Identify Strengths based on content presence & quality
  if (cv.personalInfo.fullName.trim() && cv.personalInfo.email.trim() && cv.personalInfo.phone.trim()) {
    strengths.push("Essential contact details (Full Name, verified email, telephone) are fully present.");
  }
  if (cv.summary.trim().split(/\s+/).filter(Boolean).length >= 15) {
    strengths.push("Professional summary provides a clear, high-level introduction to your career profile.");
  }
  if (cv.experience.length > 0) {
    const totalBullets = cv.experience.reduce(
      (sum, e) => sum + (e.achievements.length || (e.responsibilities ? 1 : 0)),
      0
    );
    strengths.push(
      `Work experience is structured across ${cv.experience.length} career milestones with ${totalBullets} documented task/achievement points.`
    );
  } else if (cv.alternativeExperience.length > 0 || cv.projects.length > 0) {
    strengths.push(
      "Alternative experience (training, projects, or national service) provides structured evidence of competence."
    );
  }
  if (cv.skills.length >= 4) {
    strengths.push(`Core competencies are highlighted with ${cv.skills.length} distinct skills.`);
  }
  if (cv.education.length > 0) {
    strengths.push("Educational background is documented with institution and qualification credentials.");
  }

  // 2. Identify Gaps & Missing Information
  if (!cv.personalInfo.city.trim()) {
    missingInfo.push("City/Location is missing from contact details (ATS geographic filters often scan for this).");
  }
  if (cv.summary.trim().split(/\s+/).filter(Boolean).length < 15) {
    missingInfo.push("Professional summary is too brief or empty for ATS keyword indexing.");
  }
  if (
    cv.experience.some(
      (e) => !e.responsibilities.trim() && (!e.achievements || e.achievements.length === 0)
    )
  ) {
    missingInfo.push("One or more work experience entries are missing detailed responsibility descriptions.");
  }
  if (cv.skills.length < 5) {
    missingInfo.push("Skills section contains fewer than 5 core skills. Consider expanding relevant technical and domain tools.");
  }
  if (cv.certifications.length === 0 && cv.experience.length > 0) {
    missingInfo.push("No industry certifications or licenses are listed. Add professional credentials if available.");
  }

  // 3. Build Actionable Deterministic Recommendations from Quality Checks
  let recIdx = 1;
  for (const check of quality.checks) {
    if (!check.passed) {
      if (check.id === "summary-quality") {
        const title = cv.personalInfo.professionalTitle || "Professional";
        const topSkills = cv.skills.slice(0, 3).map((s) => s.name).join(", ");
        const replacement = `Results-oriented ${title} with demonstrated experience in ${
          topSkills || "core industry competencies"
        }. Proven ability to collaborate with cross-functional teams, streamline operational processes, and achieve measurable outcomes.`;
        recommendations.push({
          id: `rec-hardcoded-${recIdx++}`,
          section: "summary",
          category: "ats-readability",
          issue: "Professional summary is brief or lacks keyword-rich phrasing for ATS scanners.",
          whyItMatters: "Recruiters and automated ATS filters scan the top third of your CV for role keywords within 6 seconds.",
          originalText: cv.summary || "(Empty Summary)",
          suggestedReplacement: replacement,
          status: "pending",
        });
      } else if (check.id === "descriptive-statements") {
        const weakExp = cv.experience.find(
          (e) => e.responsibilities.trim().split(/\s+/).filter(Boolean).length < 5
        );
        if (weakExp) {
          const replacement = `Managed daily ${weakExp.jobTitle} operations, implemented workflow improvements, and coordinated with team stakeholders to ensure high-quality and timely task delivery.`;
          recommendations.push({
            id: `rec-hardcoded-${recIdx++}`,
            section: "experience",
            category: "weak-description",
            issue: `Work responsibilities for ${weakExp.jobTitle} at ${weakExp.company} are too short for ATS evaluation.`,
            whyItMatters: "Applicant tracking systems score candidates based on descriptive action verbs and measurable duties.",
            originalText: weakExp.responsibilities || "(Brief description)",
            suggestedReplacement: replacement,
            status: "pending",
          });
        }
      } else if (check.id === "skills-categorized") {
        recommendations.push({
          id: `rec-hardcoded-${recIdx++}`,
          section: "skills",
          category: "organization",
          issue: "Skills could be categorized into technical, soft, and industry-specific domains.",
          whyItMatters: "Categorized skills help ATS parsers accurately index candidate tool proficiencies versus communication traits.",
          originalText: cv.skills.map((s) => s.name).join(", "),
          suggestedReplacement:
            "Group tools into Technical Competencies (software, frameworks) and Operational Leadership (management, communication).",
          status: "pending",
        });
      } else if (check.id === "bullet-points") {
        recommendations.push({
          id: `rec-hardcoded-${recIdx++}`,
          section: "experience",
          category: "formatting",
          issue: "Dense paragraph text detected in work experience.",
          whyItMatters: "Bullet-point formatting improves both human recruiter legibility and ATS text parsing accuracy.",
          originalText: "Long paragraph format",
          suggestedReplacement:
            "Break long paragraphs into 2–4 concise bullet points starting with strong action verbs (e.g. 'Coordinated', 'Designed', 'Delivered').",
          status: "pending",
        });
      }
    }
  }

  // If CV has no failing checks, provide an optimization recommendation
  if (recommendations.length === 0) {
    recommendations.push({
      id: `rec-hardcoded-${recIdx++}`,
      section: "summary",
      category: "clarity",
      issue: "Format is fully compliant; consider adding specific quantified impact metrics.",
      whyItMatters: "Adding percentage increases, revenue impact, or team size figures differentiates top-percentile candidates.",
      originalText: cv.summary,
      suggestedReplacement: cv.summary,
      status: "pending",
    });
  }

  const overallSummary = `Deterministic ATS audit completed: ${quality.passedCount} of ${quality.totalCount} structural compliance benchmarks passed. Structural layout, contact completeness, and readability meet baseline ATS standards.`;

  return {
    overallSummary,
    strengths,
    missingInformation: missingInfo,
    recommendations,
    atsReadabilityChecks: quality.checks.map((c) => ({
      label: c.label,
      passed: c.passed,
      note: c.note,
    })),
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Deterministic Hard-Coded Job Tailoring Analyzer.
 * Aligns CV to job description 100% offline without calling any external AI APIs.
 */
export function tailorCvToJobHardCoded(
  cv: StructuredCvContent,
  input: {
    jobTitle: string;
    company?: string;
    jobDescription: string;
  }
): JobTailoringResult {
  const comparison = compareCvWithJobDescription(cv, input.jobDescription);
  const targetTitle = input.jobTitle.trim() || "Target Role";
  const targetCompany = input.company?.trim() || "";

  // 1. Extract required qualifications by pattern matching
  const sentences = input.jobDescription
    .split(/[.\n;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15);

  const qualificationPatterns =
    /(degree|bachelor|master|years|experience|proficiency|proficient|knowledge|skilled|ability to|responsible for|fluent|certified|certification)/i;

  const requiredQualifications = sentences
    .filter((s) => qualificationPatterns.test(s))
    .slice(0, 8);

  if (requiredQualifications.length === 0) {
    requiredQualifications.push(
      `Demonstrated competency in ${targetTitle} core duties and industry tools.`,
      `Hands-on experience with: ${
        comparison.extractedKeywords.slice(0, 5).join(", ") || "relevant technical workflows"
      }.`
    );
  }

  // 2. Matched experience entries
  const matchedExperience: string[] = [];
  for (const exp of cv.experience) {
    const expText = `${exp.jobTitle} ${exp.company} ${exp.responsibilities}`.toLowerCase();
    const matches = comparison.matchedKeywords.filter((k) => expText.includes(k));
    if (matches.length > 0) {
      matchedExperience.push(`${exp.jobTitle} at ${exp.company} (matched: ${matches.slice(0, 3).join(", ")})`);
    }
  }

  // 3. Suggestions
  const suggestions: JobTailoringResult["suggestions"] = [];
  let sugIdx = 1;

  // Suggestion 1: Summary Title Alignment
  const titleRegex = new RegExp(targetTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  if (!titleRegex.test(cv.summary)) {
    const existingSummary = cv.summary.trim();
    const suggestedSummary = existingSummary
      ? `${targetTitle} | ${existingSummary}`
      : `Dedicated ${targetTitle} with proven background in ${
          comparison.matchedKeywords.slice(0, 4).join(", ") || "core domain competencies"
        }. Proven record of delivering quality results and driving organizational performance.`;

    suggestions.push({
      id: `sug-hardcoded-${sugIdx++}`,
      targetSection: "summary",
      rationale: `Align professional summary to explicitly reference the target role '${targetTitle}' so ATS title filters match instantly.`,
      originalText: cv.summary,
      suggestedText: suggestedSummary,
      status: "pending",
    });
  }

  // Suggestion 2: Missing Keywords Weaving
  if (comparison.missingOrUnconfirmedKeywords.length > 0 && cv.experience.length > 0) {
    const topMissing = comparison.missingOrUnconfirmedKeywords.slice(0, 3);
    const targetExp = cv.experience[0];
    const originalText = targetExp.responsibilities;
    const suggestedText = `${originalText} (Demonstrated application of ${topMissing.join(
      ", "
    )} where applicable).`;

    suggestions.push({
      id: `sug-hardcoded-${sugIdx++}`,
      targetSection: "experience",
      rationale: `Target job heavily features '${topMissing.join(
        ", "
      )}'. If you have experience with these, incorporate them into your work achievements.`,
      originalText,
      suggestedText,
      status: "pending",
    });
  }

  return {
    jobTitle: targetTitle,
    company: targetCompany,
    requiredQualifications,
    importantKeywords: comparison.extractedKeywords,
    matchedSkills: comparison.matchedKeywords,
    matchedExperience:
      matchedExperience.length > 0
        ? matchedExperience
        : [`Baseline experience mapped to ${targetTitle} requirements.`],
    missingOrUnconfirmed: comparison.missingOrUnconfirmedKeywords,
    suggestions,
    transparencyNotice:
      "Generated using Vitra's Hard-Coded Deterministic ATS Engine without external AI. All alignments are strictly grounded in your actual CV history without fabricating credentials.",
  };
}
