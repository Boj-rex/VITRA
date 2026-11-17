import { PDFDocument, PDFName, PDFString, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "node:fs";
import path from "node:path";
import { normalizeExternalUrl } from "@/lib/utils";
import type { CvEditorSettings, SectionKey, StructuredCvContent, TemplateId } from "@/types/cv";

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;

// In-memory cache for TrueType font buffers to avoid repeated disk reads
let cachedCalibriRegular: Buffer | null = null;
let cachedCalibriBold: Buffer | null = null;
let cachedCalibriItalic: Buffer | null = null;

function resolveFontBuffer(filename: string): Buffer | null {
  const localAssetPath = path.join(process.cwd(), "assets", "fonts", filename);
  if (fs.existsSync(localAssetPath)) {
    try {
      return fs.readFileSync(localAssetPath);
    } catch {
      // Continue to fallback
    }
  }

  // Windows system fonts fallback
  const winFontsDir = process.env.WINDIR ? path.join(process.env.WINDIR, "Fonts") : "C:\\Windows\\Fonts";
  const winFontPath = path.join(winFontsDir, filename);
  if (fs.existsSync(winFontPath)) {
    try {
      return fs.readFileSync(winFontPath);
    } catch {
      // Fall through
    }
  }

  return null;
}

function getCalibriFontBuffers(): {
  regular: Buffer | null;
  bold: Buffer | null;
  italic: Buffer | null;
} {
  if (!cachedCalibriRegular) {
    cachedCalibriRegular = resolveFontBuffer("calibri.ttf");
  }
  if (!cachedCalibriBold) {
    cachedCalibriBold = resolveFontBuffer("calibrib.ttf");
  }
  if (!cachedCalibriItalic) {
    cachedCalibriItalic = resolveFontBuffer("calibrii.ttf");
  }
  return {
    regular: cachedCalibriRegular,
    bold: cachedCalibriBold,
    italic: cachedCalibriItalic,
  };
}

interface RenderTheme {
  accent: ReturnType<typeof rgb>;
  heading: ReturnType<typeof rgb>;
  text: ReturnType<typeof rgb>;
  muted: ReturnType<typeof rgb>;
  rule: ReturnType<typeof rgb>;
  centerHeader: boolean;
  headerBg?: ReturnType<typeof rgb>;
}

function getTheme(templateId: TemplateId): RenderTheme {
  switch (templateId) {
    case "modern-minimal":
      return {
        accent: rgb(0.09, 0.23, 0.19), // #173B30
        heading: rgb(0.09, 0.23, 0.19),
        text: rgb(0.14, 0.16, 0.13),
        muted: rgb(0.42, 0.44, 0.42),
        rule: rgb(0.77, 0.64, 0.42), // #C4A46B muted gold accent
        centerHeader: false,
      };
    case "corporate-executive":
      return {
        accent: rgb(0.11, 0.2, 0.17),
        heading: rgb(0.11, 0.2, 0.17),
        text: rgb(0.12, 0.12, 0.12),
        muted: rgb(0.38, 0.38, 0.38),
        rule: rgb(0.18, 0.24, 0.22),
        centerHeader: true,
      };
    case "graduate-entry":
      return {
        accent: rgb(0.14, 0.29, 0.24),
        heading: rgb(0.14, 0.29, 0.24),
        text: rgb(0.15, 0.16, 0.14),
        muted: rgb(0.42, 0.44, 0.42),
        rule: rgb(0.8, 0.82, 0.78),
        centerHeader: false,
      };
    case "tech-innovator":
      return {
        accent: rgb(0.12, 0.23, 0.37), // #1E3A5F Slate Navy
        heading: rgb(0.12, 0.23, 0.37),
        text: rgb(0.13, 0.15, 0.18),
        muted: rgb(0.38, 0.42, 0.48),
        rule: rgb(0.23, 0.51, 0.96), // #3B82F6 Electric Blue rule
        centerHeader: false,
      };
    case "nordic-clean":
      return {
        accent: rgb(0.2, 0.25, 0.33), // #334155 Slate
        heading: rgb(0.2, 0.25, 0.33),
        text: rgb(0.15, 0.17, 0.2),
        muted: rgb(0.45, 0.48, 0.52),
        rule: rgb(0.8, 0.84, 0.88), // #CBD5E1 Light Stone rule
        centerHeader: false,
      };
    case "ivy-league":
      return {
        accent: rgb(0.36, 0.11, 0.14), // #5C1D24 Academic Burgundy / Oxblood
        heading: rgb(0.36, 0.11, 0.14),
        text: rgb(0.12, 0.12, 0.12),
        muted: rgb(0.35, 0.35, 0.35),
        rule: rgb(0.55, 0.15, 0.21), // #8B2635 Deep Wine rule
        centerHeader: false,
      };
    case "compact-hybrid":
      return {
        accent: rgb(0.06, 0.09, 0.16), // #0F172A Deep Jet Slate
        heading: rgb(0.06, 0.09, 0.16),
        text: rgb(0.1, 0.12, 0.15),
        muted: rgb(0.35, 0.38, 0.42),
        rule: rgb(0.4, 0.45, 0.52), // #64748B
        centerHeader: false,
      };
    case "international-banking":
      return {
        accent: rgb(0.04, 0.15, 0.27), // #0B2545 Midnight Navy
        heading: rgb(0.04, 0.15, 0.27),
        text: rgb(0.1, 0.12, 0.15),
        muted: rgb(0.35, 0.38, 0.42),
        rule: rgb(0.57, 0.44, 0.2), // #926F34 Bronze Gold rule
        centerHeader: true,
      };
    case "classic-professional":
    default:
      return {
        accent: rgb(0.1, 0.1, 0.1),
        heading: rgb(0.1, 0.1, 0.1),
        text: rgb(0.15, 0.15, 0.15),
        muted: rgb(0.4, 0.4, 0.4),
        rule: rgb(0.75, 0.75, 0.75),
        centerHeader: false,
      };
  }
}

function sanitizePdfText(text: string, isCustomFont: boolean = false): string {
  if (!text) return "";
  const normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u00A0/g, " ");

  if (isCustomFont) {
    // TrueType fontkit embeds support Unicode; strip unprintable control codes
    return normalized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ");
  }

  // StandardFonts require WinAnsi charset (0x20 - 0xFF plus bullet \u2022)
  return normalized.replace(/[^\x09\x0A\x0D\x20-\xFF\u2022]/g, " ");
}

