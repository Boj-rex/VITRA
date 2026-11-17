import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  Packer,
  Paragraph,
  TabStopPosition,
  TabStopType,
  TextRun,
  convertInchesToTwip,
} from "docx";
import { normalizeExternalUrl } from "@/lib/utils";
import type { CvEditorSettings, SectionKey, StructuredCvContent, TemplateId } from "@/types/cv";

function getFontName(settings: CvEditorSettings, templateId: TemplateId): string {
  switch (settings.fontFamily) {
    case "arial":
      return "Arial";
    case "times":
      return "Times New Roman";
    case "georgia":
      return "Georgia";
    case "garamond":
      return "Garamond";
    case "trebuchet":
      return "Trebuchet MS";
    case "verdana":
      return "Verdana";
    case "cambria":
      return "Cambria";
    case "calibri":
    default:
      return templateId === "corporate-executive" || templateId === "ivy-league"
        ? "Georgia"
        : "Calibri";
  }
}

function getAccentHex(templateId: TemplateId): string {
  switch (templateId) {
    case "modern-minimal":
      return "173B30";
    case "corporate-executive":
      return "1D332B";
    case "graduate-entry":
      return "244B3E";
    case "tech-innovator":
      return "1E3A5F";
    case "nordic-clean":
      return "334155";
    case "ivy-league":
      return "5C1D24";
    case "compact-hybrid":
      return "0F172A";
    case "international-banking":
      return "0B2545";
    default:
      return "252821";
  }
}

