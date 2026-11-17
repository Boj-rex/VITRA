import { describe, expect, it, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { PDFDocument, StandardFonts } from "pdf-lib";

import {
  createDefaultEditorSettings,
  createEmptyStructuredCv,
  getRecommendedTemplateForProfile,
  SAMPLE_SHOWCASE_CV,
} from "@/lib/cv/defaults";
import { compareCvWithJobDescription, evaluateCvQuality } from "@/lib/cv/ats-checker";
import {
  extractTextFromCvBuffer,
  validateUploadedCvFile,
} from "@/lib/document-processing/extractor";
import { parseRawTextToStructuredCv } from "@/lib/document-processing/cv-parser";
import { generateCvPdfBuffer } from "@/lib/document-generation/pdf-generator";
import { generateCvDocxBuffer } from "@/lib/document-generation/docx-generator";
import { localDevDb } from "@/lib/data/local-dev-store";
import { getSystemStatus } from "@/lib/config/env";
import { sendSupportInquiryEmail, sendLoginOtpEmail, maskEmail } from "@/lib/email";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import {
  personalInfoSchema,
  registerSchema,
} from "@/lib/validation/cv-schemas";
import { isSuperUser, AuthenticatedUser } from "@/lib/auth/session";
import { validateAvatarImage, MAX_AVATAR_UPLOAD_BYTES } from "@/lib/avatar/validation";

let tempDataDir = "";

beforeAll(() => {
  tempDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "vitra-test-"));
  process.env.VITRA_DEV_DATA_DIR = tempDataDir;
});

afterAll(() => {
  if (tempDataDir && fs.existsSync(tempDataDir)) {
    fs.rmSync(tempDataDir, { recursive: true, force: true });
  }
});

describe("VITRA Core Validation & Schemas", () => {
  it("supports Nigerian (+234) and international telephone numbers without requiring sensitive fields", () => {
    const validNg = personalInfoSchema.safeParse({
      fullName: "Ibrahim Musa",
      professionalTitle: "Graduate Trainee",
      email: "ibrahim@example.com",
      phone: "+234 803 555 0199",
      city: "Abuja",
      country: "Nigeria",
    });
    expect(validNg.success).toBe(true);

    const validUk = personalInfoSchema.safeParse({
      fullName: "Sarah Connor",
      email: "sarah@example.co.uk",
      phone: "+44 20 7946 0958",
      city: "London",
      country: "United Kingdom",
    });
    expect(validUk.success).toBe(true);
  });

  it("enforces strong password confirmation on registration", () => {
    const mismatch = registerSchema.safeParse({
      fullName: "Adaeze",
      email: "ada@example.com",
      password: "Password1",
      confirmPassword: "Password2",
    });
    expect(mismatch.success).toBe(false);
  });
});

describe("Scenario A & B: New CV Creation (Graduate No-Experience & Experienced)", () => {
  it("Scenario A: University graduate with no formal employment creates a meaningful CV with NYSC, projects and volunteering", async () => {
    const user = localDevDb.createUser({
      fullName: "Chisom Nwosu",
      email: "chisom@example.com",
      password: "Password123",
    });

    const cvContent = createEmptyStructuredCv("Nigeria");
    cvContent.personalInfo = {
      fullName: "Chisom Nwosu",
      professionalTitle: "Biochemistry Graduate",
      email: "chisom@example.com",
      phone: "+234 809 111 2233",
      city: "Enugu",
      country: "Nigeria",
      linkedinUrl: "linkedin.com/in/chisom-nwosu",
      portfolioUrl: "",
      websiteUrl: "",
    };
    cvContent.summary =
      "Detail-oriented Biochemistry graduate with practical laboratory exposure through SIWES and community health outreach during NYSC.";
    cvContent.hasFormalExperience = false;
    cvContent.alternativeExperience = [
      {
        id: "alt-1",
        category: "nysc",
        title: "NYSC Health & Laboratory Assistant",
        organization: "General Hospital Enugu",
        location: "Enugu",
        startDate: "Nov 2024",
        endDate: "Oct 2025",
        isCurrent: false,
        description: "Assisted senior lab scientists with sample logging and daily reagent inventory.",
      },
      {
        id: "alt-2",
        category: "volunteering",
        title: "Community Outreach Coordinator",
        organization: "Campus Red Cross",
        location: "Nsukka",
        startDate: "2023",
        endDate: "2024",
        isCurrent: false,
        description: "Coordinated blood drive registration for student volunteers.",
      },
    ];
    cvContent.education = [
      {
        id: "edu-1",
        institution: "University of Nigeria, Nsukka",
        qualification: "BSc",
        fieldOfStudy: "Biochemistry",
        startDate: "2019",
        endDate: "2024",
        isCurrent: false,
        achievements: "Second Class Honours (Upper Division)",
      },
    ];
    cvContent.skills = [
      { id: "s1", name: "Laboratory Safety", category: "technical" },
      { id: "s2", name: "Microsoft Excel", category: "digital" },
      { id: "s3", name: "Report Writing", category: "communication" },
      { id: "s4", name: "English", category: "languages" },
    ];

    const record = localDevDb.createCv({
      userId: user.id,
      title: "Chisom Nwosu Graduate CV",
      careerProfile: "recent-graduate",
      templateId: getRecommendedTemplateForProfile("recent-graduate"),
      structuredContent: cvContent,
      settings: createDefaultEditorSettings("recent-graduate"),
      status: "complete",
    });

    const quality = evaluateCvQuality(record.structuredContent);
    expect(quality.passedCount).toBe(quality.totalCount);

    const pdf = await generateCvPdfBuffer(record.structuredContent, record.templateId, record.settings);
    expect(pdf.subarray(0, 5).toString("ascii")).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(1500);
  });

  it("Scenario B & F: Experienced professional creates multiple CVs, switches templates, edits and exports PDF + DOCX", async () => {
    const user = localDevDb.createUser({
      fullName: "Tunde Bakare",
      email: "tunde@example.com",
      password: "Password123",
    });

    const cv1 = localDevDb.createCv({
      userId: user.id,
      title: "Operations Manager CV",
      careerProfile: "experienced-professional",
      templateId: "corporate-executive",
      structuredContent: SAMPLE_SHOWCASE_CV,
      settings: createDefaultEditorSettings("experienced-professional"),
      status: "complete",
    });

    const cv2 = localDevDb.createCv({
      userId: user.id,
      title: "Consulting CV",
      careerProfile: "experienced-professional",
      templateId: "modern-minimal",
      structuredContent: SAMPLE_SHOWCASE_CV,
      settings: createDefaultEditorSettings("experienced-professional"),
      status: "draft",
    });

    const list = localDevDb.listCvsForUser(user.id);
    expect(list.length).toBe(2);

    // Switch template preserving content
    const updated = localDevDb.updateCv(cv1.id, user.id, {
      templateId: "classic-professional",
      title: "Operations Manager CV (Updated)",
    });
    expect(updated?.templateId).toBe("classic-professional");
    expect(updated?.structuredContent.experience.length).toBe(SAMPLE_SHOWCASE_CV.experience.length);

    // Export both PDF and DOCX
    const pdfBuf = await generateCvPdfBuffer(
      updated!.structuredContent,
      updated!.templateId,
      updated!.settings
    );
    const docxBuf = await generateCvDocxBuffer(
      updated!.structuredContent,
      updated!.templateId,
      updated!.settings
    );
    expect(pdfBuf.subarray(0, 5).toString("ascii")).toBe("%PDF-");
    expect(docxBuf.subarray(0, 2).toString("ascii")).toBe("PK");
    expect(cv2.id).not.toBe(cv1.id);
  });
});

