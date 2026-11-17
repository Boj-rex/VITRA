import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { getSystemStatus, isLocalDevModeAllowed, isSupabaseConfigured } from "@/lib/config/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { localDevDb } from "@/lib/data/local-dev-store";
import type {
  CareerProfile,
  CvAnalysisResult,
  JobTailoringResult,
  StructuredCvContent,
} from "@/types/cv";
import { structuredCvContentSchema } from "@/lib/validation/cv-schemas";

const ANTI_FABRICATION_SYSTEM_PROMPT = `You are Vitra's professional CV writing assistant.
STRICT ACCURACY RULES (NON-NEGOTIABLE):
1. Use ONLY factual information supplied by the user or extracted from their CV.
2. NEVER invent employers, job titles, qualifications, schools, employment dates, or certifications.
3. NEVER invent achievements or numerical performance results (percentages, revenue figures, team sizes) unless explicitly provided by the user.
4. NEVER claim the user possesses a skill they did not supply or confirm.
5. If critical details are missing, identify them clearly instead of making them up.
6. Write in clear, natural, professional English suitable for Nigerian and international employers.
7. Output ONLY valid JSON matching the requested schema.`;

export type AiServiceResult<T> =
  | { ok: true; configured: true; data: T; model: string; provider: "gemini" | "openai" }
  | { ok: false; configured: boolean; error: string; rateLimited?: boolean };

async function checkAndLogUsage(
  userId: string,
  operation: string,
  status: "success" | "error" | "rate_limited" = "success",
  tokens = { prompt: 0, completion: 0 }
): Promise<{ allowed: boolean; remaining: number }> {
  const { dailyAiLimit, aiModel } = getSystemStatus();

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);

      const { count } = await supabase
        .from("ai_usage_logs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "success")
        .gte("created_at", todayStart.toISOString());

      const used = count || 0;
      if (used >= dailyAiLimit && status === "success") {
        await supabase.from("ai_usage_logs").insert({
          user_id: userId,
          operation,
          model: aiModel,
          prompt_tokens: 0,
          completion_tokens: 0,
          status: "rate_limited",
        });
        return { allowed: false, remaining: 0 };
      }

      if (status !== "success" || tokens.prompt > 0 || tokens.completion > 0) {
        await supabase.from("ai_usage_logs").insert({
          user_id: userId,
          operation,
          model: aiModel,
          prompt_tokens: tokens.prompt,
          completion_tokens: tokens.completion,
          status,
        });
      }

      return { allowed: true, remaining: Math.max(0, dailyAiLimit - used) };
    }
  }

  if (isLocalDevModeAllowed()) {
    const used = localDevDb.countAiUsageToday(userId);
    if (used >= dailyAiLimit && status === "success") {
      localDevDb.logAiUsage({
        userId,
        operation,
        model: aiModel,
        status: "rate_limited",
      });
      return { allowed: false, remaining: 0 };
    }
    if (status !== "success" || tokens.prompt > 0 || tokens.completion > 0) {
      localDevDb.logAiUsage({ userId, operation, model: aiModel, status });
    }
    return { allowed: true, remaining: Math.max(0, dailyAiLimit - used) };
  }

  return { allowed: true, remaining: dailyAiLimit };
}

function extractJsonText(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }
  return trimmed;
}

async function runStructuredAi<T>(
  userId: string,
  operation: string,
  userPrompt: string,
  schema: z.ZodType<T>
): Promise<AiServiceResult<T>> {
  const status = getSystemStatus();
  if (!status.aiConfigured || status.activeAiProvider === "none") {
    return {
      ok: false,
      configured: false,
      error:
        "No AI API key is configured on the server. Add GEMINI_API_KEY (or OPENAI_API_KEY) in .env.local to enable AI writing assistance.",
    };
  }

  const quota = await checkAndLogUsage(userId, operation);
  if (!quota.allowed) {
    return {
      ok: false,
      configured: true,
      rateLimited: true,
      error: `Daily AI request limit (${status.dailyAiLimit} requests) reached to ensure high service availability. Please try again tomorrow or edit your CV directly.`,
    };
  }

  try {
    let rawContent = "";
    let promptTokens = 1;
    let completionTokens = 1;

    if (status.activeAiProvider === "gemini") {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: status.geminiModel,
        contents: userPrompt,
        config: {
          systemInstruction: ANTI_FABRICATION_SYSTEM_PROMPT,
          temperature: 0.25,
          responseMimeType: "application/json",
          abortSignal: AbortSignal.timeout(25000),
        },
      });
      rawContent = response.text || "";
      promptTokens = response.usageMetadata?.promptTokenCount || 1;
      completionTokens = response.usageMetadata?.candidatesTokenCount || 1;
    } else {
      const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        timeout: 25000,
        maxRetries: 1,
      });
      const completion = await client.chat.completions.create({
        model: status.openAiModel,
        temperature: 0.25,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: ANTI_FABRICATION_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      });
      rawContent = completion.choices[0]?.message?.content || "";
      promptTokens = completion.usage?.prompt_tokens || 1;
      completionTokens = completion.usage?.completion_tokens || 1;
    }

    if (!rawContent) {
      await checkAndLogUsage(userId, operation, "error");
      return { ok: false, configured: true, error: "AI returned an empty response. Please try again." };
    }

    const parsedJson = JSON.parse(extractJsonText(rawContent));
    const validated = schema.safeParse(parsedJson);
    if (!validated.success) {
      await checkAndLogUsage(userId, operation, "error");
      return {
        ok: false,
        configured: true,
        error: "AI response did not pass schema validation. Please retry.",
      };
    }

    await checkAndLogUsage(userId, operation, "success", {
      prompt: promptTokens,
      completion: completionTokens,
    });

    return {
      ok: true,
      configured: true,
      data: validated.data,
      model: status.aiModel,
      provider: status.activeAiProvider,
    };
  } catch (err) {
    await checkAndLogUsage(userId, operation, "error");
    const msg = err instanceof Error ? err.message : "Unexpected AI request failure.";
    return { ok: false, configured: true, error: msg };
  }
}