export async function generateCvDocxBuffer(
  cv: StructuredCvContent,
  templateId: TemplateId,
  settings: CvEditorSettings
): Promise<Buffer> {
  const fontName = getFontName(settings, templateId);
  const accentColor = getAccentHex(templateId);
  const baseHalfPts =
    settings.fontSize === "small"
      ? 19
      : settings.fontSize === "extra-large"
        ? 25
        : settings.fontSize === "large"
          ? 23
          : 21; // 9.5 / 10.5 / 11.5 / 12.5 pt
  const lineGap = settings.spacing === "compact" ? 240 : settings.spacing === "relaxed" ? 310 : 270;
  const centerHeader =
    templateId === "corporate-executive" || templateId === "international-banking";

  const children: Paragraph[] = [];

  const makeHeading = (title: string) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      keepNext: true,
      spacing: { before: 200, after: 80 },
      border: {
        bottom: {
          color: templateId === "modern-minimal" ? "C4A46B" : accentColor,
          space: 2,
          style: BorderStyle.SINGLE,
          size: 6,
        },
      },
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          font: fontName,
          size: baseHalfPts + 2,
          color: accentColor,
        }),
      ],
    });

  // Name
  children.push(
    new Paragraph({
      alignment: centerHeader ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: cv.personalInfo.fullName || "Your Name",
          bold: true,
          font: fontName,
          size: baseHalfPts + 16,
          color: accentColor,
        }),
      ],
    })
  );

  // Title
  if (cv.personalInfo.professionalTitle.trim()) {
    children.push(
      new Paragraph({
        alignment: centerHeader ? AlignmentType.CENTER : AlignmentType.LEFT,
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: cv.personalInfo.professionalTitle,
            font: fontName,
            size: baseHalfPts + 2,
            color: "4A4D45",
          }),
        ],
      })
    );
  }

  // Contact line
  const contactChildren: (TextRun | ExternalHyperlink)[] = [];
  const addContactSeparator = () => {
    if (contactChildren.length > 0) {
      contactChildren.push(
        new TextRun({ text: "  |  ", font: fontName, size: baseHalfPts - 2, color: "77786F" })
      );
    }
  };

  const loc = [cv.personalInfo.city, cv.personalInfo.country].filter(Boolean).join(", ");
  if (loc) {
    contactChildren.push(new TextRun({ text: loc, font: fontName, size: baseHalfPts - 2, color: "555555" }));
  }
  if (cv.personalInfo.phone) {
    addContactSeparator();
    contactChildren.push(
      new TextRun({ text: cv.personalInfo.phone, font: fontName, size: baseHalfPts - 2, color: "555555" })
    );
  }
  if (cv.personalInfo.email) {
    addContactSeparator();
    contactChildren.push(
      new ExternalHyperlink({
        link: `mailto:${cv.personalInfo.email}`,
        children: [
          new TextRun({
            text: cv.personalInfo.email,
            font: fontName,
            size: baseHalfPts - 2,
            color: accentColor,
            underline: {},
          }),
        ],
      })
    );
  }
  for (const url of [cv.personalInfo.linkedinUrl, cv.personalInfo.portfolioUrl, cv.personalInfo.websiteUrl]) {
    if (!url.trim()) continue;
    addContactSeparator();
    contactChildren.push(
      new ExternalHyperlink({
        link: normalizeExternalUrl(url),
        children: [
          new TextRun({
            text: url,
            font: fontName,
            size: baseHalfPts - 2,
            color: accentColor,
            underline: {},
          }),
        ],
      })
    );
  }

  if (contactChildren.length > 0) {
    children.push(
      new Paragraph({
        alignment: centerHeader ? AlignmentType.CENTER : AlignmentType.LEFT,
        spacing: { after: 140 },
        children: contactChildren,
      })
    );
  }

  const hidden = new Set(settings.hiddenSections || []);
  const order: SectionKey[] =
    settings.sectionOrder?.length
      ? settings.sectionOrder
      : ["summary", "experience", "education", "skills", "projects", "certifications", "additional"];

  for (const section of order) {
    if (hidden.has(section)) continue;

    if (section === "summary" && cv.summary.trim()) {
      children.push(makeHeading("Professional Summary"));
      children.push(
        new Paragraph({
          spacing: { line: lineGap, after: 100 },
          children: [new TextRun({ text: cv.summary, font: fontName, size: baseHalfPts, color: "252821" })],
        })
      );
    }

    if (section === "experience" && (cv.experience.length > 0 || cv.alternativeExperience.length > 0)) {
      children.push(makeHeading(cv.experience.length > 0 ? "Work Experience" : "Relevant Experience & Training"));

      for (const exp of cv.experience) {
        const dates = `${exp.startDate || ""}${exp.startDate ? " - " : ""}${exp.isCurrent ? "Present" : exp.endDate || ""}`;
        children.push(
          new Paragraph({
            keepNext: true,
            spacing: { before: 80, after: 20 },
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            children: [
              new TextRun({ text: exp.jobTitle, bold: true, font: fontName, size: baseHalfPts + 1, color: "252821" }),
              new TextRun({ text: `\t${dates}`, font: fontName, size: baseHalfPts - 1, color: "77786F" }),
            ],
          })
        );
        const sub = [exp.company, exp.location, exp.employmentType].filter(Boolean).join(" | ");
        if (sub) {
          children.push(
            new Paragraph({
              keepNext: true,
              spacing: { after: 40 },
              children: [new TextRun({ text: sub, italics: true, font: fontName, size: baseHalfPts - 1, color: "555555" })],
            })
          );
        }
        if (exp.responsibilities.trim()) {
          children.push(
            new Paragraph({
              spacing: { line: lineGap, after: 40 },
              children: [new TextRun({ text: exp.responsibilities, font: fontName, size: baseHalfPts, color: "252821" })],
            })
          );
        }
        for (const ach of exp.achievements) {
          if (!ach.trim()) continue;
          children.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { line: lineGap, after: 30 },
              children: [new TextRun({ text: ach, font: fontName, size: baseHalfPts, color: "252821" })],
            })
          );
        }
      }

      for (const alt of cv.alternativeExperience) {
        const dates = `${alt.startDate || ""}${alt.startDate ? " - " : ""}${alt.isCurrent ? "Present" : alt.endDate || ""}`;
        children.push(
          new Paragraph({
            keepNext: true,
            spacing: { before: 80, after: 20 },
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            children: [
              new TextRun({ text: alt.title, bold: true, font: fontName, size: baseHalfPts + 1, color: "252821" }),
              new TextRun({ text: `\t${dates}`, font: fontName, size: baseHalfPts - 1, color: "77786F" }),
            ],
          })
        );
        const sub = [alt.organization, alt.location].filter(Boolean).join(" | ");
        if (sub) {
          children.push(
            new Paragraph({
              spacing: { after: 40 },
              children: [new TextRun({ text: sub, italics: true, font: fontName, size: baseHalfPts - 1, color: "555555" })],
            })
          );
        }
        if (alt.description.trim()) {
          children.push(
            new Paragraph({
              spacing: { line: lineGap, after: 50 },
              children: [new TextRun({ text: alt.description, font: fontName, size: baseHalfPts, color: "252821" })],
            })
          );
        }
      }
    }

    if (section === "education" && cv.education.length > 0) {
      children.push(makeHeading("Education"));
      for (const edu of cv.education) {
        const qual = [edu.qualification, edu.fieldOfStudy].filter(Boolean).join(" in ");
        const dates = `${edu.startDate || ""}${edu.startDate ? " - " : ""}${edu.isCurrent ? "In Progress" : edu.endDate || ""}`;
        children.push(
          new Paragraph({
            keepNext: true,
            spacing: { before: 60, after: 20 },
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            children: [
              new TextRun({ text: qual || edu.institution, bold: true, font: fontName, size: baseHalfPts + 1, color: "252821" }),
              new TextRun({ text: `\t${dates}`, font: fontName, size: baseHalfPts - 1, color: "77786F" }),
            ],
          })
        );
        if (qual && edu.institution) {
          children.push(
            new Paragraph({
              spacing: { after: 30 },
              children: [new TextRun({ text: edu.institution, italics: true, font: fontName, size: baseHalfPts - 1, color: "555555" })],
            })
          );
        }
        if (edu.achievements.trim()) {
          children.push(
            new Paragraph({
              spacing: { line: lineGap, after: 50 },
              children: [new TextRun({ text: edu.achievements, font: fontName, size: baseHalfPts, color: "252821" })],
            })
          );
        }
      }
    }

    if (section === "skills" && cv.skills.length > 0) {
      children.push(makeHeading("Skills"));
      const grouped = new Map<string, string[]>();
      for (const s of cv.skills) {
        const list = grouped.get(s.category) || [];
        list.push(s.name);
        grouped.set(s.category, list);
      }
      for (const [cat, items] of grouped.entries()) {
        const label = cat.charAt(0).toUpperCase() + cat.slice(1);
        children.push(
          new Paragraph({
            spacing: { line: lineGap, after: 40 },
            children: [
              new TextRun({ text: `${label}: `, bold: true, font: fontName, size: baseHalfPts, color: "252821" }),
              new TextRun({ text: items.join(", "), font: fontName, size: baseHalfPts, color: "252821" }),
            ],
          })
        );
      }
    }

    if (section === "projects" && cv.projects.length > 0) {
      children.push(makeHeading("Projects"));
      for (const proj of cv.projects) {
        children.push(
          new Paragraph({
            keepNext: true,
            spacing: { before: 60, after: 20 },
            children: [
              new TextRun({
                text: proj.role ? `${proj.title} (${proj.role})` : proj.title,
                bold: true,
                font: fontName,
                size: baseHalfPts + 1,
                color: "252821",
              }),
            ],
          })
        );
        if (proj.description.trim()) {
          children.push(
            new Paragraph({
              spacing: { line: lineGap, after: 30 },
              children: [new TextRun({ text: proj.description, font: fontName, size: baseHalfPts, color: "252821" })],
            })
          );
        }
        if (proj.technologies.length > 0) {
          children.push(
            new Paragraph({
              spacing: { after: 30 },
              children: [new TextRun({ text: `Tools: ${proj.technologies.join(", ")}`, italics: true, font: fontName, size: baseHalfPts - 1, color: "555555" })],
            })
          );
        }
        if (proj.outcome.trim()) {
          children.push(
            new Paragraph({
              spacing: { after: 40 },
              children: [new TextRun({ text: `Outcome: ${proj.outcome}`, font: fontName, size: baseHalfPts, color: "252821" })],
            })
          );
        }
      }
    }

    if (section === "certifications" && cv.certifications.length > 0) {
      children.push(makeHeading("Certifications"));
      for (const cert of cv.certifications) {
        const text = [cert.name, cert.issuingOrganization, cert.issueDate].filter(Boolean).join(" | ");
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { line: lineGap, after: 30 },
            children: [new TextRun({ text, font: fontName, size: baseHalfPts, color: "252821" })],
          })
        );
      }
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
      if (!hasAny) continue;

      children.push(makeHeading("Additional Information"));
      const addLine = (label: string, val: string) => {
        children.push(
          new Paragraph({
            spacing: { line: lineGap, after: 35 },
            children: [
              new TextRun({ text: `${label}: `, bold: true, font: fontName, size: baseHalfPts, color: "252821" }),
              new TextRun({ text: val, font: fontName, size: baseHalfPts, color: "252821" }),
            ],
          })
        );
      };
      if (add.languages.length > 0) addLine("Languages", add.languages.join(", "));
      if (add.awards.length > 0) addLine("Awards", add.awards.join("; "));
      if (add.memberships.length > 0) addLine("Memberships", add.memberships.join(", "));
      if (add.publications.length > 0) addLine("Publications", add.publications.join("; "));
      if (add.volunteerSummary.trim()) addLine("Volunteering", add.volunteerSummary);
      if (add.interests.length > 0) addLine("Interests", add.interests.join(", "));
      if (!add.omitReferences && add.references.length > 0) {
        for (const r of add.references) {
          addLine("Reference", [r.name, r.role, r.organization, r.contact].filter(Boolean).join(" | "));
        }
      }
    }
  }

  const document = new Document({
    creator: "Vitra CV Platform",
    title: `${cv.personalInfo.fullName || "Vitra"} CV`,
    sections: [
      {
        properties: {
          page: {
            size: {
              width: convertInchesToTwip(8.27), // A4
              height: convertInchesToTwip(11.69),
            },
            margin: {
              top: convertInchesToTwip(0.65),
              bottom: convertInchesToTwip(0.65),
              left: convertInchesToTwip(0.7),
              right: convertInchesToTwip(0.7),
            },
          },
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(document);
  return Buffer.from(buffer);
}