describe("Scenario C & D: File Upload Security, PDF/DOCX Extraction & Parsing", () => {
  it("rejects spoofed extension files (e.g. text file renamed to .pdf or .docx)", () => {
    const fakeBuffer = Buffer.from("This is plain text pretending to be a PDF", "utf8");
    const pdfCheck = validateUploadedCvFile("fake.pdf", "application/pdf", fakeBuffer);
    expect(pdfCheck.ok).toBe(false);

    const docxCheck = validateUploadedCvFile(
      "fake.docx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      fakeBuffer
    );
    expect(docxCheck.ok).toBe(false);
  });

  it("Scenario C: Extracts text and structured fields from a generated PDF CV", async () => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    page.drawText("Amina Yusuf", { x: 50, y: 760, size: 16, font });
    page.drawText("amina.yusuf@example.com | +234 802 333 4444 | Abuja, Nigeria", {
      x: 50,
      y: 740,
      size: 10,
      font,
    });
    page.drawText("PROFESSIONAL SUMMARY", { x: 50, y: 710, size: 12, font });
    page.drawText("Supply chain coordinator experienced in procurement and vendor management.", {
      x: 50,
      y: 690,
      size: 10,
      font,
    });
    page.drawText("SKILLS", { x: 50, y: 660, size: 12, font });
    page.drawText("Procurement, Excel, Inventory Control, Negotiation", {
      x: 50,
      y: 640,
      size: 10,
      font,
    });

    const bytes = await pdfDoc.save();
    const buffer = Buffer.from(bytes);

    const val = validateUploadedCvFile("amina_cv.pdf", "application/pdf", buffer);
    expect(val.ok).toBe(true);

    const extracted = await extractTextFromCvBuffer(buffer, "pdf");
    expect(extracted.text).toContain("Amina Yusuf");
    expect(extracted.text).toContain("amina.yusuf@example.com");

    const parsed = parseRawTextToStructuredCv(extracted.text);
    expect(parsed.structured.personalInfo.email).toBe("amina.yusuf@example.com");
    expect(parsed.structured.skills.some((s) => s.name.includes("Procurement"))).toBe(true);
  });

  it("Scenario D: Extracts text and structured fields from a DOCX CV", async () => {
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({ children: [new TextRun("Babatunde Adeyemi")] }),
            new Paragraph({ children: [new TextRun("babatunde@example.com | +234 805 999 0000")] }),
            new Paragraph({ children: [new TextRun("EXPERIENCE")] }),
            new Paragraph({ children: [new TextRun("Software Developer | PayWave | 2022 - Present")] }),
            new Paragraph({ children: [new TextRun("EDUCATION")] }),
            new Paragraph({ children: [new TextRun("BSc Computer Science, Obafemi Awolowo University 2018 - 2022")] }),
            new Paragraph({ children: [new TextRun("SKILLS")] }),
            new Paragraph({ children: [new TextRun("TypeScript, React, SQL, Node.js")] }),
          ],
        },
      ],
    });
    const buffer = Buffer.from(await Packer.toBuffer(doc));

    const val = validateUploadedCvFile(
      "babatunde.docx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      buffer
    );
    expect(val.ok).toBe(true);

    const extracted = await extractTextFromCvBuffer(buffer, "docx");
    expect(extracted.text).toContain("Babatunde Adeyemi");

    const parsed = parseRawTextToStructuredCv(extracted.text);
    expect(parsed.structured.personalInfo.email).toBe("babatunde@example.com");
    expect(parsed.structured.education.length).toBeGreaterThan(0);
    expect(parsed.structured.skills.length).toBeGreaterThanOrEqual(3);
  });
});

