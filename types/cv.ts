export type CareerProfile =
  | 'student'
  | 'recent-graduate'
  | 'first-time-job-seeker'
  | 'entry-level'
  | 'experienced-professional'
  | 'career-changer'
  | 'freelancer';

export type TemplateId =
  | 'classic-professional'
  | 'modern-minimal'
  | 'corporate-executive'
  | 'graduate-entry'
  | 'tech-innovator'
  | 'nordic-clean'
  | 'ivy-league'
  | 'compact-hybrid'
  | 'international-banking';

export type CvStatus = 'draft' | 'complete' | 'tailored';

export type SectionKey =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'additional';

export interface PersonalInfo {
  fullName: string;
  professionalTitle: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  linkedinUrl: string;
  portfolioUrl: string;
  websiteUrl: string;
}

export interface EducationItem {
  id: string;
  institution: string;
  qualification: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  achievements: string;
}

export interface WorkExperienceItem {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  employmentType: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  responsibilities: string;
  achievements: string[];
}

export type NoExperienceCategory =
  | 'academic-project'
  | 'personal-project'
  | 'internship'
  | 'siwes'
  | 'nysc'
  | 'volunteering'
  | 'leadership'
  | 'freelance'
  | 'practical-training'
  | 'extracurricular';

export interface AlternativeExperienceItem {
  id: string;
  category: NoExperienceCategory;
  title: string;
  organization: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
}

export type SkillCategory =
  | 'technical'
  | 'digital'
  | 'communication'
  | 'leadership'
  | 'administrative'
  | 'industry'
  | 'languages';

export interface SkillItem {
  id: string;
  name: string;
  category: SkillCategory;
}

export interface CertificationItem {
  id: string;
  name: string;
  issuingOrganization: string;
  issueDate: string;
  expiryDate: string;
  credentialUrl: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  role: string;
  description: string;
  technologies: string[];
  outcome: string;
  projectUrl: string;
}

export interface ReferenceItem {
  id: string;
  name: string;
  role: string;
  organization: string;
  contact: string;
}

export interface AdditionalSections {
  memberships: string[];
  publications: string[];
  awards: string[];
  volunteerSummary: string;
  languages: string[];
  interests: string[];
  references: ReferenceItem[];
  omitReferences: boolean;
}

export interface StructuredCvContent {
  personalInfo: PersonalInfo;
  summary: string;
  summaryContext?: {
    background: string;
    strengths: string;
    interests: string;
    relevantExperience: string;
    targetRole: string;
  };
  hasFormalExperience: boolean;
  experience: WorkExperienceItem[];
  alternativeExperience: AlternativeExperienceItem[];
  education: EducationItem[];
  skills: SkillItem[];
  certifications: CertificationItem[];
  projects: ProjectItem[];
  additional: AdditionalSections;
}

export interface CvEditorSettings {
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  spacing: 'compact' | 'normal' | 'relaxed';
  fontFamily:
  | 'calibri'
  | 'times'
  | 'arial'
  | 'georgia'
  | 'garamond'
  | 'trebuchet'
  | 'verdana'
  | 'cambria';
  headingCase?: 'uppercase' | 'titlecase';
  hiddenSections: SectionKey[];
  sectionOrder: SectionKey[];
}

export interface CvRecord {
  id: string;
  userId: string;
  title: string;
  careerProfile: CareerProfile;
  templateId: TemplateId;
  structuredContent: StructuredCvContent;
  settings: CvEditorSettings;
  status: CvStatus;
  parentCvId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CvRecommendation {
  id: string;
  section: string;
  category:
  | 'grammar'
  | 'spelling'
  | 'clarity'
  | 'tone'
  | 'repetition'
  | 'weak-description'
  | 'missing-section'
  | 'formatting'
  | 'organization'
  | 'ats-readability';
  issue: string;
  whyItMatters: string;
  originalText: string;
  suggestedReplacement: string;
  status: 'pending' | 'accepted' | 'rejected' | 'edited';
  editedText?: string;
}

export interface CvAnalysisResult {
  overallSummary: string;
  strengths: string[];
  missingInformation: string[];
  recommendations: CvRecommendation[];
  atsReadabilityChecks: {
    label: string;
    passed: boolean;
    note: string;
  }[];
  generatedAt: string;
}

export interface JobTailoringResult {
  jobTitle: string;
  company: string;
  requiredQualifications: string[];
  importantKeywords: string[];
  matchedSkills: string[];
  matchedExperience: string[];
  missingOrUnconfirmed: string[];
  suggestions: {
    id: string;
    targetSection: string;
    rationale: string;
    originalText: string;
    suggestedText: string;
    status: 'pending' | 'accepted' | 'rejected';
  }[];
  transparencyNotice: string;
}

