export interface SystemStatus {
  supabaseConfigured: boolean;
  supabaseAdminConfigured: boolean;
  openAiConfigured: boolean;
  geminiConfigured: boolean;
  aiConfigured: boolean;
  activeAiProvider: "gemini" | "openai" | "none";
  googleAuthEnabled: boolean;
  localDevModeActive: boolean;
  openAiModel: string;
  geminiModel: string;
  aiModel: string;
  dailyAiLimit: number;
  maxUploadBytes: number;
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return Boolean(url && anon && /^https?:\/\//i.test(url));
}

export function isSupabaseAdminConfigured(): boolean {
  return isSupabaseConfigured() && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export function isOpenAiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function resolveAiProvider(): "gemini" | "openai" | "none" {
  const preferred = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (preferred === "gemini") return isGeminiConfigured() ? "gemini" : "none";
  if (preferred === "openai") return isOpenAiConfigured() ? "openai" : "none";

  if (isGeminiConfigured()) return "gemini";
  if (isOpenAiConfigured()) return "openai";
  return "none";
}

export function isLocalDevModeAllowed(): boolean {
  if (process.env.VITRA_ALLOW_LOCAL_DEV_MODE === "false") return false;
  return true;
}

export function getSystemStatus(): SystemStatus {
  const supabaseConfigured = isSupabaseConfigured();
  const geminiConfigured = isGeminiConfigured();
  const openAiConfigured = isOpenAiConfigured();
  const activeAiProvider = resolveAiProvider();
  const geminiModel = process.env.GEMINI_MODEL?.trim() || "gemini-3.1-flash-lite";
  const openAiModel = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

  return {
    supabaseConfigured,
    supabaseAdminConfigured: isSupabaseAdminConfigured(),
    openAiConfigured,
    geminiConfigured,
    aiConfigured: activeAiProvider !== "none",
    activeAiProvider,
    googleAuthEnabled:
      supabaseConfigured && process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH === "true",
    localDevModeActive: !supabaseConfigured && isLocalDevModeAllowed(),
    openAiModel,
    geminiModel,
    aiModel: activeAiProvider === "gemini" ? geminiModel : openAiModel,
    dailyAiLimit: Number(process.env.VITRA_DAILY_AI_LIMIT || 40) || 40,
    maxUploadBytes: Number(process.env.VITRA_MAX_UPLOAD_BYTES || 10 * 1024 * 1024) || 10 * 1024 * 1024,
  };
}