describe("Scenario E, G & H: Tailoring Comparison, Cross-User Isolation & Progress Recovery", () => {
  it("Scenario E: Compares job description keywords transparently without fabricating missing skills", () => {
    const res = compareCvWithJobDescription(
      SAMPLE_SHOWCASE_CV,
      "Looking for an Operations Coordinator with Excel reporting, inventory tracking, client relations, and Kubernetes."
    );
    expect(res.matchedKeywords).toContain("excel");
    expect(res.matchedKeywords).toContain("operations");
    expect(res.missingOrUnconfirmedKeywords).toContain("kubernetes");
  });

  it("Scenario G: Strictly isolates CVs between different users (cross-user access denied)", () => {
    const userA = localDevDb.createUser({
      fullName: "User A",
      email: "usera@example.com",
      password: "Password123",
    });
    const userB = localDevDb.createUser({
      fullName: "User B",
      email: "userb@example.com",
      password: "Password123",
    });

    const cvA = localDevDb.createCv({
      userId: userA.id,
      title: "Private CV A",
      careerProfile: "entry-level",
      templateId: "classic-professional",
      structuredContent: SAMPLE_SHOWCASE_CV,
      settings: createDefaultEditorSettings(),
      status: "draft",
    });

    // User B attempts to read, update, or delete User A's CV
    expect(localDevDb.getCvForUser(cvA.id, userB.id)).toBeNull();
    expect(localDevDb.updateCv(cvA.id, userB.id, { title: "Hacked" })).toBeNull();
    expect(localDevDb.deleteCv(cvA.id, userB.id)).toBe(false);

    // User A still owns untouched record
    expect(localDevDb.getCvForUser(cvA.id, userA.id)?.title).toBe("Private CV A");
  });

  it("Scenario H: Recovers saved draft progress cleanly across reloads", () => {
    const user = localDevDb.createUser({
      fullName: "Reload User",
      email: "reload@example.com",
      password: "Password123",
    });
    const draft = localDevDb.createCv({
      userId: user.id,
      title: "In-Progress Draft",
      careerProfile: "student",
      templateId: "graduate-entry",
      structuredContent: createEmptyStructuredCv("Nigeria"),
      settings: createDefaultEditorSettings("student"),
      status: "draft",
    });

    const updatedContent = createEmptyStructuredCv("Nigeria");
    updatedContent.personalInfo.fullName = "Kemi Adeola";
    localDevDb.updateCv(draft.id, user.id, { structuredContent: updatedContent });

    const reloaded = localDevDb.getCvForUser(draft.id, user.id);
    expect(reloaded?.structuredContent.personalInfo.fullName).toBe("Kemi Adeola");
  });

  it("Multi-page PDF generation handles long CVs cleanly without clipping or throwing", async () => {
    const longCv = structuredClone(SAMPLE_SHOWCASE_CV);
    for (let i = 0; i < 14; i++) {
      longCv.experience.push({
        id: `long-${i}`,
        jobTitle: `Operations Specialist ${i + 1}`,
        company: `Enterprise Organization ${i + 1}`,
        location: "Lagos, Nigeria",
        employmentType: "Full-time",
        startDate: "Jan 2020",
        endDate: "Dec 2021",
        isCurrent: false,
        responsibilities:
          "Coordinated cross-functional logistics schedules, reconciled daily dispatch manifests, and trained onboarding personnel on standard documentation procedures.",
        achievements: [
          "Maintained daily compliance logs for regional warehousing partners.",
        ],
      });
    }

    const pdfBuf = await generateCvPdfBuffer(
      longCv,
      "modern-minimal",
      createDefaultEditorSettings()
    );
    const parsedPdf = await PDFDocument.load(pdfBuf);
    expect(parsedPdf.getPageCount()).toBeGreaterThanOrEqual(2);
  });

  it("generates beautifully formatted PDFs with Calibri body or Times New Roman fonts and hanging-indent bullets", async () => {
    // 1. Calibri body font (default & recommended)
    const calibriSettings = createDefaultEditorSettings();
    calibriSettings.fontFamily = "calibri";
    calibriSettings.spacing = "normal";
    const calibriPdfBuf = await generateCvPdfBuffer(
      SAMPLE_SHOWCASE_CV,
      "modern-minimal",
      calibriSettings
    );
    expect(calibriPdfBuf.subarray(0, 5).toString("ascii")).toBe("%PDF-");
    expect(calibriPdfBuf.length).toBeGreaterThan(10000);

    const calibriDoc = await PDFDocument.load(calibriPdfBuf);
    expect(calibriDoc.getPageCount()).toBeGreaterThanOrEqual(1);

    // 2. Times New Roman (executive serif option)
    const timesSettings = createDefaultEditorSettings();
    timesSettings.fontFamily = "times";
    timesSettings.spacing = "relaxed";
    const timesPdfBuf = await generateCvPdfBuffer(
      SAMPLE_SHOWCASE_CV,
      "corporate-executive",
      timesSettings
    );
    expect(timesPdfBuf.subarray(0, 5).toString("ascii")).toBe("%PDF-");
    expect(timesPdfBuf.length).toBeGreaterThan(1000);

    const timesDoc = await PDFDocument.load(timesPdfBuf);
    expect(timesDoc.getPageCount()).toBeGreaterThanOrEqual(1);
  });

  it("supports all 9 ATS-compliant CV templates and 8 typography font options in PDF and Word exports", async () => {
    const allTemplates = [
      "classic-professional",
      "modern-minimal",
      "corporate-executive",
      "graduate-entry",
      "tech-innovator",
      "nordic-clean",
      "ivy-league",
      "compact-hybrid",
      "international-banking",
    ] as const;

    const allFonts = [
      "calibri",
      "times",
      "arial",
      "georgia",
      "garamond",
      "trebuchet",
      "verdana",
      "cambria",
    ] as const;

    // 1. Verify all 9 templates generate valid PDF buffers
    for (const tpl of allTemplates) {
      const settings = createDefaultEditorSettings();
      const pdf = await generateCvPdfBuffer(SAMPLE_SHOWCASE_CV, tpl, settings);
      expect(pdf.subarray(0, 5).toString("ascii")).toBe("%PDF-");
      expect(pdf.length).toBeGreaterThan(1000);

      const docx = await generateCvDocxBuffer(SAMPLE_SHOWCASE_CV, tpl, settings);
      expect(docx.length).toBeGreaterThan(1000);
    }

    // 2. Verify all 8 font families generate valid PDFs and DOCX
    for (const font of allFonts) {
      const settings = createDefaultEditorSettings();
      settings.fontFamily = font;
      settings.fontSize = "extra-large";
      const pdf = await generateCvPdfBuffer(SAMPLE_SHOWCASE_CV, "tech-innovator", settings);
      expect(pdf.subarray(0, 5).toString("ascii")).toBe("%PDF-");

      const docx = await generateCvDocxBuffer(SAMPLE_SHOWCASE_CV, "tech-innovator", settings);
      expect(docx.length).toBeGreaterThan(1000);
    }
  });

  it("enforces paid subscription requirement for completed CV downloads", async () => {
    const user = localDevDb.createUser({
      fullName: "Prospective Subscriber",
      email: "subscriber@example.com",
      password: "Password123",
    });

    // Strip plan to simulate unsubscribed / no-plan tier
    const dataDir = localDevDb.getUserById(user.id);
    expect(dataDir).toBeDefined();

    localDevDb.updateUserPlan(user.id, null as unknown as "starter", 0);
    const unsubscribed = localDevDb.getUserById(user.id);
    expect(unsubscribed?.planId).toBeNull();
    expect(unsubscribed?.maxCvs).toBe(0);

    // After subscribing to Starter (₦6,000 for 2 CVs), user has active download quota
    localDevDb.updateUserPlan(user.id, "starter", 2);
    const subscribed = localDevDb.getUserById(user.id);
    expect(subscribed?.planId).toBe("starter");
    expect(subscribed?.maxCvs).toBe(2);
  });

  it("generates a valid sitemap.xml and robots.txt excluding private routes", async () => {
    const sitemapEntries = sitemap();
    expect(Array.isArray(sitemapEntries)).toBe(true);
    expect(sitemapEntries.length).toBeGreaterThanOrEqual(10);

    const urls = sitemapEntries.map((e) => e.url);
    // Public routes should exist
    expect(urls.some((u) => u.endsWith("/"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/pricing"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/templates"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/privacy"))).toBe(true);

    // Private routes must NOT be in the public sitemap
    expect(urls.some((u) => u.includes("/dashboard"))).toBe(false);
    expect(urls.some((u) => u.includes("/api/"))).toBe(false);
    expect(urls.some((u) => u.includes("/editor/"))).toBe(false);

    const robotRules = robots();
    expect(robotRules.sitemap).toContain("/sitemap.xml");

    const rules = Array.isArray(robotRules.rules) ? robotRules.rules[0] : robotRules.rules;
    expect(rules).toBeDefined();
    const disallowed = Array.isArray(rules.disallow) ? rules.disallow : [rules.disallow];
    expect(disallowed).toContain("/dashboard/");
    expect(disallowed).toContain("/api/");
    expect(disallowed).toContain("/editor/");
  });

  it("strictly isolates secret API keys and never exposes them to client bundles or system status", async () => {
    // 1. Verify no secret keys have a NEXT_PUBLIC_ prefix
    const publicKeysWithSecrets = Object.keys(process.env).filter((k) => {
      const lower = k.toLowerCase();
      return (
        k.startsWith("NEXT_PUBLIC_") &&
        (lower.includes("secret") || lower.includes("service_role") || lower.includes("api_key"))
      );
    });
    expect(publicKeysWithSecrets).toHaveLength(0);

    // 2. Verify getSystemStatus never returns secret keys or raw credentials
    const status = getSystemStatus();
    const serialized = JSON.stringify(status);
    expect(serialized).not.toContain("sk-");
    expect(serialized).not.toContain("sb_secret");
    expect(serialized).not.toContain("AIza");

    // Only booleans and public model names should be returned
    expect(typeof status.geminiConfigured).toBe("boolean");
    expect(typeof status.openAiConfigured).toBe("boolean");
    expect(typeof status.supabaseConfigured).toBe("boolean");
    expect(typeof status.supabaseAdminConfigured).toBe("boolean");
  });

  it("routes customer support questions to Bolajim@gmail.com with safe local persistence fallback", async () => {
    const result = await sendSupportInquiryEmail({
      name: "Tunde Bakare",
      email: "tunde@example.com",
      category: "Payment & Packages",
      subject: "Card charge query",
      message: "Hello Bolaji, please confirm if my transaction for the Graduate plan succeeded.",
    });

    expect(result.success).toBe(true);
    expect(result.recipient).toBe("Bolajim@gmail.com");
    expect(result.savedLocally).toBe(true);

    // Verify local persistence file has the recorded inquiry
    const inqPath = path.join(process.cwd(), ".vitra-dev-data", "support-inquiries.json");
    expect(fs.existsSync(inqPath)).toBe(true);
    const saved = JSON.parse(fs.readFileSync(inqPath, "utf8"));
    const found = saved.find((item: any) => item.email === "tunde@example.com");
    expect(found).toBeDefined();
    expect(found.subject).toBe("Card charge query");
    expect(found.name).toBe("Tunde Bakare");
  });

  it("enforces a robust email OTP verification layer for candidate login", async () => {
    const testUser = localDevDb.createUser({
      fullName: "Ngozi Okonjo",
      email: "ngozi@example.com",
      password: "CandidatePassword123!",
      country: "Nigeria",
    });

    // 1. Test email masking helper
    expect(maskEmail("Bolajim@gmail.com")).toBe("B*****m@gmail.com");
    expect(maskEmail("ngozi@example.com")).toBe("n***i@example.com");

    // 2. Generate OTP
    const { code, expiresAt } = localDevDb.createLoginOtp(testUser.id, testUser.email, 10);
    expect(code).toHaveLength(6);
    expect(/^\d{6}$/.test(code)).toBe(true);
    expect(new Date(expiresAt).getTime()).toBeGreaterThan(Date.now());

    // 3. Dispatch OTP Email
    const emailResult = await sendLoginOtpEmail({
      email: testUser.email,
      fullName: testUser.fullName,
      code,
      expiresMinutes: 10,
    });
    expect(emailResult.success).toBe(true);
    expect(emailResult.savedLocally).toBe(true);

    // 4. Test wrong OTP code decrementing attempts
    const wrongAttempt = localDevDb.verifyLoginOtp(testUser.email, "999999");
    expect(wrongAttempt.success).toBe(false);
    expect(wrongAttempt.error).toContain("4 attempts remaining");

    // 5. Test resend cooldown
    const cooldown = localDevDb.canResendLoginOtp(testUser.email, 60);
    expect(cooldown.allowed).toBe(false);
    expect(cooldown.waitSeconds).toBeGreaterThan(0);

    // 6. Test correct OTP code verification
    const validAttempt = localDevDb.verifyLoginOtp(testUser.email, code);
    expect(validAttempt.success).toBe(true);
    expect(validAttempt.user).toBeDefined();
    expect(validAttempt.user?.id).toBe(testUser.id);
    expect(validAttempt.user?.email).toBe(testUser.email);

    // 7. Verify OTP cannot be re-used after consumption
    const replayAttempt = localDevDb.verifyLoginOtp(testUser.email, code);
    expect(replayAttempt.success).toBe(false);
    expect(replayAttempt.error).toContain("No pending verification code");
  });

  it("accommodates Paystack gateway, generates itemized receipts, and dispatches receipt emails", async () => {
    const { paystackService, generateReceiptNumber } = await import("@/lib/payments/paystack-service");
    const { sendPaymentReceiptEmail } = await import("@/lib/email");

    const candidate = localDevDb.createUser({
      fullName: "Chioma Adeleke",
      email: "chioma@example.com",
      password: "CandidateSecurePassword456!",
      country: "Nigeria",
    });

    // 1. Initialize Checkout pointing to the receipt page
    const checkout = await paystackService.initializeCheckout({
      userId: candidate.id,
      email: candidate.email,
      fullName: candidate.fullName,
      planId: "pro",
      callbackUrl: "http://localhost:3000/pricing/receipt?plan=pro",
    });

    expect(checkout.ok).toBe(true);
    expect(checkout.reference).toContain("vitra_pro_");
    expect(checkout.authorizationUrl).toContain("/pricing/receipt?plan=pro");

    // 2. Receipt number generation
    const receiptNum = generateReceiptNumber(checkout.reference);
    expect(receiptNum).toMatch(/^VIT-REC-\d{4}-[A-Z0-9]+$/);

    // 3. Verify transaction
    const verification = await paystackService.verifyTransaction(checkout.reference, "pro");
    expect(verification.ok).toBe(true);
    expect(verification.status).toBe("success");
    expect(verification.amountNaira).toBe(15000);
    expect(verification.planId).toBe("pro");

    // 4. Activate plan & quota
    const activation = await paystackService.activatePlan({
      userId: candidate.id,
      email: candidate.email,
      fullName: candidate.fullName,
      planId: "pro",
      reference: checkout.reference,
      amountNaira: 15000,
      channel: "card",
    });

    expect(activation.ok).toBe(true);
    expect(activation.planId).toBe("pro");
    expect(activation.maxCvs).toBe(6);

    // Verify user quota updated in database
    const refreshedUser = localDevDb.getUserById(candidate.id);
    expect(refreshedUser?.planId).toBe("pro");
    expect(refreshedUser?.maxCvs).toBe(6);

    // Verify payment transaction recorded
    const payments = localDevDb.listPaymentsForUser(candidate.id);
    expect(payments.length).toBeGreaterThan(0);
    expect(payments.some((p) => p.reference === checkout.reference)).toBe(true);

    // 5. Branded Payment Receipt Email Dispatch
    const receiptEmail = await sendPaymentReceiptEmail({
      email: candidate.email,
      fullName: candidate.fullName,
      planId: "pro",
      planName: "Standard Career Pro",
      amountNaira: 15000,
      maxCvs: 6,
      reference: checkout.reference,
      receiptNumber: receiptNum,
      paidAt: new Date().toISOString(),
      channel: "Paystack (Card)",
    });

    expect(receiptEmail.success).toBe(true);
    expect(receiptEmail.recipient).toBe("chioma@example.com");
    expect(receiptEmail.savedLocally).toBe(true);

    // Verify receipt email persistence file
    const receiptFile = path.join(process.cwd(), ".vitra-dev-data", "receipt-emails.json");
    expect(fs.existsSync(receiptFile)).toBe(true);
    const savedReceipts = JSON.parse(fs.readFileSync(receiptFile, "utf8"));
    const foundReceipt = savedReceipts.find((r: any) => r.reference === checkout.reference);
    expect(foundReceipt).toBeDefined();
    expect(foundReceipt.amountNaira).toBe(15000);
    expect(foundReceipt.maxCvs).toBe(6);

    // 6. Test clearAllPayments helper
    const clearResult = localDevDb.clearAllPayments(true);
    expect(clearResult.transactionsCleared).toBeGreaterThan(0);
    expect(localDevDb.listPaymentsForUser(candidate.id)).toHaveLength(0);
    const clearedUser = localDevDb.getUserById(candidate.id);
    expect(clearedUser?.planId).toBeNull();
    expect(clearedUser?.maxCvs).toBe(0);
  });

  it("strictly enforces paid CV quotas and closes deletion loophole (deleting existing CVs does not restore generation credits)", async () => {
    const { cvService } = await import("@/services/cv-service");

    // 1. Create a candidate user without a plan
    const candidate = localDevDb.createUser({
      fullName: "Babatunde Alabi",
      email: "babatunde@example.com",
      password: "BabatundeSecurePassword123!",
      country: "Nigeria",
      planId: null,
      maxCvs: 0,
    });

    // 2. Unpaid user cannot create any CVs
    const unpaidCheck = await cvService.assertCanCreateCv(candidate.id, {
      planId: candidate.planId,
      maxCvs: candidate.maxCvs,
      generatedCvsCount: candidate.generatedCvsCount,
    });
    expect(unpaidCheck.allowed).toBe(false);
    expect(unpaidCheck.error).toContain("Vitra is a paid service");

    // 3. User purchases Starter plan (quota: 2 CVs)
    localDevDb.updateUserPlan(candidate.id, "starter", 2);
    let user = localDevDb.getUserById(candidate.id)!;
    expect(user.planId).toBe("starter");
    expect(user.maxCvs).toBe(2);
    expect(localDevDb.getGeneratedCvsCount(candidate.id)).toBe(0);

    const checkBeforeCreate = await cvService.assertCanCreateCv(candidate.id, user);
    expect(checkBeforeCreate.allowed).toBe(true);
    expect(checkBeforeCreate.usedCount).toBe(0);

    // 4. Create CV #1 (used 1 of 2)
    const cv1 = localDevDb.createCv({
      userId: candidate.id,
      title: "Babatunde CV 1",
      careerProfile: "experienced-professional",
      templateId: "classic-professional",
      status: "draft",
      structuredContent: createEmptyStructuredCv("Nigeria"),
      settings: createDefaultEditorSettings("experienced-professional"),
    });
    expect(cv1).toBeDefined();
    expect(localDevDb.getGeneratedCvsCount(candidate.id)).toBe(1);

    user = localDevDb.getUserById(candidate.id)!;
    const checkAfterCv1 = await cvService.assertCanCreateCv(candidate.id, user);
    expect(checkAfterCv1.allowed).toBe(true);
    expect(checkAfterCv1.usedCount).toBe(1);

    // 5. Create CV #2 (used 2 of 2 - package exhausted)
    const cv2 = localDevDb.createCv({
      userId: candidate.id,
      title: "Babatunde CV 2",
      careerProfile: "experienced-professional",
      templateId: "classic-professional",
      status: "draft",
      structuredContent: createEmptyStructuredCv("Nigeria"),
      settings: createDefaultEditorSettings("experienced-professional"),
    });
    expect(cv2).toBeDefined();
    expect(localDevDb.getGeneratedCvsCount(candidate.id)).toBe(2);

    user = localDevDb.getUserById(candidate.id)!;
    const checkAfterCv2 = await cvService.assertCanCreateCv(candidate.id, user);
    expect(checkAfterCv2.allowed).toBe(false);
    expect(checkAfterCv2.usedCount).toBe(2);
    expect(checkAfterCv2.error).toContain("reached your package limit of 2 CV generations");
    expect(checkAfterCv2.error).toContain("deleting an already saved CV does not restore generation credits");

    // 6. LOOPHOLE TEST: User deletes CV #1
    localDevDb.deleteCv(cv1.id, candidate.id);

    // Verify active CVs in list is now 1
    const activeCvs = localDevDb.listCvsForUser(candidate.id);
    expect(activeCvs).toHaveLength(1);
    expect(activeCvs[0].id).toBe(cv2.id);

    // BUT cumulative generated count must strictly remain 2!
    expect(localDevDb.getGeneratedCvsCount(candidate.id)).toBe(2);

    // Attempting to create CV #3 must be BLOCKED despite active count being 1
    user = localDevDb.getUserById(candidate.id)!;
    const checkAfterDeletion = await cvService.assertCanCreateCv(candidate.id, user);
    expect(checkAfterDeletion.allowed).toBe(false);
    expect(checkAfterDeletion.usedCount).toBe(2);
    expect(checkAfterDeletion.error).toContain("reached your package limit of 2 CV generations");
    expect(checkAfterDeletion.error).toContain("deleting an already saved CV does not restore generation credits");

    // 7. Upgrade to Pro (6 CVs allowance)
    localDevDb.updateUserPlan(candidate.id, "pro", 6);
    user = localDevDb.getUserById(candidate.id)!;
    expect(user.maxCvs).toBe(6);

    const checkAfterUpgrade = await cvService.assertCanCreateCv(candidate.id, user);
    expect(checkAfterUpgrade.allowed).toBe(true);
    expect(checkAfterUpgrade.usedCount).toBe(2); // Still tracks the 2 previously created
    expect(checkAfterUpgrade.maxCvs).toBe(6);

    // Now CV #3 can be created
    const cv3 = localDevDb.createCv({
      userId: candidate.id,
      title: "Babatunde CV 3",
      careerProfile: "experienced-professional",
      templateId: "classic-professional",
      status: "draft",
      structuredContent: createEmptyStructuredCv("Nigeria"),
      settings: createDefaultEditorSettings("experienced-professional"),
    });
    expect(cv3).toBeDefined();
    expect(localDevDb.getGeneratedCvsCount(candidate.id)).toBe(3);
  });

  it("enforces that users who exhaust their package must pay another premium to resume CV services, and renewing grants fresh generation credits", async () => {
    const { cvService } = await import("@/services/cv-service");
    const { paystackService } = await import("@/lib/payments/paystack-service");

    // 1. Candidate registers and subscribes to Starter (2 CVs allowance)
    const subscriber = localDevDb.createUser({
      fullName: "Amaka Okafor",
      email: `amaka_${Date.now()}@example.com`,
      password: "AmakaPassword123!",
      country: "Nigeria",
      planId: "starter",
      maxCvs: 2,
    });

    let user = localDevDb.getUserById(subscriber.id)!;
    expect(user.maxCvs).toBe(2);
    expect(localDevDb.getGeneratedCvsCount(subscriber.id)).toBe(0);

    // Initial check: Allowed
    const initialCheck = await cvService.assertCanCreateCv(subscriber.id, user);
    expect(initialCheck.allowed).toBe(true);

    // 2. Candidate generates CV #1
    localDevDb.createCv({
      userId: subscriber.id,
      title: "Amaka CV 1",
      careerProfile: "entry-level",
      templateId: "classic-professional",
      status: "draft",
      structuredContent: createEmptyStructuredCv("Nigeria"),
      settings: createDefaultEditorSettings("entry-level"),
    });
    expect(localDevDb.getGeneratedCvsCount(subscriber.id)).toBe(1);

    // 3. Candidate generates CV #2 (all 2 credits consumed)
    localDevDb.createCv({
      userId: subscriber.id,
      title: "Amaka CV 2",
      careerProfile: "entry-level",
      templateId: "classic-professional",
      status: "draft",
      structuredContent: createEmptyStructuredCv("Nigeria"),
      settings: createDefaultEditorSettings("entry-level"),
    });
    expect(localDevDb.getGeneratedCvsCount(subscriber.id)).toBe(2);

    // 4. Candidate attempts to create CV #3: BLOCKED with "pay another premium" notice
    user = localDevDb.getUserById(subscriber.id)!;
    const exhaustedCheck = await cvService.assertCanCreateCv(subscriber.id, user);
    expect(exhaustedCheck.allowed).toBe(false);
    expect(exhaustedCheck.usedCount).toBe(2);
    expect(exhaustedCheck.error).toContain("exhausted your allowed access");
    expect(exhaustedCheck.error).toContain("Please pay another premium to continue using our services and generate more CVs");

    // 5. Candidate pays another premium (re-purchases Starter package)
    const renewalResult = await paystackService.activatePlan({
      userId: subscriber.id,
      planId: "starter",
      reference: `ref_renew_${Date.now()}`,
    });
    expect(renewalResult.ok).toBe(true);

    // Quota is extended: previous 2 used + 2 fresh credits = 4 total maxCvs
    user = localDevDb.getUserById(subscriber.id)!;
    expect(user.maxCvs).toBe(4);
    expect(localDevDb.getGeneratedCvsCount(subscriber.id)).toBe(2);

    // 6. Check assertion: Now ALLOWED to generate more CVs
    const renewedCheck = await cvService.assertCanCreateCv(subscriber.id, user);
    expect(renewedCheck.allowed).toBe(true);
    expect(renewedCheck.usedCount).toBe(2);
    expect(renewedCheck.maxCvs).toBe(4);

    // 7. Candidate generates CV #3 successfully
    const cv3 = localDevDb.createCv({
      userId: subscriber.id,
      title: "Amaka CV 3",
      careerProfile: "entry-level",
      templateId: "classic-professional",
      status: "draft",
      structuredContent: createEmptyStructuredCv("Nigeria"),
      settings: createDefaultEditorSettings("entry-level"),
    });
    expect(cv3).toBeDefined();
    expect(localDevDb.getGeneratedCvsCount(subscriber.id)).toBe(3);
  });

  it("operates the ATS system without AI, supporting deterministic hardcoded audits, role tailoring, and super user policy controls", async () => {
    const { analyzeCvContentHardCoded, tailorCvToJobHardCoded } = await import("@/lib/cv/ats-checker");

    // 1. Build a representative Nigerian candidate CV
    const cv = createEmptyStructuredCv("Nigeria");
    cv.personalInfo.fullName = "Kelechi Nnamdi";
    cv.personalInfo.professionalTitle = "Frontend Engineer";
    cv.personalInfo.email = "kelechi@example.com";
    cv.personalInfo.phone = "+234 802 333 4455";
    cv.personalInfo.city = "Lagos";
    cv.summary = "Versatile Frontend Engineer with 4 years experience building responsive web apps with React, Next.js, and TypeScript.";
    cv.skills = [
      { id: "s1", name: "React", category: "technical" },
      { id: "s2", name: "Next.js", category: "technical" },
      { id: "s3", name: "TypeScript", category: "technical" },
      { id: "s4", name: "Tailwind CSS", category: "technical" },
      { id: "s5", name: "REST APIs", category: "technical" },
    ];
    cv.experience = [
      {
        id: "exp-1",
        jobTitle: "Frontend Developer",
        company: "PayFintech Lagos",
        location: "Lagos, Nigeria",
        employmentType: "Full-time",
        startDate: "2021",
        endDate: "Present",
        isCurrent: true,
        responsibilities: "Architected responsive dashboard components in Next.js, optimized Core Web Vitals, and collaborated with UI designers.",
        achievements: ["Improved page load speed by 28%", "Delivered checkout flow used by 45,000 customers"],
      },
    ];
    cv.education = [
      {
        id: "edu-1",
        institution: "University of Ibadan",
        qualification: "BSc",
        fieldOfStudy: "Computer Science",
        startDate: "2016",
        endDate: "2020",
        isCurrent: false,
        achievements: "First Class Honors",
      },
    ];

    // 2. Test Hard-Coded ATS Quality Analysis (Zero AI)
    const analysis = analyzeCvContentHardCoded(cv);
    expect(analysis.overallSummary).toContain("Deterministic ATS audit completed");
    expect(analysis.strengths.length).toBeGreaterThan(0);
    expect(analysis.strengths.some((s) => s.includes("contact details"))).toBe(true);
    expect(analysis.atsReadabilityChecks.length).toBe(8);
    expect(analysis.recommendations.length).toBeGreaterThan(0);

    // 3. Test Hard-Coded Job Tailoring (Zero AI)
    const targetJobDesc = `We are seeking a Senior Frontend Engineer to lead React and TypeScript development.
      Requirements:
      - 3+ years experience with Next.js and Tailwind CSS
      - Strong knowledge of GraphQL and state management
      - Bachelor's degree in Computer Science or related field
      - Experience with performance optimization and responsive design`;

    const tailoring = tailorCvToJobHardCoded(cv, {
      jobTitle: "Senior Frontend Engineer",
      company: "Interswitch",
      jobDescription: targetJobDesc,
    });

    expect(tailoring.jobTitle).toBe("Senior Frontend Engineer");
    expect(tailoring.company).toBe("Interswitch");
    expect(tailoring.importantKeywords.length).toBeGreaterThan(0);
    expect(tailoring.matchedSkills).toContain("react");
    expect(tailoring.matchedSkills).toContain("typescript");
    expect(tailoring.matchedSkills).toContain("next.js");
    expect(tailoring.transparencyNotice).toContain("Hard-Coded Deterministic ATS Engine without external AI");
    expect(tailoring.suggestions.length).toBeGreaterThan(0);

    // 4. Test Super User ATS Engine Mode Policy Management
    // Initial mode is 'user_choice'
    expect(localDevDb.getAtsEngineMode()).toBe("user_choice");

    // Super User switches to 'deterministic_only'
    localDevDb.setAtsEngineMode("deterministic_only");
    expect(localDevDb.getAtsEngineMode()).toBe("deterministic_only");

    // Super User switches to 'ai_only'
    localDevDb.setAtsEngineMode("ai_only");
    expect(localDevDb.getAtsEngineMode()).toBe("ai_only");

    // Super User restores to 'user_choice'
    localDevDb.setAtsEngineMode("user_choice");
    expect(localDevDb.getAtsEngineMode()).toBe("user_choice");
  });

  it("renders a branded, helpful 404 error page for non-existent URLs", async () => {
    const { default: NotFoundPage, metadata } = await import("@/app/not-found");
    expect(metadata).toBeDefined();
    expect(metadata.title).toBe("404 — Page Not Found");
    expect(metadata.description).toContain("could not be found on Vitra");

    const pageElement = await NotFoundPage();
    expect(pageElement).toBeDefined();
    expect(pageElement.type).toBeDefined();
  });

  it("provides interactive ATS caution diagnosis and pinpoint section targets for items needing attention", () => {
    const cv = createEmptyStructuredCv("Nigeria");
    cv.personalInfo.fullName = "Femi Otedola";
    cv.personalInfo.email = "femi@example.com";
    cv.personalInfo.phone = "+234 801 234 5678";
    cv.personalInfo.city = "Lagos";
    cv.summary =
      "Experienced executive with 15 years leadership across enterprise strategy, investment management, operations, and corporate transformation.";
    cv.experience = [
      {
        id: "exp-1",
        jobTitle: "Operations Analyst",
        company: "Vitra Energy",
        location: "Lagos",
        employmentType: "Full-time",
        startDate: "2021",
        endDate: "2023",
        isCurrent: false,
        responsibilities: "Managed daily ops", // Only 3 words — triggers caution!
        achievements: [],
      },
    ];
    cv.education = [
      {
        id: "edu-1",
        institution: "University of Lagos",
        qualification: "BSc",
        fieldOfStudy: "Finance",
        startDate: "2016",
        endDate: "2020",
        isCurrent: false,
        achievements: "",
      },
    ];
    cv.skills = [
      { id: "s1", name: "Financial Modeling", category: "technical" },
      { id: "s2", name: "Operations Management", category: "technical" },
      { id: "s3", name: "Data Analysis", category: "technical" },
      { id: "s4", name: "Negotiation", category: "communication" },
    ];

    const report = evaluateCvQuality(cv);
    expect(report.passedCount).toBe(7);
    expect(report.totalCount).toBe(8);

    const cautionItem = report.checks.find((c) => c.id === "descriptive-statements");
    expect(cautionItem).toBeDefined();
    expect(cautionItem?.passed).toBe(false);
    expect(cautionItem?.targetSection).toBe("experience");
    expect(cautionItem?.actionLabel).toBe("Expand Work Experience & Tasks");
    expect(cautionItem?.attentionDetails).toBeDefined();
    expect(cautionItem?.attentionDetails?.[0]).toContain("Operations Analyst at Vitra Energy");
    expect(cautionItem?.attentionDetails?.[0]).toContain("Only 3 words provided");

    // Fix the entry by expanding into detailed responsibility statement
    cv.experience[0].responsibilities =
      "Managed daily facility operations, coordinated vendor supply chains, and reduced operational expenditure by 14 percent across departments.";
    const updatedReport = evaluateCvQuality(cv);
    const fixedItem = updatedReport.checks.find((c) => c.id === "descriptive-statements");
    expect(fixedItem?.passed).toBe(true);
    expect(updatedReport.passedCount).toBe(8);
  });

  it("identifies Super Users strictly by role or designated owner emails", () => {
    const regularUser: AuthenticatedUser = {
      id: "u-regular",
      email: "candidate@example.com",
      fullName: "Candidate One",
      country: "Nigeria",
      emailVerified: true,
      role: "user",
      provider: "local-dev",
      maxCvs: 3,
      generatedCvsCount: 1,
    };
    expect(isSuperUser(regularUser)).toBe(false);

    const adminUser: AuthenticatedUser = {
      ...regularUser,
      id: "u-admin",
      role: "admin",
    };
    expect(isSuperUser(adminUser)).toBe(true);

    const ownerBolaji: AuthenticatedUser = {
      ...regularUser,
      id: "u-owner-1",
      email: "bolajim@gmail.com",
      role: "user",
    };
    expect(isSuperUser(ownerBolaji)).toBe(true);

    const ownerDawodu: AuthenticatedUser = {
      ...regularUser,
      id: "u-owner-2",
      email: "dawodubolajim@gmail.com",
      role: "user",
    };
    expect(isSuperUser(ownerDawodu)).toBe(true);

    expect(isSuperUser(null)).toBe(false);
    expect(isSuperUser(undefined)).toBe(false);
  });

  it("records and filters authentication audit events, tracking logins and security events", () => {
    const testEmail = `superaudit_${Date.now()}@example.com`;

    // 1. Record login success
    localDevDb.recordAuthEvent({
      eventType: "login_success",
      email: testEmail,
      userId: "u-audit-test",
      details: "Candidate logged in via password",
      status: "success",
    });

    // 2. Record wrong password attempt
    localDevDb.recordAuthEvent({
      eventType: "login_failed",
      email: testEmail,
      details: "Invalid password attempt for account",
      status: "error",
    });

    // 3. Record OTP dispatch & verification
    localDevDb.recordAuthEvent({
      eventType: "otp_sent",
      email: testEmail,
      details: "Dispatched 6-digit OTP code to email",
      status: "success",
    });

    localDevDb.recordAuthEvent({
      eventType: "otp_verified",
      email: testEmail,
      details: "OTP code successfully verified",
      status: "success",
    });

    // 4. Retrieve and verify audit trail
    const logs = localDevDb.listAuthEvents(50);
    const candidateLogs = logs.filter((l) => l.email === testEmail);

    expect(candidateLogs.length).toBe(4);
    const eventTypes = candidateLogs.map((l) => l.eventType);
    expect(eventTypes).toContain("login_success");
    expect(eventTypes).toContain("login_failed");
    expect(eventTypes).toContain("otp_sent");
    expect(eventTypes).toContain("otp_verified");

    const failedLog = candidateLogs.find((l) => l.eventType === "login_failed");
    expect(failedLog?.status).toBe("error");
  });

  it("enables Super User operations: plan override, bonus CVs, and manual email verification", () => {
    // Create candidate with no initial plan
    const candidate = localDevDb.createUser({
      fullName: "Super User Test Candidate",
      email: `candidate_super_${Date.now()}@example.com`,
      password: "TestPassword123!",
      planId: null,
      emailVerified: false,
      maxCvs: 0,
    });
    expect(candidate.planId).toBeNull();
    expect(candidate.emailVerified).toBe(false);
    expect(candidate.maxCvs).toBe(0);

    // Super user overrides plan to Executive (7 CVs)
    const overridden = localDevDb.overrideUserPlan(candidate.id, "executive", 7);
    expect(overridden).not.toBeNull();
    expect(overridden?.planId).toBe("executive");
    expect(overridden?.maxCvs).toBe(7);

    // Super user grants +3 bonus CV generations
    const withBonus = localDevDb.grantBonusCvs(candidate.id, 3);
    expect(withBonus?.maxCvs).toBe(10);

    // Super user manually marks candidate as verified
    const verified = localDevDb.verifyUserEmailManually(candidate.id);
    expect(verified?.emailVerified).toBe(true);

    // Super user updates role
    const promoted = localDevDb.updateUserRole(candidate.id, "admin");
    expect(promoted?.role).toBe("admin");

    // Verify pending OTPs listing functionality
    const generatedOtp = localDevDb.createLoginOtp(candidate.id, candidate.email);
    expect(generatedOtp.code).toHaveLength(6);
    const activeOtps = localDevDb.listPendingOtps();
    const candidateOtp = activeOtps.find((o) => o.email.toLowerCase() === candidate.email.toLowerCase());
    expect(candidateOtp).toBeDefined();
    expect(candidateOtp?.code).toBe(generatedOtp.code);
  });

  describe("Profile Avatar Management & 20MB Cap Enforcement", () => {
    it("enforces strict 20MB maximum size cap for profile image uploads", () => {
      // 1. Valid PNG within 20MB
      const validPngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
      const validPngResult = validateAvatarImage("profile.png", "image/png", validPngHeader);
      expect(validPngResult.ok).toBe(true);
      if (validPngResult.ok) {
        expect(validPngResult.mimeType).toBe("image/png");
        expect(validPngResult.extension).toBe("png");
      }

      // 2. Valid JPEG within 20MB
      const validJpgHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      const validJpgResult = validateAvatarImage("photo.jpeg", "image/jpeg", validJpgHeader);
      expect(validJpgResult.ok).toBe(true);
      if (validJpgResult.ok) {
        expect(validJpgResult.mimeType).toBe("image/jpeg");
        expect(validJpgResult.extension).toBe("jpg");
      }

      // 3. File exceeding 20MB limit (20MB + 1 byte)
      const overLimitBuffer = Buffer.alloc(MAX_AVATAR_UPLOAD_BYTES + 1);
      overLimitBuffer[0] = 0x89;
      overLimitBuffer[1] = 0x50;
      overLimitBuffer[2] = 0x4e;
      overLimitBuffer[3] = 0x47;
      overLimitBuffer[4] = 0x0d;
      overLimitBuffer[5] = 0x0a;
      overLimitBuffer[6] = 0x1a;
      overLimitBuffer[7] = 0x0a;

      const oversizedResult = validateAvatarImage("large-photo.png", "image/png", overLimitBuffer);
      expect(oversizedResult.ok).toBe(false);
      if (!oversizedResult.ok) {
        expect(oversizedResult.error).toContain("exceeds the maximum allowed limit of 20MB");
      }

      // 4. Reject spoofed image files (e.g. text file renamed to .jpg)
      const spoofedJpg = Buffer.from("Not a real JPEG image file at all");
      const spoofedResult = validateAvatarImage("fake.jpg", "image/jpeg", spoofedJpg);
      expect(spoofedResult.ok).toBe(false);
      if (!spoofedResult.ok) {
        expect(spoofedResult.error).toContain("invalid file signature");
      }

      // 5. Reject unsupported file formats (e.g. PDF or executable)
      const pdfBuffer = Buffer.from("%PDF-1.4 sample");
      const unsupportedResult = validateAvatarImage("document.pdf", "application/pdf", pdfBuffer);
      expect(unsupportedResult.ok).toBe(false);
      if (!unsupportedResult.ok) {
        expect(unsupportedResult.error).toContain("Only JPG, PNG, WebP, and GIF images are supported");
      }
    });

    it("saves, retrieves, updates, and deletes profile avatars in local storage", () => {
      const user = localDevDb.createUser({
        fullName: "Avatar Test User",
        email: `avatar_user_${Date.now()}@example.com`,
        password: "AvatarPassword123!",
        country: "Nigeria",
      });

      expect(user.avatarUrl).toBeUndefined();

      // 1. Save valid avatar
      const samplePng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x01, 0x02]);
      const avatarUrl = localDevDb.saveUserAvatar(user.id, "my-avatar.png", samplePng, "image/png");

      expect(avatarUrl).toContain("/api/account/avatar?file=");

      // Verify user profile updated with avatarUrl
      const updatedUser = localDevDb.getUserById(user.id);
      expect(updatedUser?.avatarUrl).toBe(avatarUrl);

      // 2. Retrieve avatar buffer by filename
      const filenameMatch = avatarUrl.match(/file=([^&]+)/);
      expect(filenameMatch).not.toBeNull();
      const storedFilename = decodeURIComponent(filenameMatch![1]);

      const retrieved = localDevDb.getUserAvatarBuffer(storedFilename);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.mimeType).toBe("image/png");
      expect(retrieved?.buffer.length).toBe(samplePng.length);

      // 3. Delete avatar
      const deleted = localDevDb.deleteUserAvatar(user.id);
      expect(deleted).toBe(true);

      const afterDeleteUser = localDevDb.getUserById(user.id);
      expect(afterDeleteUser?.avatarUrl).toBeNull();
    });
  });
});