const summarySchema = z.object({
  summary: z.string().min(20).max(1200),
  missingDetailsNote: z.string().default(""),
});

export async function generateProfessionalSummary(
  userId: string,
  input: {
    careerProfile: CareerProfile;
    targetRole: string;
    background: string;
    strengths: string;
    interests: string;
    relevantExperience: string;
  }
) {
  const prompt = `Generate a concise 2-4 sentence professional CV summary strictly from these user-supplied facts.
Return JSON: {"summary": string, "missingDetailsNote": string}

Career profile: ${input.careerProfile}
Target role: ${input.targetRole}
Background: ${input.background}
Strengths: ${input.strengths}
Career interests: ${input.interests}
Relevant experience/training: ${input.relevantExperience}

Do not invent years of experience, employers, degrees or metrics not stated above.`;

  return runStructuredAi(userId, "summary-generation", prompt, summarySchema);
}

const improveWorkSchema = z.object({
  improvedResponsibilities: z.string().min(10).max(1800),
  suggestedAchievements: z.array(z.string().min(8).max(400)).max(5),
  clarificationQuestions: z.array(z.string()).default([]),
});

export async function improveWorkDescription(
  userId: string,
  input: {
    jobTitle: string;
    company: string;
    rawDescription: string;
    existingAchievements: string[];
  }
) {
  const prompt = `Transform the user's plain description into clear, professional CV statements without inventing any facts, duties, or numerical metrics.
Return JSON: {"improvedResponsibilities": string, "suggestedAchievements": string[], "clarificationQuestions": string[]}

Role: ${input.jobTitle} at ${input.company}
User's description: ${input.rawDescription}
Existing achievements provided by user: ${input.existingAchievements.join(" | ") || "None"}

If metrics are missing, ask in clarificationQuestions rather than inventing numbers.`;

  return runStructuredAi(userId, "work-improvement", prompt, improveWorkSchema);
}

const grammarSchema = z.object({
  correctedText: z.string().min(1),
  notes: z.array(z.string()).default([]),
});

export async function correctGrammarAndClarity(userId: string, text: string) {
  const prompt = `Correct grammar, spelling and sentence clarity while keeping the exact factual meaning intact.
Return JSON: {"correctedText": string, "notes": string[]}

Text:
${text}`;

  return runStructuredAi(userId, "grammar-correction", prompt, grammarSchema);
}

const skillSuggestionSchema = z.object({
  recommendedSkills: z.array(
    z.object({
      name: z.string().min(1).max(60),
      category: z.enum([
        "technical",
        "digital",
        "communication",
        "leadership",
        "administrative",
        "industry",
        "languages",
      ]),
      reason: z.string(),
    })
  ),
});

export async function suggestSkillsFromExperience(
  userId: string,
  cv: StructuredCvContent
) {
  const prompt = `Based strictly on the user's stated experience, education and projects below, identify up to 8 relevant skills implied by their actual work (which the user will review and confirm before adding).
Return JSON: {"recommendedSkills": [{"name": string, "category": "technical"|"digital"|"communication"|"leadership"|"administrative"|"industry"|"languages", "reason": string}]}

Target role: ${cv.personalInfo.professionalTitle || cv.summaryContext?.targetRole || "General"}
Education: ${cv.education.map((e) => `${e.qualification} ${e.fieldOfStudy}`).join("; ")}
Experience: ${cv.experience.map((e) => `${e.jobTitle}: ${e.responsibilities}`).join("; ")}
Alternative Experience: ${cv.alternativeExperience.map((a) => `${a.title}: ${a.description}`).join("; ")}
Projects: ${cv.projects.map((p) => `${p.title}: ${p.description}`).join("; ")}
Already listed skills (do not repeat): ${cv.skills.map((s) => s.name).join(", ")}`;

  return runStructuredAi(userId, "skills-suggestion", prompt, skillSuggestionSchema);
}

