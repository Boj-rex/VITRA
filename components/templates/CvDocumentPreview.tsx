import React, { useMemo } from "react";
import type { CvEditorSettings, SectionKey, StructuredCvContent, TemplateId } from "@/types/cv";
import { cn } from "@/lib/utils";

interface CvDocumentPreviewProps {
  cv: StructuredCvContent;
  templateId: TemplateId;
  settings: CvEditorSettings;
  className?: string;
  showProgressPlaceholders?: boolean;
}

export function CvDocumentPreview({
  cv,
  templateId,
  settings,
  className,
  showProgressPlaceholders,
}: CvDocumentPreviewProps) {
  const hidden = new Set(settings.hiddenSections || []);
  const order: SectionKey[] =
    settings.sectionOrder?.length
      ? settings.sectionOrder
      : ["summary", "experience", "education", "skills", "projects", "certifications", "additional"];

  const fontStack = useMemo(() => {
    switch (settings.fontFamily) {
      case "arial":
        return "Arial, Helvetica, sans-serif";
      case "times":
        return "'Times New Roman', Times, Georgia, serif";
      case "georgia":
        return "Georgia, 'Times New Roman', serif";
      case "garamond":
        return "Garamond, 'EB Garamond', Georgia, serif";
      case "trebuchet":
        return "'Trebuchet MS', 'Lucida Grande', sans-serif";
      case "verdana":
        return "Verdana, Geneva, sans-serif";
      case "cambria":
        return "Cambria, Georgia, serif";
      case "calibri":
      default:
        return templateId === "corporate-executive" || templateId === "ivy-league"
          ? "Georgia, 'Times New Roman', serif"
          : "Calibri, 'Segoe UI', Arial, sans-serif";
    }
  }, [settings.fontFamily, templateId]);

  const sizeClass =
    settings.fontSize === "small"
      ? "text-[11px]"
      : settings.fontSize === "extra-large"
        ? "text-[14px]"
        : settings.fontSize === "large"
          ? "text-[13px]"
          : "text-[12px]";

  const spaceClass =
    settings.spacing === "compact" || templateId === "compact-hybrid"
      ? "space-y-3 leading-snug"
      : settings.spacing === "relaxed"
        ? "space-y-5 leading-relaxed"
        : "space-y-4 leading-normal";

  const isCentered =
    templateId === "corporate-executive" ||
    templateId === "international-banking";

  const accentColor = useMemo(() => {
    switch (templateId) {
      case "modern-minimal":
        return "#173B30";
      case "corporate-executive":
        return "#1B312A";
      case "graduate-entry":
        return "#244B3E";
      case "tech-innovator":
        return "#1E3A5F";
      case "nordic-clean":
        return "#334155";
      case "ivy-league":
        return "#5C1D24";
      case "compact-hybrid":
        return "#0F172A";
      case "international-banking":
        return "#0B2545";
      case "classic-professional":
      default:
        return "#1A1A1A";
    }
  }, [templateId]);

  const dividerColor = useMemo(() => {
    switch (templateId) {
      case "modern-minimal":
        return "#C4A46B";
      case "classic-professional":
        return "#CCCCCC";
      case "graduate-entry":
        return "#C2DDD1";
      case "tech-innovator":
        return "#3B82F6";
      case "nordic-clean":
        return "#CBD5E1";
      case "ivy-league":
        return "#8B2635";
      case "compact-hybrid":
        return "#64748B";
      case "international-banking":
        return "#926F34";
      default:
        return accentColor;
    }
  }, [templateId, accentColor]);

  const contactParts = [
    [cv.personalInfo.city, cv.personalInfo.country].filter(Boolean).join(", "),
    cv.personalInfo.phone,
    cv.personalInfo.email,
    cv.personalInfo.linkedinUrl,
    cv.personalInfo.portfolioUrl,
    cv.personalInfo.websiteUrl,
  ].filter((p) => p && p.trim().length > 0);

  const groupedSkills = new Map<string, string[]>();
  for (const s of cv.skills) {
    const arr = groupedSkills.get(s.category) || [];
    arr.push(s.name);
    groupedSkills.set(s.category, arr);
  }

  const SectionHeader = ({ title }: { title: string }) => {
    const isUppercase = settings.headingCase !== "titlecase";
    const displayTitle = isUppercase ? title.toUpperCase() : title;

    if (templateId === "tech-innovator") {
      return (
        <div className="mb-2">
          <div className="flex items-center gap-2">
            <span className="h-3 w-1 rounded-full bg-[#3B82F6]" />
            <h2 className="text-[1.05em] font-bold tracking-wide font-mono text-[#0F2847]">
              {displayTitle}
            </h2>
          </div>
          <div className="mt-1 h-[1.5px] w-full bg-[#E2E8F0]" />
        </div>
      );
    }

    if (templateId === "nordic-clean") {
      return (
        <div className="mb-2">
          <h2 className="text-[1.0em] font-semibold tracking-[0.14em] text-[#0F172A]">
            {displayTitle}
          </h2>
          <div className="mt-1 h-[1px] w-full bg-[#E2E8F0]" />
        </div>
      );
    }

    if (templateId === "ivy-league") {
      return (
        <div className="mb-2">
          <h2 className="text-[1.1em] font-bold tracking-wide font-serif text-[#4A151B]">
            {displayTitle}
          </h2>
          <div className="mt-0.5 border-b-[1.5px] border-b-[#4A151B] border-t-[0.5px] border-t-[#701E2A] py-[1px]" />
        </div>
      );
    }

    if (templateId === "international-banking") {
      return (
        <div className="mb-2">
          <h2 className="text-[1.05em] font-bold tracking-wider text-[#06182E]">
            {displayTitle}
          </h2>
          <div className="mt-0.5 h-[1.5px] w-full bg-[#926F34]" />
        </div>
      );
    }

    if (templateId === "compact-hybrid") {
      return (
        <div className="mb-1">
          <h2 className="text-[1.0em] font-bold tracking-tight text-[#0F172A]">
            {displayTitle}
          </h2>
          <div className="mt-0.5 h-[1px] w-full bg-[#64748B]" />
        </div>
      );
    }

    return (
      <div className="mb-1.5">
        <h2
          className="text-[1.05em] font-bold uppercase tracking-wide text-black"
          style={{ color: accentColor }}
        >
          {displayTitle}
        </h2>
        <div
          className="mt-0.5 w-full"
          style={{
            height: templateId === "modern-minimal" ? "1.5px" : "1px",
            backgroundColor: dividerColor,
          }}
        />
      </div>
    );
  };

  return (
    <div
      data-keep-white="true"
      data-paper="white"
      className={cn(
        "cv-document-sheet relative overflow-hidden w-full bg-white text-black shadow-sm border border-[#E2DDD2] p-4 sm:p-7 md:p-10",
        sizeClass,
        className
      )}
      style={{
        fontFamily: fontStack,
        backgroundColor: "#FFFFFF",
        color: "#111111",
      }}
    >
      {/* Header */}
      <header className={cn("pb-3", isCentered ? "text-center" : "text-left")}>
        <h1
          className="text-[1.9em] font-bold tracking-tight text-black"
          style={{ color: accentColor }}
        >
          {cv.personalInfo.fullName || "Your Full Name"}
        </h1>
        {cv.personalInfo.professionalTitle && (
          <p className="mt-0.5 text-[1.1em] font-semibold text-[#111111]">
            {cv.personalInfo.professionalTitle}
          </p>
        )}
        {contactParts.length > 0 && (
          <p
            suppressHydrationWarning
            className={cn(
              "mt-1.5 flex flex-wrap gap-x-2.5 gap-y-0.5 text-[0.9em] font-medium text-[#222222]",
              isCentered && "justify-center"
            )}
          >
            {contactParts.map((part, idx) => (
              <span key={idx} suppressHydrationWarning>
                {idx > 0 && (
                  <span className="mr-2.5 text-[#555555]">
                    {templateId === "international-banking" ? "•" : "|"}
                  </span>
                )}
                {part}
              </span>
            ))}
          </p>
        )}
      </header>

      {/* Sections */}
      <div className={cn("mt-2", spaceClass)}>
        {order.map((section) => {
          if (hidden.has(section)) return null;

          if (section === "summary") {
            if (cv.summary.trim()) {
              return (
                <section key="summary">
                  <SectionHeader title="Professional Summary" />
                  <p className="whitespace-pre-line text-[#111111]">{cv.summary}</p>
                </section>
              );
            }
            if (showProgressPlaceholders) {
              return (
                <section key="summary" className="opacity-75 border border-dashed border-[#CBD5E1] p-2.5 rounded bg-amber-50/30">
                  <SectionHeader title="Professional Summary" />
                  <p className="italic text-[0.88em] text-[#64748B]">
                    Professional summary in progress. Fill in your focus details in Step 3 to review here.
                  </p>
                </section>
              );
            }
            return null;
          }

          if (section === "experience") {
            const hasFormal = cv.experience.length > 0;
            const hasAlt = cv.alternativeExperience.length > 0;
            if (!hasFormal && !hasAlt) {
              if (showProgressPlaceholders) {
                return (
                  <section key="experience" className="opacity-75 border border-dashed border-[#CBD5E1] p-2.5 rounded bg-slate-50/40">
                    <SectionHeader title="Work Experience / Relevant Training" />
                    <div className="space-y-1">
                      <div className="flex justify-between text-[0.9em] text-[#64748B]">
                        <span className="font-semibold italic">e.g. Job Title / Trainee / NYSC Corps Member — Organization</span>
                        <span className="italic">Month Year – Present</span>
                      </div>
                      <p className="text-[0.85em] italic text-[#94A3B8]">
                        Work history, industrial training (SIWES), and leadership accomplishments will appear here once added in Step 5.
                      </p>
                    </div>
                  </section>
                );
              }
              return null;
            }

            return (
              <section key="experience">
                <SectionHeader
                  title={hasFormal ? "Work Experience" : "Relevant Experience & Training"}
                />
                <div className="space-y-3">
                  {cv.experience.map((exp) => (
                    <div key={exp.id}>
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-bold text-black">{exp.jobTitle}</span>
                        <span className="text-[0.9em] font-medium text-[#333333]">
                          {exp.startDate}
                          {exp.startDate ? " – " : ""}
                          {exp.isCurrent ? "Present" : exp.endDate}
                        </span>
                      </div>
                      <p className="text-[0.92em] italic font-medium text-[#222222]">
                        {[exp.company, exp.location, exp.employmentType]
                          .filter(Boolean)
                          .join(" | ")}
                      </p>
                      {exp.responsibilities && (
                        <p className="mt-1 whitespace-pre-line text-[#111111]">
                          {exp.responsibilities}
                        </p>
                      )}
                      {exp.achievements.length > 0 && (
                        <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[#111111]">
                          {exp.achievements.map(
                            (ach, i) => ach.trim() && <li key={i}>{ach}</li>
                          )}
                        </ul>
                      )}
                    </div>
                  ))}

                  {cv.alternativeExperience.map((alt) => (
                    <div key={alt.id}>
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-bold text-black">{alt.title}</span>
                        <span className="text-[0.9em] font-medium text-[#333333]">
                          {alt.startDate}
                          {alt.startDate ? " – " : ""}
                          {alt.isCurrent ? "Present" : alt.endDate}
                        </span>
                      </div>
                      {(alt.organization || alt.location) && (
                        <p className="text-[0.92em] italic font-medium text-[#222222]">
                          {[alt.organization, alt.location].filter(Boolean).join(" | ")}
                        </p>
                      )}
                      {alt.description && (
                        <p className="mt-1 whitespace-pre-line text-[#111111]">
                          {alt.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          if (section === "education") {
            if (cv.education.length === 0) {
              if (showProgressPlaceholders) {
                return (
                  <section key="education" className="opacity-75 border border-dashed border-[#CBD5E1] p-2.5 rounded bg-slate-50/40">
                    <SectionHeader title="Education" />
                    <div className="space-y-1">
                      <div className="flex justify-between text-[0.9em] text-[#64748B]">
                        <span className="font-semibold italic">e.g. Degree / Major — Institution Name</span>
                        <span className="italic">Year – Year</span>
                      </div>
                      <p className="text-[0.85em] italic text-[#94A3B8]">
                        Academic qualifications (BSc, HND, ND, SIWES, SSCE) and achievements will appear here once added in Step 4.
                      </p>
                    </div>
                  </section>
                );
              }
              return null;
            }

            return (
              <section key="education">
                <SectionHeader title="Education" />
                <div className="space-y-2.5">
                  {cv.education.map((edu) => {
                    const qual = [edu.qualification, edu.fieldOfStudy]
                      .filter(Boolean)
                      .join(" in ");
                    return (
                      <div key={edu.id}>
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="font-bold text-black">
                            {qual || edu.institution}
                          </span>
                          <span className="text-[0.9em] font-medium text-[#333333]">
                            {edu.startDate}
                            {edu.startDate ? " – " : ""}
                            {edu.isCurrent ? "In Progress" : edu.endDate}
                          </span>
                        </div>
                        {qual && edu.institution && (
                          <p className="text-[0.92em] italic font-medium text-[#222222]">
                            {edu.institution}
                          </p>
                        )}
                        {edu.achievements && (
                          <p className="mt-0.5 text-[#111111]">{edu.achievements}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          }

          if (section === "skills") {
            if (cv.skills.length === 0) {
              if (showProgressPlaceholders) {
                return (
                  <section key="skills" className="opacity-75 border border-dashed border-[#CBD5E1] p-2.5 rounded bg-slate-50/40">
                    <SectionHeader title="Skills & Competencies" />
                    <p className="text-[0.85em] italic text-[#94A3B8]">
                      Core technical, domain, and soft skills tailored for ATS indexing will appear here once selected in Step 6.
                    </p>
                  </section>
                );
              }
              return null;
            }

            return (
              <section key="skills">
                <SectionHeader title="Skills" />
                {templateId === "tech-innovator" ? (
                  <div className="space-y-1.5">
                    {Array.from(groupedSkills.entries()).map(([cat, list]) => (
                      <div key={cat} className="flex flex-wrap items-center gap-1.5 text-[#111111]">
                        <span className="font-semibold text-xs capitalize text-[#0F2847]">
                          {cat}:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {list.map((skillName, sIdx) => (
                            <span
                              key={sIdx}
                              className="rounded border border-[#BFDBFE] bg-[#EFF6FF] px-1.5 py-0.5 text-[0.85em] font-medium text-[#0F2847]"
                            >
                              {skillName}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {Array.from(groupedSkills.entries()).map(([cat, list]) => (
                      <p key={cat} className="text-[#111111]">
                        <span className="font-semibold text-black capitalize">{cat}: </span>
                        {list.join(", ")}
                      </p>
                    ))}
                  </div>
                )}
              </section>
            );
          }

          if (section === "projects") {
            if (cv.projects.length === 0) {
              if (showProgressPlaceholders) {
                return (
                  <section key="projects" className="opacity-75 border border-dashed border-[#CBD5E1] p-2.5 rounded bg-slate-50/40">
                    <SectionHeader title="Projects" />
                    <p className="text-[0.85em] italic text-[#94A3B8]">
                      Portfolio projects, capstones, and key initiatives will appear here once added in Step 7.
                    </p>
                  </section>
                );
              }
              return null;
            }

            return (
              <section key="projects">
                <SectionHeader title="Projects" />
                <div className="space-y-2.5">
                  {cv.projects.map((proj) => (
                    <div key={proj.id}>
                      <p className="font-bold text-black">
                        {proj.title}
                        {proj.role && (
                          <span className="font-normal text-[#333333]"> ({proj.role})</span>
                        )}
                      </p>
                      {proj.description && (
                        <p className="mt-0.5 text-[#111111]">{proj.description}</p>
                      )}
                      {proj.technologies.length > 0 && (
                        <p className="text-[0.9em] italic font-medium text-[#333333]">
                          Tools: {proj.technologies.join(", ")}
                        </p>
                      )}
                      {proj.outcome && (
                        <p className="text-[#111111]">Outcome: {proj.outcome}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          if (section === "certifications") {
            if (cv.certifications.length === 0) {
              if (showProgressPlaceholders) {
                return (
                  <section key="certifications" className="opacity-75 border border-dashed border-[#CBD5E1] p-2.5 rounded bg-slate-50/40">
                    <SectionHeader title="Certifications" />
                    <p className="text-[0.85em] italic text-[#94A3B8]">
                      Industry certifications and professional licenses will appear here once added in Step 7.
                    </p>
                  </section>
                );
              }
              return null;
            }

            return (
              <section key="certifications">
                <SectionHeader title="Certifications" />
                <ul className="list-disc space-y-1 pl-4 text-[#111111]">
                  {cv.certifications.map((cert) => (
                    <li key={cert.id}>
                      {[cert.name, cert.issuingOrganization, cert.issueDate]
                        .filter(Boolean)
                        .join(" | ")}
                    </li>
                  ))}
                </ul>
              </section>
            );
          }

          if (section === "additional") {
            const add = cv.additional;
            const hasAny =
              add.languages.length > 0 ||
              add.awards.length > 0 ||
              add.memberships.length > 0 ||
              add.publications.length > 0 ||
              Boolean(add.volunteerSummary.trim()) ||
              add.interests.length > 0 ||
              (!add.omitReferences && add.references.length > 0);
            if (!hasAny) return null;

            return (
              <section key="additional">
                <SectionHeader title="Additional Information" />
                <div className="space-y-1 text-[#111111]">
                  {add.languages.length > 0 && (
                    <p>
                      <span className="font-semibold text-black">Languages: </span>
                      {add.languages.join(", ")}
                    </p>
                  )}
                  {add.awards.length > 0 && (
                    <p>
                      <span className="font-semibold text-black">Awards: </span>
                      {add.awards.join("; ")}
                    </p>
                  )}
                  {add.memberships.length > 0 && (
                    <p>
                      <span className="font-semibold text-black">Memberships: </span>
                      {add.memberships.join(", ")}
                    </p>
                  )}
                  {add.publications.length > 0 && (
                    <p>
                      <span className="font-semibold text-black">Publications: </span>
                      {add.publications.join("; ")}
                    </p>
                  )}
                  {add.volunteerSummary.trim() && (
                    <p>
                      <span className="font-semibold text-black">Volunteering: </span>
                      {add.volunteerSummary}
                    </p>
                  )}
                  {add.interests.length > 0 && (
                    <p>
                      <span className="font-semibold text-black">Interests: </span>
                      {add.interests.join(", ")}
                    </p>
                  )}
                  {!add.omitReferences &&
                    add.references.map((r) => (
                      <p key={r.id}>
                        <span className="font-semibold text-black">Reference: </span>
                        {[r.name, r.role, r.organization, r.contact]
                          .filter(Boolean)
                          .join(" | ")}
                      </p>
                    ))}
                </div>
              </section>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}

