import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  analyzeCvContentWithAi,
  correctGrammarAndClarity,
  generateProfessionalSummary,
  improveWorkDescription,
  suggestSkillsFromExperience,
  tailorCvToJobWithAi,
} from "@/lib/ai/openai-service";
import {
  compareCvWithJobDescription,
  evaluateCvQuality,
  analyzeCvContentHardCoded,
  tailorCvToJobHardCoded,
} from "@/lib/cv/ats-checker";
import { localDevDb } from "@/lib/data/local-dev-store";
import { structuredCvContentSchema, careerProfileSchema } from "@/lib/validation/cv-schemas";
import { cvService } from "@/services/cv-service";
import type { CvAnalysisResult } from "@/types/cv";

const aiActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("summary"),
    careerProfile: careerProfileSchema,
    targetRole: z.string().trim().max(200),
    background: z.string().trim().max(800),
    strengths: z.string().trim().max(600),
    interests: z.string().trim().max(500),
    relevantExperience: z.string().trim().max(800),
  }),
  z.object({
    action: z.literal("improve-work"),
    jobTitle: z.string().trim().min(1).max(140),
    company: z.string().trim().max(140).default(""),
    rawDescription: z.string().trim().min(5).max(2000),
    existingAchievements: z.array(z.string()).default([]),
  }),
  z.object({
    action: z.literal("grammar"),
    text: z.string().trim().min(3).max(3000),
  }),
  z.object({
    action: z.literal("suggest-skills"),
    cv: structuredCvContentSchema,
  }),
  z.object({
    action: z.literal("analyze-cv"),
    cvId: z.string().min(1),
    engine: z.enum(["ai", "hardcoded"]).optional(),
  }),
  z.object({
    action: z.literal("tailor-job"),
    cvId: z.string().min(1),
    jobTitle: z.string().trim().min(2).max(140),
    company: z.string().trim().max(140).default(""),
    jobDescription: z.string().trim().min(20).max(8000),
    engine: z.enum(["ai", "hardcoded"]).optional(),
  }),
]);

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = aiActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message || "Invalid AI request payload." },
        { status: 400 }
      );
    }

    const payload = parsed.data;

    if (payload.action === "summary") {
      const res = await generateProfessionalSummary(user.id, payload);
      return NextResponse.json(res, { status: res.ok ? 200 : res.configured ? 502 : 503 });
    }

    if (payload.action === "improve-work") {
      const res = await improveWorkDescription(user.id, payload);
      return NextResponse.json(res, { status: res.ok ? 200 : res.configured ? 502 : 503 });
    }

    if (payload.action === "grammar") {
      const res = await correctGrammarAndClarity(user.id, payload.text);
      return NextResponse.json(res, { status: res.ok ? 200 : res.configured ? 502 : 503 });
    }

    if (payload.action === "suggest-skills") {
      const res = await suggestSkillsFromExperience(user.id, payload.cv);
      return NextResponse.json(res, { status: res.ok ? 200 : res.configured ? 502 : 503 });
    }

    const systemAtsMode = localDevDb.getAtsEngineMode();

    if (payload.action === "analyze-cv") {
      const cv = await cvService.getCv(payload.cvId, user.id);
      if (!cv) {
        return NextResponse.json({ ok: false, error: "CV not found." }, { status: 404 });
      }

      const useHardcoded =
        systemAtsMode === "deterministic_only" ||
        (systemAtsMode === "user_choice" && payload.engine === "hardcoded");

      if (useHardcoded) {
        const hardcodedAnalysis = analyzeCvContentHardCoded(cv.structuredContent);
        await cvService.saveAnalysis(cv.id, user.id, hardcodedAnalysis);
        return NextResponse.json({
          ok: true,
          configured: true,
          engine: "hardcoded",
          systemAtsMode,
          data: hardcodedAnalysis,
        });
      }

      const quality = evaluateCvQuality(cv.structuredContent);
      const aiRes = await analyzeCvContentWithAi(user.id, cv.structuredContent);

      if (!aiRes.ok) {
        // Return deterministic hard-coded analysis when AI is not configured or fails
        const fallbackAnalysis = analyzeCvContentHardCoded(cv.structuredContent);
        await cvService.saveAnalysis(cv.id, user.id, fallbackAnalysis);
        return NextResponse.json(
          {
            ok: true,
            configured: false,
            engine: "hardcoded_fallback",
            systemAtsMode,
            warning: aiRes.error || "AI engine unavailable; deterministic ATS rules applied.",
            data: fallbackAnalysis,
            fallbackQualityReport: quality,
          },
          { status: 200 }
        );
      }

      const fullAnalysis: CvAnalysisResult = {
        ...aiRes.data,
        atsReadabilityChecks: quality.checks.map((c) => ({
          label: c.label,
          passed: c.passed,
          note: c.note,
        })),
        generatedAt: new Date().toISOString(),
      };

      await cvService.saveAnalysis(cv.id, user.id, fullAnalysis);
      return NextResponse.json({
        ok: true,
        configured: true,
        engine: "ai",
        systemAtsMode,
        data: fullAnalysis,
      });
    }

    if (payload.action === "tailor-job") {
      const cv = await cvService.getCv(payload.cvId, user.id);
      if (!cv) {
        return NextResponse.json({ ok: false, error: "CV not found." }, { status: 404 });
      }

      const deterministicComparison = compareCvWithJobDescription(
        cv.structuredContent,
        payload.jobDescription
      );

      const useHardcoded =
        systemAtsMode === "deterministic_only" ||
        (systemAtsMode === "user_choice" && payload.engine === "hardcoded");

      if (useHardcoded) {
        const hardcodedTailoring = tailorCvToJobHardCoded(cv.structuredContent, {
          jobTitle: payload.jobTitle,
          company: payload.company,
          jobDescription: payload.jobDescription,
        });

        await cvService.saveJobDescription({
          userId: user.id,
          cvId: cv.id,
          jobTitle: payload.jobTitle,
          company: payload.company,
          description: payload.jobDescription,
          extractedRequirements: hardcodedTailoring,
        });

        return NextResponse.json({
          ok: true,
          configured: true,
          engine: "hardcoded",
          systemAtsMode,
          data: hardcodedTailoring,
          deterministicComparison,
        });
      }

      const aiRes = await tailorCvToJobWithAi(user.id, {
        cv: cv.structuredContent,
        jobTitle: payload.jobTitle,
        company: payload.company,
        jobDescription: payload.jobDescription,
      });

      if (!aiRes.ok) {
        // Fall back gracefully to hardcoded deterministic tailoring
        const hardcodedTailoring = tailorCvToJobHardCoded(cv.structuredContent, {
          jobTitle: payload.jobTitle,
          company: payload.company,
          jobDescription: payload.jobDescription,
        });

        await cvService.saveJobDescription({
          userId: user.id,
          cvId: cv.id,
          jobTitle: payload.jobTitle,
          company: payload.company,
          description: payload.jobDescription,
          extractedRequirements: hardcodedTailoring,
        });

        return NextResponse.json({
          ok: true,
          configured: false,
          engine: "hardcoded_fallback",
          systemAtsMode,
          warning: aiRes.error || "AI service unavailable; deterministic rule matching applied.",
          data: hardcodedTailoring,
          deterministicComparison,
        });
      }

      await cvService.saveJobDescription({
        userId: user.id,
        cvId: cv.id,
        jobTitle: payload.jobTitle,
        company: payload.company,
        description: payload.jobDescription,
        extractedRequirements: aiRes.data,
      });

      return NextResponse.json({
        ok: true,
        configured: true,
        engine: "ai",
        systemAtsMode,
        data: aiRes.data,
        deterministicComparison,
      });
    }

    return NextResponse.json({ ok: false, error: "Unsupported AI action." }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