function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
  isCustomFont: boolean = false
): string[] {
  const cleaned = sanitizePdfText(text, isCustomFont).trim();
  if (!cleaned) return [];
  const paragraphs = cleaned.split(/\n+/);
  const lines: string[] = [];

  for (const para of paragraphs) {
    const words = para.trim().split(/\s+/);
    let current = "";
    for (const word of words) {
      // If a single word is wider than maxWidth (e.g. extremely long URL), break it
      const wordW = font.widthOfTextAtSize(word, size);
      if (wordW > maxWidth) {
        if (current) {
          lines.push(current);
          current = "";
        }
        let chunk = "";
        for (const char of word) {
          if (font.widthOfTextAtSize(chunk + char, size) <= maxWidth) {
            chunk += char;
          } else {
            lines.push(chunk);
            chunk = char;
          }
        }
        if (chunk) current = chunk;
        continue;
      }

      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        current = candidate;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

function addClickableLinkAnnotation(
  doc: PDFDocument,
  page: PDFPage,
  x: number,
  y: number,
  width: number,
  height: number,
  uri: string
) {
  const linkAnnotation = doc.context.obj({
    Type: "Annot",
    Subtype: "Link",
    Rect: [x, y - 2, x + width, y + height],
    Border: [0, 0, 0],
    A: {
      Type: "Action",
      S: "URI",
      URI: PDFString.of(uri),
    },
  });
  const ref = doc.context.register(linkAnnotation);
  const existingAnnots = page.node.get(PDFName.of("Annots"));
  if (existingAnnots && "push" in existingAnnots) {
    (existingAnnots as { push: (v: unknown) => void }).push(ref);
  } else {
    page.node.set(PDFName.of("Annots"), doc.context.obj([ref]));
  }
}

export async function generateCvPdfBuffer(
  cv: StructuredCvContent,
  templateId: TemplateId,
  settings: CvEditorSettings
): Promise<Buffer> {
  const doc = await PDFDocument.create();
  doc.setTitle(`${cv.personalInfo.fullName || "Vitra"} - CV`);
  doc.setCreator("Vitra CV Platform");

  const isSerif =
    settings.fontFamily === "times" ||
    settings.fontFamily === "georgia" ||
    settings.fontFamily === "garamond" ||
    settings.fontFamily === "cambria" ||
    templateId === "corporate-executive" ||
    templateId === "ivy-league";

  const isSans =
    settings.fontFamily === "arial" ||
    settings.fontFamily === "trebuchet" ||
    settings.fontFamily === "verdana";

  let fontRegular: PDFFont;
  let fontBold: PDFFont;
  let fontItalic: PDFFont;
  let isCustomFont = false;

  if (isSerif) {
    // Standard PDF Serif family (Times-Roman / Times-Bold / Times-Italic)
    fontRegular = await doc.embedFont(StandardFonts.TimesRoman);
    fontBold = await doc.embedFont(StandardFonts.TimesRomanBold);
    fontItalic = await doc.embedFont(StandardFonts.TimesRomanItalic);
  } else if (isSans) {
    // Standard PDF Sans family (Helvetica / Helvetica-Bold / Helvetica-Oblique)
    fontRegular = await doc.embedFont(StandardFonts.Helvetica);
    fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    fontItalic = await doc.embedFont(StandardFonts.HelveticaOblique);
  } else {
    // Default / Calibri: Embedded TrueType via fontkit with subsetting for compact file size
    const calibriBuffers = getCalibriFontBuffers();
    if (calibriBuffers.regular && calibriBuffers.bold) {
      try {
        doc.registerFontkit(fontkit);
        fontRegular = await doc.embedFont(calibriBuffers.regular, { subset: true });
        fontBold = await doc.embedFont(calibriBuffers.bold, { subset: true });
        fontItalic = calibriBuffers.italic
          ? await doc.embedFont(calibriBuffers.italic, { subset: true })
          : fontRegular;
        isCustomFont = true;
      } catch {
        // Fallback to standard Helvetica if fontkit embedding fails
        fontRegular = await doc.embedFont(StandardFonts.Helvetica);
        fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
        fontItalic = await doc.embedFont(StandardFonts.HelveticaOblique);
      }
    } else {
      // System fallback
      fontRegular = await doc.embedFont(StandardFonts.Helvetica);
      fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
      fontItalic = await doc.embedFont(StandardFonts.HelveticaOblique);
    }
  }

  const theme = getTheme(templateId);

  // Generous, readable font sizing & line spacing
  const baseFontSize =
    settings.fontSize === "small"
      ? 9.5
      : settings.fontSize === "extra-large"
        ? 12.5
        : settings.fontSize === "large"
          ? 11.5
          : 10.5;

  // Comfortable line spacing multipliers (generous line height prevents visual strain)
  const lineSpacing =
    settings.spacing === "compact" ? 1.32 : settings.spacing === "relaxed" ? 1.58 : 1.44;

  const sectionGap =
    settings.spacing === "compact" ? 12 : settings.spacing === "relaxed" ? 20 : 16;

  const marginX = 44;
  const marginTop = 46;
  const marginBottom = 46;
  const contentW = A4_WIDTH - marginX * 2;

  let page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
  let cursorY = A4_HEIGHT - marginTop;

  const ensureSpace = (needed: number) => {
    if (cursorY - needed < marginBottom) {
      page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
      cursorY = A4_HEIGHT - marginTop;
    }
  };

  const drawTextLine = (
    text: string,
    x: number,
    size: number,
    font: PDFFont,
    color = theme.text,
    linkUri?: string
  ) => {
    const safe = sanitizePdfText(text, isCustomFont);
    const lh = size * lineSpacing;
    ensureSpace(lh);
    page.drawText(safe, { x, y: cursorY, size, font, color });
    if (linkUri) {
      const w = font.widthOfTextAtSize(safe, size);
      addClickableLinkAnnotation(doc, page, x, cursorY, w, size, linkUri);
    }
    cursorY -= lh;
  };

  const drawWrapped = (
    text: string,
    x: number,
    size: number,
    font: PDFFont,
    maxW: number,
    color = theme.text
  ) => {
    const lines = wrapText(text, font, size, maxW, isCustomFont);
    for (const line of lines) {
      drawTextLine(line, x, size, font, color);
    }
  };

  // Professional bullet points with clean hanging indent:
  // The bullet symbol is drawn at 'x', while the text starts at 'x + indent'.
  // Wrapped lines align at 'x + indent' (not under the bullet symbol).
  const drawBullet = (
    text: string,
    x: number = marginX,
    size: number = baseFontSize,
    font: PDFFont = fontRegular,
    maxW: number = contentW,
    color = theme.text
  ) => {
    const cleaned = text.replace(/^[-•*]\s*/, "").trim();
    if (!cleaned) return;

    const bulletIndent = 14;
    const textW = maxW - bulletIndent;
    const lines = wrapText(cleaned, font, size, textW, isCustomFont);
    if (lines.length === 0) return;

    const lh = size * lineSpacing;
    ensureSpace(lh);

    // Draw bullet symbol
    const bulletChar = "•";
    page.drawText(bulletChar, {
      x: x + 2,
      y: cursorY,
      size,
      font,
      color: theme.accent,
    });

    // Draw line 1
    page.drawText(lines[0], {
      x: x + bulletIndent,
      y: cursorY,
      size,
      font,
      color,
    });
    cursorY -= lh;

    // Draw subsequent wrapped lines with hanging indent
    for (let i = 1; i < lines.length; i++) {
      ensureSpace(lh);
      page.drawText(lines[i], {
        x: x + bulletIndent,
        y: cursorY,
        size,
        font,
        color,
      });
      cursorY -= lh;
    }

    // Small item gap after bullet
    cursorY -= 2;
  };

  const drawSectionHeading = (title: string) => {
    ensureSpace(38);
    cursorY -= sectionGap * 0.45;
    const upper = title.toUpperCase();
    page.drawText(upper, {
      x: marginX,
      y: cursorY,
      size: baseFontSize + 1.5,
      font: fontBold,
      color: theme.heading,
    });
    cursorY -= 5;
    page.drawLine({
      start: { x: marginX, y: cursorY },
      end: { x: marginX + contentW, y: cursorY },
      thickness: templateId === "modern-minimal" ? 1.2 : 0.75,
      color: theme.rule,
    });
    cursorY -= baseFontSize * 1.05;
  };

  // HEADER BLOCK
  const fullName = sanitizePdfText(cv.personalInfo.fullName || "Your Name", isCustomFont);
  const nameSize = baseFontSize + 11; // 21.5pt on medium
  if (theme.centerHeader) {
    const nw = fontBold.widthOfTextAtSize(fullName, nameSize);
    page.drawText(fullName, {
      x: (A4_WIDTH - nw) / 2,
      y: cursorY,
      size: nameSize,
      font: fontBold,
      color: theme.heading,
    });
    cursorY -= nameSize * 1.2;
  } else {
    drawTextLine(fullName, marginX, nameSize, fontBold, theme.heading);
  }

  if (cv.personalInfo.professionalTitle.trim()) {
    const title = sanitizePdfText(cv.personalInfo.professionalTitle, isCustomFont);
    const titleSize = baseFontSize + 2; // 12.5pt
    if (theme.centerHeader) {
      const tw = fontRegular.widthOfTextAtSize(title, titleSize);
      page.drawText(title, {
        x: (A4_WIDTH - tw) / 2,
        y: cursorY,
        size: titleSize,
        font: fontRegular,
        color: theme.accent,
      });
      cursorY -= titleSize * 1.25;
    } else {
      drawTextLine(title, marginX, titleSize, fontRegular, theme.accent);
    }
  }

  // Contact details with clickable email, portfolio, and linkedin links
  const contactItems: { label: string; uri?: string }[] = [];
  const location = [cv.personalInfo.city, cv.personalInfo.country].filter(Boolean).join(", ");
  if (location) contactItems.push({ label: location });
  if (cv.personalInfo.phone) contactItems.push({ label: cv.personalInfo.phone });
  if (cv.personalInfo.email) {
    contactItems.push({ label: cv.personalInfo.email, uri: `mailto:${cv.personalInfo.email}` });
  }
  if (cv.personalInfo.linkedinUrl) {
    contactItems.push({
      label: cv.personalInfo.linkedinUrl,
      uri: normalizeExternalUrl(cv.personalInfo.linkedinUrl),
    });
  }
  if (cv.personalInfo.portfolioUrl) {
    contactItems.push({
      label: cv.personalInfo.portfolioUrl,
      uri: normalizeExternalUrl(cv.personalInfo.portfolioUrl),
    });
  }
  if (cv.personalInfo.websiteUrl) {
    contactItems.push({
      label: cv.personalInfo.websiteUrl,
      uri: normalizeExternalUrl(cv.personalInfo.websiteUrl),
    });
  }

  if (contactItems.length > 0) {
    const cSize = baseFontSize - 1;
    let lineItems: { label: string; uri?: string }[] = [];
    let currentLineW = 0;
    const sep = "  |  ";
    const sepW = fontRegular.widthOfTextAtSize(sep, cSize);

    const flushContactLine = () => {
      if (lineItems.length === 0) return;
      ensureSpace(cSize * 1.45);
      let drawX = theme.centerHeader ? (A4_WIDTH - currentLineW) / 2 : marginX;
      lineItems.forEach((item, idx) => {
        if (idx > 0) {
          page.drawText(sep, { x: drawX, y: cursorY, size: cSize, font: fontRegular, color: theme.muted });
          drawX += sepW;
        }
        const safe = sanitizePdfText(item.label, isCustomFont);
        const w = fontRegular.widthOfTextAtSize(safe, cSize);
        page.drawText(safe, {
          x: drawX,
          y: cursorY,
          size: cSize,
          font: fontRegular,
          color: item.uri ? theme.accent : theme.muted,
        });
        if (item.uri) {
          addClickableLinkAnnotation(doc, page, drawX, cursorY, w, cSize, item.uri);
        }
        drawX += w;
      });
      cursorY -= cSize * 1.48;
      lineItems = [];
      currentLineW = 0;
    };

    for (const item of contactItems) {
      const w = fontRegular.widthOfTextAtSize(sanitizePdfText(item.label, isCustomFont), cSize);
      const nextW = currentLineW === 0 ? w : currentLineW + sepW + w;
      if (nextW > contentW && lineItems.length > 0) {
        flushContactLine();
      }
      lineItems.push(item);
      currentLineW = currentLineW === 0 ? w : currentLineW + sepW + w;
    }
    flushContactLine();
  }

  cursorY -= 4;

  const hidden = new Set(settings.hiddenSections || []);
  const order: SectionKey[] =
    settings.sectionOrder?.length
      ? settings.sectionOrder
      : ["summary", "experience", "education", "skills", "projects", "certifications", "additional"];

  for (const section of order) {
    if (hidden.has(section)) continue;

    if (section === "summary" && cv.summary.trim()) {
      drawSectionHeading("Professional Summary");
      drawWrapped(cv.summary, marginX, baseFontSize, fontRegular, contentW);
      cursorY -= 4;
    }

    if (section === "experience") {
      const hasFormal = cv.experience.length > 0;
      const hasAlt = cv.alternativeExperience.length > 0;
      if (!hasFormal && !hasAlt) continue;

      drawSectionHeading(hasFormal ? "Work Experience" : "Relevant Experience & Training");

      for (const exp of cv.experience) {
        ensureSpace(48);
        const dateRange = `${exp.startDate || ""}${exp.startDate ? " - " : ""}${exp.isCurrent ? "Present" : exp.endDate || ""}`;
        const dateSafe = sanitizePdfText(dateRange, isCustomFont);
        const dateW = fontRegular.widthOfTextAtSize(dateSafe, baseFontSize - 0.5);
        const titleStr = sanitizePdfText(exp.jobTitle, isCustomFont);

        page.drawText(titleStr, {
          x: marginX,
          y: cursorY,
          size: baseFontSize + 0.5,
          font: fontBold,
          color: theme.text,
        });

        if (dateRange.trim()) {
          page.drawText(dateSafe, {
            x: marginX + contentW - dateW,
            y: cursorY,
            size: baseFontSize - 0.5,
            font: fontRegular,
            color: theme.muted,
          });
        }
        cursorY -= baseFontSize * 1.32;

        const subLine = [exp.company, exp.location, exp.employmentType].filter(Boolean).join(" | ");
        if (subLine) {
          drawTextLine(subLine, marginX, baseFontSize - 0.5, fontItalic, theme.muted);
        }

        if (exp.responsibilities.trim()) {
          drawWrapped(exp.responsibilities, marginX, baseFontSize, fontRegular, contentW);
          cursorY -= 2;
        }

        // Render achievements with clean hanging indent bullets
        for (const ach of exp.achievements) {
          if (!ach.trim()) continue;
          drawBullet(ach, marginX, baseFontSize, fontRegular, contentW);
        }
        cursorY -= 6;
      }

      for (const alt of cv.alternativeExperience) {
        ensureSpace(44);
        const dateRange = `${alt.startDate || ""}${alt.startDate ? " - " : ""}${alt.isCurrent ? "Present" : alt.endDate || ""}`;
        const dateSafe = sanitizePdfText(dateRange, isCustomFont);
        const dateW = fontRegular.widthOfTextAtSize(dateSafe, baseFontSize - 0.5);

        page.drawText(sanitizePdfText(alt.title, isCustomFont), {
          x: marginX,
          y: cursorY,
          size: baseFontSize + 0.5,
          font: fontBold,
          color: theme.text,
        });

        if (dateRange.trim()) {
          page.drawText(dateSafe, {
            x: marginX + contentW - dateW,
            y: cursorY,
            size: baseFontSize - 0.5,
            font: fontRegular,
            color: theme.muted,
          });
        }
        cursorY -= baseFontSize * 1.32;

        const sub = [alt.organization, alt.location].filter(Boolean).join(" | ");
        if (sub) {
          drawTextLine(sub, marginX, baseFontSize - 0.5, fontItalic, theme.muted);
        }

        if (alt.description.trim()) {
          // If description contains multiple lines or bullet points, render appropriately
          const bulletLines = alt.description.split(/\n+/).map((l) => l.trim()).filter(Boolean);
          for (const line of bulletLines) {
            if (line.startsWith("-") || line.startsWith("•") || line.startsWith("*")) {
              drawBullet(line, marginX, baseFontSize, fontRegular, contentW);
            } else {
              drawWrapped(line, marginX, baseFontSize, fontRegular, contentW);
            }
          }
        }
        cursorY -= 6;
      }
    }

    if (section === "education" && cv.education.length > 0) {
      drawSectionHeading("Education");
      for (const edu of cv.education) {
        ensureSpace(40);
        const qual = [edu.qualification, edu.fieldOfStudy].filter(Boolean).join(" in ");
        const dateRange = `${edu.startDate || ""}${edu.startDate ? " - " : ""}${edu.isCurrent ? "In Progress" : edu.endDate || ""}`;
        const dateSafe = sanitizePdfText(dateRange, isCustomFont);
        const dateW = fontRegular.widthOfTextAtSize(dateSafe, baseFontSize - 0.5);

        page.drawText(sanitizePdfText(qual || edu.institution, isCustomFont), {
          x: marginX,
          y: cursorY,
          size: baseFontSize + 0.5,
          font: fontBold,
          color: theme.text,
        });

        if (dateRange.trim()) {
          page.drawText(dateSafe, {
            x: marginX + contentW - dateW,
            y: cursorY,
            size: baseFontSize - 0.5,
            font: fontRegular,
            color: theme.muted,
          });
        }
        cursorY -= baseFontSize * 1.32;

        if (qual && edu.institution) {
          drawTextLine(edu.institution, marginX, baseFontSize - 0.5, fontItalic, theme.muted);
        }

        if (edu.achievements.trim()) {
          const lines = edu.achievements.split(/\n+/).map((l) => l.trim()).filter(Boolean);
          for (const line of lines) {
            if (line.startsWith("-") || line.startsWith("•") || line.startsWith("*")) {
              drawBullet(line, marginX, baseFontSize, fontRegular, contentW);
            } else {
              drawWrapped(line, marginX, baseFontSize, fontRegular, contentW);
            }
          }
        }
        cursorY -= 5;
      }
    }

    if (section === "skills" && cv.skills.length > 0) {
      drawSectionHeading("Skills");
      const grouped = new Map<string, string[]>();
      for (const s of cv.skills) {
        const list = grouped.get(s.category) || [];
        list.push(s.name);
        grouped.set(s.category, list);
      }
      for (const [cat, items] of grouped.entries()) {
        const label = cat.charAt(0).toUpperCase() + cat.slice(1);
        const prefix = `${label}: `;
        const prefixW = fontBold.widthOfTextAtSize(prefix, baseFontSize);
        const itemsStr = items.join(", ");

        // If prefix + items fits on one line:
        const fullLine = `${prefix}${itemsStr}`;
        if (fontRegular.widthOfTextAtSize(fullLine, baseFontSize) <= contentW) {
          ensureSpace(baseFontSize * lineSpacing);
          page.drawText(prefix, {
            x: marginX,
            y: cursorY,
            size: baseFontSize,
            font: fontBold,
            color: theme.text,
          });
          page.drawText(sanitizePdfText(itemsStr, isCustomFont), {
            x: marginX + prefixW,
            y: cursorY,
            size: baseFontSize,
            font: fontRegular,
            color: theme.text,
          });
          cursorY -= baseFontSize * lineSpacing;
        } else {
          // Wrapped across multiple lines
          drawWrapped(`${prefix}${itemsStr}`, marginX, baseFontSize, fontRegular, contentW);
        }
      }
      cursorY -= 4;
    }

    if (section === "projects" && cv.projects.length > 0) {
      drawSectionHeading("Projects");
      for (const proj of cv.projects) {
        ensureSpace(40);
        const titleLine = proj.role ? `${proj.title} (${proj.role})` : proj.title;
        drawTextLine(titleLine, marginX, baseFontSize + 0.5, fontBold, theme.text);

        if (proj.description.trim()) {
          drawWrapped(proj.description, marginX, baseFontSize, fontRegular, contentW);
        }

        if (proj.technologies.length > 0) {
          drawWrapped(
            `Technologies: ${proj.technologies.join(", ")}`,
            marginX,
            baseFontSize - 0.5,
            fontItalic,
            contentW,
            theme.muted
          );
        }

        if (proj.outcome.trim()) {
          drawWrapped(`Outcome: ${proj.outcome}`, marginX, baseFontSize, fontRegular, contentW);
        }

        if (proj.projectUrl.trim()) {
          drawTextLine(
            proj.projectUrl,
            marginX,
            baseFontSize - 0.5,
            fontRegular,
            theme.accent,
            normalizeExternalUrl(proj.projectUrl)
          );
        }
        cursorY -= 5;
      }
    }

    if (section === "certifications" && cv.certifications.length > 0) {
      drawSectionHeading("Certifications");
      for (const cert of cv.certifications) {
        const parts = [cert.name, cert.issuingOrganization, cert.issueDate].filter(Boolean).join(" | ");
        drawBullet(parts, marginX, baseFontSize, fontRegular, contentW);
      }
      cursorY -= 4;
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
      drawSectionHeading("Additional Information");

      if (add.languages.length > 0) {
        drawWrapped(`Languages: ${add.languages.join(", ")}`, marginX, baseFontSize, fontRegular, contentW);
      }
      if (add.awards.length > 0) {
        for (const award of add.awards) {
          drawBullet(`Award: ${award}`, marginX, baseFontSize, fontRegular, contentW);
        }
      }
      if (add.memberships.length > 0) {
        drawWrapped(`Memberships: ${add.memberships.join(", ")}`, marginX, baseFontSize, fontRegular, contentW);
      }
      if (add.publications.length > 0) {
        for (const pub of add.publications) {
          drawBullet(pub, marginX, baseFontSize, fontRegular, contentW);
        }
      }
      if (add.volunteerSummary.trim()) {
        drawWrapped(`Volunteering: ${add.volunteerSummary}`, marginX, baseFontSize, fontRegular, contentW);
      }
      if (add.interests.length > 0) {
        drawWrapped(`Interests: ${add.interests.join(", ")}`, marginX, baseFontSize, fontRegular, contentW);
      }
      if (!add.omitReferences && add.references.length > 0) {
        for (const r of add.references) {
          const refDetails = [r.name, r.role, r.organization, r.contact].filter(Boolean).join(" | ");
          drawBullet(`Reference: ${refDetails}`, marginX, baseFontSize, fontRegular, contentW);
        }
      }
    }
  }

  // Multi-page document page numbers & discreet professional running footer
  const totalPages = doc.getPageCount();
  if (totalPages > 1) {
    const candidateName = sanitizePdfText(cv.personalInfo.fullName || "CV", isCustomFont);
    const footerFontSize = 8;
    const footerY = 22;

    for (let i = 0; i < totalPages; i++) {
      const p = doc.getPage(i);

      // Subtle hairline divider above footer
      p.drawLine({
        start: { x: marginX, y: footerY + 12 },
        end: { x: marginX + contentW, y: footerY + 12 },
        thickness: 0.4,
        color: rgb(0.85, 0.85, 0.85),
      });

      // Left: Candidate Name - Curriculum Vitae
      p.drawText(`${candidateName} — Curriculum Vitae`, {
        x: marginX,
        y: footerY,
        size: footerFontSize,
        font: fontRegular,
        color: theme.muted,
      });

      // Right: Page X of Y
      const pageText = `Page ${i + 1} of ${totalPages}`;
      const pageW = fontRegular.widthOfTextAtSize(pageText, footerFontSize);
      p.drawText(pageText, {
        x: marginX + contentW - pageW,
        y: footerY,
        size: footerFontSize,
        font: fontRegular,
        color: theme.muted,
      });
    }
  }

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}