const cvAnalysisSchema = z.object({
  overallSummary: z.string(),
  strengths: z.array(z.string()),
  missingInformation: z.array(z.string()),
  recommendations: z.array(
    z.object({
      id: z.string(),
      section: z.string(),
      category: z.enum([
        "grammar",
        "spelling",
        "clarity",
        "tone",
        "repetition",
        "weak-description",
        "missing-section",
        "formatting",
        "organization",
        "ats-readability",
      ]),
      issue: z.string(),
      whyItMatters: z.string(),
      originalText: z.string(),
      suggestedReplacement: z.string(),
    })
  ),
});

export async function analyzeCvContentWithAi(
  userId: string,
  cv: StructuredCvContent
): Promise<AiServiceResult<Omit<CvAnalysisResult, "atsReadabilityChecks" | "generatedAt">>> {
  const prompt = `Review this structured CV for grammar, spelling, sentence clarity, professional tone, repetition, weak descriptions, missing relevant sections, formatting consistency, organization and ATS readability.
Never invent credentials or metrics in suggestedReplacement. If information is missing, note it in missingInformation or ask the user to supply it.
Return JSON:
{
  "overallSummary": string,
  "strengths": string[],
  "missingInformation": string[],
  "recommendations": [
    {
      "id": string,
      "section": string,
      "category": "grammar"|"spelling"|"clarity"|"tone"|"repetition"|"weak-description"|"missing-section"|"formatting"|"organization"|"ats-readability",
      "issue": string,
      "whyItMatters": string,
      "originalText": string,
      "suggestedReplacement": string
    }
  ]
}

CV JSON:
${JSON.stringify(cv)}`;

  const res = await runStructuredAi(userId, "cv-analysis", prompt, cvAnalysisSchema);
  if (!res.ok) return res;
  return {
    ...res,
    data: {
      overallSummary: res.data.overallSummary,
      strengths: res.data.strengths,
      missingInformation: res.data.missingInformation,
      recommendations: res.data.recommendations.map((r) => ({
        ...r,
        status: "pending" as const,
      })),
    },
  };
}

const jobTailoringSchema = z.object({
  requiredQualifications: z.array(z.string()),
  importantKeywords: z.array(z.string()),
  matchedSkills: z.array(z.string()),
  matchedExperience: z.array(z.string()),
  missingOrUnconfirmed: z.array(z.string()),
  suggestions: z.array(
    z.object({
      id: z.string(),
      targetSection: z.string(),
      rationale: z.string(),
      originalText: z.string(),
      suggestedText: z.string(),
    })
  ),
});

export async function tailorCvToJobWithAi(
  userId: string,
  input: {
    cv: StructuredCvContent;
    jobTitle: string;
    company: string;
    jobDescription: string;
  }
): Promise<AiServiceResult<JobTailoringResult>> {
  const prompt = `Compare the user's CV against the target job description.
Extract job requirements and keywords, identify matched skills/experience already present, list missing or unconfirmed requirements separately, and suggest truthful phrasing alignments using ONLY the user's real history.
NEVER fabricate qualifications or experience.
Return JSON:
{
  "requiredQualifications": string[],
  "importantKeywords": string[],
  "matchedSkills": string[],
  "matchedExperience": string[],
  "missingOrUnconfirmed": string[],
  "suggestions": [{"id": string, "targetSection": string, "rationale": string, "originalText": string, "suggestedText": string}]
}

Target Role: ${input.jobTitle} at ${input.company}
Job Description:
${input.jobDescription}

User CV:
${JSON.stringify(input.cv)}`;

  const res = await runStructuredAi(userId, "job-tailoring", prompt, jobTailoringSchema);
  if (!res.ok) return res;

  return {
    ...res,
    data: {
      jobTitle: input.jobTitle,
      company: input.company,
      ...res.data,
      suggestions: res.data.suggestions.map((s) => ({
        ...s,
        status: "pending" as const,
      })),
      transparencyNotice:
        "Suggestions align your existing, truthful experience to the role wording. Missing requirements are listed for your awareness and are never fabricated.",
    },
  };
}

const parsedCvAiSchema = z.object({
  structured: structuredCvContentSchema,
  uncertainFields: z.array(z.string()).default([]),
});

export async function parseCvTextWithAi(userId: string, rawText: string) {
  const prompt = `Extract structured CV data faithfully from the raw document text below without inventing or discarding information.
If any detail is ambiguous or absent, leave it empty and add a brief note in uncertainFields.
Return JSON: {"structured": <StructuredCvContent>, "uncertainFields": string[]}

Raw CV Text:
${rawText.slice(0, 12000)}`;

  return runStructuredAi(userId, "cv-extraction", prompt, parsedCvAiSchema);
}
