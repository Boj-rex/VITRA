import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import os from "node:os";
import type {
  CvAnalysisResult,
  CvEditorSettings,
  CvRecord,
  JobTailoringResult,
  StructuredCvContent,
} from "@/types/cv";

export interface LocalUser {
  id: string;
  fullName: string;
  email: string;
  country: string;
  passwordHash: string;
  emailVerified: boolean;
  role: "user" | "admin";
  planId?: "starter" | "pro" | "executive" | null;
  maxCvs: number;
  generatedCvsCount?: number;
  planPurchasedAt?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LocalPaymentTransaction {
  id: string;
  userId: string;
  reference: string;
  planId: "starter" | "pro" | "executive";
  amount: number;
  currency: string;
  status: "success" | "pending" | "failed";
  maxCvs: number;
  createdAt: string;
}

export interface LocalUploadRecord {
  id: string;
  userId: string;
  cvId: string | null;
  originalFilePath: string;
  originalFileName: string;
  fileType: "pdf" | "docx";
  fileSize: number;
  extractedText: string;
  processingStatus: "pending" | "extracted" | "reviewed" | "failed";
  createdAt: string;
}

export interface LocalAnalysisRecord {
  id: string;
  cvId: string;
  userId: string;
  analysisResult: CvAnalysisResult;
  createdAt: string;
}

export interface LocalJobDescriptionRecord {
  id: string;
  userId: string;
  cvId: string | null;
  jobTitle: string;
  company: string;
  description: string;
  extractedRequirements: Partial<JobTailoringResult>;
  createdAt: string;
}

export interface LocalCvVersionRecord {
  id: string;
  cvId: string;
  userId: string;
  versionNumber: number;
  label: string;
  templateId: CvRecord["templateId"];
  structuredContent: StructuredCvContent;
  createdAt: string;
}

export interface LocalAiLog {
  id: string;
  userId: string;
  operation: string;
  model: string;
  status: "success" | "error" | "rate_limited";
  createdAt: string;
}

export type AtsEngineMode = "user_choice" | "deterministic_only" | "ai_only";

export interface LocalStoreData {
  users: LocalUser[];
  cvs: CvRecord[];
  cvVersions: LocalCvVersionRecord[];
  uploads: LocalUploadRecord[];
  analyses: LocalAnalysisRecord[];
  jobDescriptions: LocalJobDescriptionRecord[];
  aiLogs: LocalAiLog[];
  transactions: LocalPaymentTransaction[];
  passwordResetTokens: { token: string; userId: string; expiresAt: string }[];
  loginOtps?: LocalLoginOtp[];
  authLogs?: LocalAuthAuditLog[];
  systemSettings?: {
    atsEngineMode?: AtsEngineMode;
    updatedAt?: string;
  };
}

export interface LocalAuthAuditLog {
  id: string;
  timestamp: string;
  eventType:
  | "login_success"
  | "login_failed"
  | "otp_sent"
  | "otp_verified"
  | "otp_failed"
  | "signup"
  | "password_reset_request"
  | "password_reset_success"
  | "plan_activated"
  | "admin_action";
  email: string;
  userId?: string | null;
  details?: string;
  status: "success" | "warning" | "error";
}

export interface LocalLoginOtp {
  userId: string;
  email: string;
  code: string;
  expiresAt: string;
  attempts: number;
  lastSentAt: string;
}

let cachedDataRoot: string | null = null;

function resolveDataRoot(): string {
  // 1. Explicit override via env variable
  if (process.env.VITRA_DEV_DATA_DIR?.trim()) {
    return process.env.VITRA_DEV_DATA_DIR.trim();
  }

  // 2. Serverless detection (Vercel, AWS Lambda, Netlify, etc.)
  // On AWS Lambda / Vercel, process.cwd() is /var/task (strictly read-only).
  // The only writable filesystem path is os.tmpdir() (/tmp).
  const isServerless =
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) ||
    Boolean(process.env.LAMBDA_TASK_ROOT) ||
    Boolean(process.env.NETLIFY) ||
    process.env.NODE_ENV === "production";

  if (isServerless) {
    return path.join(os.tmpdir(), ".vitra-dev-data");
  }

  // 3. In normal local dev, use process.cwd()/.vitra-dev-data, but verify writability
  const defaultDir = path.join(process.cwd(), ".vitra-dev-data");
  try {
    if (!fs.existsSync(defaultDir)) {
      fs.mkdirSync(defaultDir, { recursive: true });
    }
    return defaultDir;
  } catch {
    // If process.cwd() is read-only or permission is denied, fallback safely to tmpdir
    return path.join(os.tmpdir(), ".vitra-dev-data");
  }
}

function getDataRoot(): string {
  if (!cachedDataRoot) {
    cachedDataRoot = resolveDataRoot();
  }
  return cachedDataRoot;
}

function getStorePath(): string {
  return path.join(getDataRoot(), "store.json");
}

function getUploadsRoot(): string {
  return path.join(getDataRoot(), "uploads");
}

function getAvatarsRoot(): string {
  return path.join(getDataRoot(), "avatars");
}

function ensureStore(): LocalStoreData {
  let dataDir = getDataRoot();
  try {
    if (!fs.existsSync(/*turbopackIgnore: true*/ dataDir)) {
      fs.mkdirSync(/*turbopackIgnore: true*/ dataDir, { recursive: true });
    }
  } catch {
    // Immediate fallback to tmpdir if mkdir fails for any reason (e.g. read-only filesystem)
    dataDir = path.join(os.tmpdir(), ".vitra-dev-data");
    cachedDataRoot = dataDir;
    try {
      if (!fs.existsSync(/*turbopackIgnore: true*/ dataDir)) {
        fs.mkdirSync(/*turbopackIgnore: true*/ dataDir, { recursive: true });
      }
    } catch {
      // Ignore if cannot create
    }
  }

  const uploadsDir = getUploadsRoot();
  try {
    if (!fs.existsSync(/*turbopackIgnore: true*/ uploadsDir)) {
      fs.mkdirSync(/*turbopackIgnore: true*/ uploadsDir, { recursive: true });
    }
  } catch { }

  const avatarsDir = getAvatarsRoot();
  try {
    if (!fs.existsSync(/*turbopackIgnore: true*/ avatarsDir)) {
      fs.mkdirSync(/*turbopackIgnore: true*/ avatarsDir, { recursive: true });
    }
  } catch { }

  const storePath = getStorePath();
  try {
    if (!fs.existsSync(/*turbopackIgnore: true*/ storePath)) {
      const empty: LocalStoreData = {
        users: [],
        cvs: [],
        cvVersions: [],
        uploads: [],
        analyses: [],
        jobDescriptions: [],
        aiLogs: [],
        transactions: [],
        passwordResetTokens: [],
        loginOtps: [],
        authLogs: [],
      };
      fs.writeFileSync(/*turbopackIgnore: true*/ storePath, JSON.stringify(empty, null, 2), "utf8");
      return empty;
    }
    const raw = fs.readFileSync(/*turbopackIgnore: true*/ storePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<LocalStoreData>;
    return {
      users: parsed.users || [],
      cvs: parsed.cvs || [],
      cvVersions: parsed.cvVersions || [],
      uploads: parsed.uploads || [],
      analyses: parsed.analyses || [],
      jobDescriptions: parsed.jobDescriptions || [],
      aiLogs: parsed.aiLogs || [],
      transactions: parsed.transactions || [],
      passwordResetTokens: parsed.passwordResetTokens || [],
      loginOtps: parsed.loginOtps || [],
      authLogs: parsed.authLogs || [],
      systemSettings: parsed.systemSettings || undefined,
    };
  } catch {
    return {
      users: [],
      cvs: [],
      cvVersions: [],
      uploads: [],
      analyses: [],
      jobDescriptions: [],
      aiLogs: [],
      transactions: [],
      passwordResetTokens: [],
      loginOtps: [],
      authLogs: [],
    };
  }
}

function writeStore(data: LocalStoreData) {
  try {
    const storePath = getStorePath();
    fs.writeFileSync(storePath, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("[LocalDevStore] Failed to write store:", err);
  }
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(key, "hex");
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

function getSessionSecret(): string {
  return (
    process.env.VITRA_DEV_SESSION_SECRET?.trim() ||
    "vitra-local-dev-secret-change-in-production"
  );
}

export function signSessionToken(
  userId: string,
  extra?: { email?: string; role?: "user" | "admin" }
): string {
  const payload = Buffer.from(
    JSON.stringify({
      userId,
      email: extra?.email,
      role: extra?.role,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    })
  ).toString("base64url");
  const sig = crypto
    .createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySessionTokenFull(token: string): {
  userId: string;
  email?: string;
  role?: "user" | "admin";
} | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = crypto
    .createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      userId: string;
      email?: string;
      role?: "user" | "admin";
      exp: number;
    };
    if (!decoded.userId || decoded.exp < Date.now()) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function verifySessionToken(token: string): string | null {
  const decoded = verifySessionTokenFull(token);
  return decoded ? decoded.userId : null;
}

export const localDevDb = {
  createUser(input: {
    fullName: string;
    email: string;
    password: string;
    country?: string;
    emailVerified?: boolean;
    planId?: "starter" | "pro" | "executive" | null;
    maxCvs?: number;
  }): LocalUser {
    const data = ensureStore();
    const normalizedEmail = input.email.trim().toLowerCase();
    if (data.users.some((u) => u.email === normalizedEmail)) {
      throw new Error("An account with this email address already exists.");
    }
    const now = new Date().toISOString();
    const isTestEnv = process.env.NODE_ENV === "test";
    const user: LocalUser = {
      id: crypto.randomUUID(),
      fullName: input.fullName.trim(),
      email: normalizedEmail,
      country: input.country?.trim() || "Nigeria",
      passwordHash: hashPassword(input.password),
      emailVerified:
        typeof input.emailVerified === "boolean"
          ? input.emailVerified
          : isTestEnv,
      role: "user",
      planId:
        input.planId !== undefined
          ? input.planId
          : isTestEnv
            ? "pro"
            : null,
      maxCvs:
        typeof input.maxCvs === "number"
          ? input.maxCvs
          : isTestEnv
            ? 6
            : 0,
      generatedCvsCount: 0,
      planPurchasedAt:
        input.planId !== undefined
          ? input.planId ? now : null
          : isTestEnv
            ? now
            : null,
      createdAt: now,
      updatedAt: now,
    };
    data.users.push(user);
    writeStore(data);
    return user;
  },

  authenticateUser(email: string, password: string): LocalUser | null {
    const data = ensureStore();
    const normalizedEmail = email.trim().toLowerCase();
    const user = data.users.find((u) => u.email === normalizedEmail);
    if (!user) return null;
    if (!verifyPassword(password, user.passwordHash)) return null;
    return user;
  },

  getUserById(userId: string): LocalUser | null {
    const data = ensureStore();
    return data.users.find((u) => u.id === userId) || null;
  },

  updateUserProfile(
    userId: string,
    patch: { fullName?: string; country?: string; avatarUrl?: string | null }
  ): LocalUser | null {
    const data = ensureStore();
    const user = data.users.find((u) => u.id === userId);
    if (!user) return null;
    if (patch.fullName !== undefined) user.fullName = patch.fullName.trim();
    if (patch.country !== undefined) user.country = patch.country.trim();
    if (patch.avatarUrl !== undefined) {
      user.avatarUrl = patch.avatarUrl ? patch.avatarUrl.trim() : null;
    }
    user.updatedAt = new Date().toISOString();
    writeStore(data);
    return user;
  },

  saveUserAvatar(userId: string, fileName: string, buffer: Buffer, mimeType: string): string {
    const avatarsDir = getAvatarsRoot();
    if (!fs.existsSync(avatarsDir)) {
      fs.mkdirSync(avatarsDir, { recursive: true });
    }
    // Delete any previous avatar files for this user
    try {
      const files = fs.readdirSync(avatarsDir);
      for (const f of files) {
        if (f.startsWith(`avatar_${userId}_`)) {
          try {
            fs.rmSync(path.join(avatarsDir, f), { force: true });
          } catch { }
        }
      }
    } catch { }

    const ext = path.extname(fileName).toLowerCase() || ".png";
    const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext) ? ext : ".png";
    const filename = `avatar_${userId}_${Date.now()}${safeExt}`;
    fs.writeFileSync(path.join(avatarsDir, filename), buffer);

    const avatarUrl = `/api/account/avatar?file=${encodeURIComponent(filename)}&v=${Date.now()}`;
    this.updateUserProfile(userId, { avatarUrl });
    return avatarUrl;
  },

  deleteUserAvatar(userId: string): boolean {
    const avatarsDir = getAvatarsRoot();
    if (fs.existsSync(avatarsDir)) {
      try {
        const files = fs.readdirSync(avatarsDir);
        for (const f of files) {
          if (f.startsWith(`avatar_${userId}_`)) {
            try {
              fs.rmSync(path.join(avatarsDir, f), { force: true });
            } catch { }
          }
        }
      } catch { }
    }
    this.updateUserProfile(userId, { avatarUrl: null });
    return true;
  },

  getUserAvatarBuffer(filename: string): { buffer: Buffer; mimeType: string } | null {
    // Sanitize filename to prevent directory traversal
    const safe = path.basename(filename);
    const fullPath = path.join(getAvatarsRoot(), safe);
    if (!fs.existsSync(fullPath)) return null;

    const ext = path.extname(safe).toLowerCase();
    const mimeMap: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".gif": "image/gif",
    };
    const mimeType = mimeMap[ext] || "application/octet-stream";
    const buffer = fs.readFileSync(fullPath);
    return { buffer, mimeType };
  },

  updateUserPlan(
    userId: string,
    planId: "starter" | "pro" | "executive",
    maxCvs: number,
    resetUsage = false
  ): LocalUser | null {
    const data = ensureStore();
    const user = data.users.find((u) => u.id === userId);
    if (!user) return null;
    user.planId = planId;
    user.maxCvs = maxCvs;
    if (resetUsage) {
      user.generatedCvsCount = 0;
    }
    user.planPurchasedAt = new Date().toISOString();
    user.updatedAt = new Date().toISOString();
    writeStore(data);
    return user;
  },

  getGeneratedCvsCount(userId: string): number {
    const data = ensureStore();
    const user = data.users.find((u) => u.id === userId);
    const activeCvsCount = (data.cvs || []).filter((c) => c.userId === userId).length;
    return Math.max(user?.generatedCvsCount ?? 0, activeCvsCount);
  },

  recordCvGeneration(userId: string): number {
    const data = ensureStore();
    const user = data.users.find((u) => u.id === userId);
    const activeCvsCount = (data.cvs || []).filter((c) => c.userId === userId).length;
    const current = Math.max(user?.generatedCvsCount ?? 0, activeCvsCount);
    const next = current + 1;
    if (user) {
      user.generatedCvsCount = next;
      user.updatedAt = new Date().toISOString();
      writeStore(data);
    }
    return next;
  },

  recordPayment(tx: {
    userId: string;
    reference: string;
    planId: "starter" | "pro" | "executive";
    amount: number;
    currency: string;
    status: "success" | "pending" | "failed";
    maxCvs: number;
  }): LocalPaymentTransaction {
    const data = ensureStore();
    const item: LocalPaymentTransaction = {
      id: crypto.randomUUID(),
      ...tx,
      createdAt: new Date().toISOString(),
    };
    if (!data.transactions) data.transactions = [];
    data.transactions.push(item);
    writeStore(data);
    return item;
  },

  listPaymentsForUser(userId: string): LocalPaymentTransaction[] {
    const data = ensureStore();
    return (data.transactions || []).filter((t) => t.userId === userId);
  },

  getPaymentByReference(reference: string): LocalPaymentTransaction | null {
    const data = ensureStore();
    return (data.transactions || []).find((t) => t.reference === reference) || null;
  },

  recordAuthEvent(event: {
    eventType: LocalAuthAuditLog["eventType"];
    email: string;
    userId?: string | null;
    details?: string;
    status: "success" | "warning" | "error";
  }): LocalAuthAuditLog {
    const data = ensureStore();
    const item: LocalAuthAuditLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...event,
      email: event.email.trim().toLowerCase(),
    };
    if (!data.authLogs) data.authLogs = [];
    data.authLogs.unshift(item);
    if (data.authLogs.length > 1000) {
      data.authLogs = data.authLogs.slice(0, 1000);
    }
    writeStore(data);
    return item;
  },

  listAuthEvents(limit = 100): LocalAuthAuditLog[] {
    const data = ensureStore();
    return (data.authLogs || []).slice(0, limit);
  },

  listAllTransactions(): Array<LocalPaymentTransaction & { userEmail?: string; userFullName?: string }> {
    const data = ensureStore();
    const usersMap = new Map((data.users || []).map((u) => [u.id, u]));
    return (data.transactions || [])
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((tx) => {
        const u = usersMap.get(tx.userId);
        return {
          ...tx,
          userEmail: u?.email,
          userFullName: u?.fullName,
        };
      });
  },

  listAllUsers(): LocalUser[] {
    const data = ensureStore();
    return (data.users || []).slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  listAllCvs(): Array<CvRecord & { userEmail?: string; userFullName?: string }> {
    const data = ensureStore();
    const usersMap = new Map((data.users || []).map((u) => [u.id, u]));
    return (data.cvs || [])
      .slice()
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .map((c) => {
        const u = usersMap.get(c.userId);
        return {
          ...c,
          userEmail: u?.email,
          userFullName: u?.fullName,
        };
      });
  },

  listSupportInquiries(): any[] {
    try {
      const file = path.join(getDataRoot(), "support-inquiries.json");
      if (fs.existsSync(file)) {
        const raw = fs.readFileSync(file, "utf8");
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          return list.slice().reverse();
        }
      }
    } catch {
      // ignore
    }
    return [];
  },

  listReceiptEmails(): any[] {
    try {
      const file = path.join(getDataRoot(), "receipt-emails.json");
      if (fs.existsSync(file)) {
        const raw = fs.readFileSync(file, "utf8");
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          return list.slice().reverse();
        }
      }
    } catch {
      // ignore
    }
    return [];
  },

  listPendingOtps(): LocalLoginOtp[] {
    const data = ensureStore();
    const now = Date.now();
    return (data.loginOtps || []).filter((o) => new Date(o.expiresAt).getTime() > now);
  },

  updateUserRole(userId: string, role: "user" | "admin"): LocalUser | null {
    const data = ensureStore();
    const user = data.users.find((u) => u.id === userId);
    if (!user) return null;
    user.role = role;
    user.updatedAt = new Date().toISOString();
    writeStore(data);
    return user;
  },

  overrideUserPlan(userId: string, planId: "starter" | "pro" | "executive" | null, maxCvs: number): LocalUser | null {
    const data = ensureStore();
    const user = data.users.find((u) => u.id === userId);
    if (!user) return null;
    user.planId = planId;
    user.maxCvs = maxCvs;
    user.planPurchasedAt = planId ? new Date().toISOString() : null;
    user.updatedAt = new Date().toISOString();
    writeStore(data);
    return user;
  },

  grantBonusCvs(userId: string, bonusCount: number): LocalUser | null {
    const data = ensureStore();
    const user = data.users.find((u) => u.id === userId);
    if (!user) return null;
    user.maxCvs = (user.maxCvs || 0) + bonusCount;
    user.updatedAt = new Date().toISOString();
    writeStore(data);
    return user;
  },

  verifyUserEmailManually(userId: string): LocalUser | null {
    const data = ensureStore();
    const user = data.users.find((u) => u.id === userId);
    if (!user) return null;
    user.emailVerified = true;
    user.updatedAt = new Date().toISOString();
    writeStore(data);
    return user;
  },

  clearAllPayments(resetUserPlans = true): { transactionsCleared: number; usersReset: number } {
    const data = ensureStore();
    const count = (data.transactions || []).length;
    data.transactions = [];

    let usersResetCount = 0;
    if (resetUserPlans && Array.isArray(data.users)) {
      for (const user of data.users) {
        if (user.planId || user.maxCvs > 0 || user.planPurchasedAt || (user.generatedCvsCount ?? 0) > 0) {
          user.planId = null;
          user.maxCvs = 0;
          user.generatedCvsCount = 0;
          user.planPurchasedAt = null;
          user.updatedAt = new Date().toISOString();
          usersResetCount++;
        }
      }
    }

    writeStore(data);

    // Also clear receipt-emails.json if present
    try {
      const receiptEmailsFile = path.join(getDataRoot(), "receipt-emails.json");
      if (fs.existsSync(receiptEmailsFile)) {
        fs.writeFileSync(receiptEmailsFile, "[]\n", "utf8");
      }
    } catch (e) {
      console.error("[Store] Failed to clear receipt-emails.json:", e);
    }

    return { transactionsCleared: count, usersReset: usersResetCount };
  },

  clearPaymentsForUser(userId: string, resetPlan = true): { transactionsCleared: number } {
    const data = ensureStore();
    const beforeCount = (data.transactions || []).length;
    data.transactions = (data.transactions || []).filter((t) => t.userId !== userId);
    const afterCount = data.transactions.length;

    if (resetPlan) {
      const user = data.users.find((u) => u.id === userId);
      if (user) {
        user.planId = null;
        user.maxCvs = 0;
        user.generatedCvsCount = 0;
        user.planPurchasedAt = null;
        user.updatedAt = new Date().toISOString();
      }
    }

    writeStore(data);
    return { transactionsCleared: beforeCount - afterCount };
  },

  createPasswordResetToken(email: string): string | null {
    const data = ensureStore();
    const user = data.users.find((u) => u.email === email.trim().toLowerCase());
    if (!user) return null;
    const token = crypto.randomBytes(24).toString("hex");
    data.passwordResetTokens.push({
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });
    writeStore(data);
    return token;
  },

  resetPasswordWithToken(token: string, newPassword: string): boolean {
    const data = ensureStore();
    const entry = data.passwordResetTokens.find((t) => t.token === token);
    if (!entry || new Date(entry.expiresAt).getTime() < Date.now()) return false;
    const user = data.users.find((u) => u.id === entry.userId);
    if (!user) return false;
    user.passwordHash = hashPassword(newPassword);
    user.updatedAt = new Date().toISOString();
    data.passwordResetTokens = data.passwordResetTokens.filter((t) => t.token !== token);
    writeStore(data);
    return true;
  },

  createLoginOtp(userId: string, email: string, expiresMinutes = 10): { code: string; expiresAt: string } {
    const data = ensureStore();
    const normalizedEmail = email.trim().toLowerCase();
    // Cryptographically secure 6-digit numeric OTP
    const code = crypto.randomInt(100000, 1000000).toString();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresMinutes * 60 * 1000).toISOString();

    if (!data.loginOtps) {
      data.loginOtps = [];
    }

    // Filter out previous codes for this email
    data.loginOtps = data.loginOtps.filter((o) => o.email !== normalizedEmail);
    data.loginOtps.push({
      userId,
      email: normalizedEmail,
      code,
      expiresAt,
      attempts: 0,
      lastSentAt: now.toISOString(),
    });

    writeStore(data);
    return { code, expiresAt };
  },

  verifyLoginOtp(email: string, code: string): { success: boolean; user?: LocalUser; error?: string } {
    const data = ensureStore();
    const normalizedEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    if (!data.loginOtps) {
      data.loginOtps = [];
    }

    const entry = data.loginOtps.find((o) => o.email === normalizedEmail);
    if (!entry) {
      return { success: false, error: "No pending verification code found. Please log in again." };
    }

    if (new Date(entry.expiresAt).getTime() < Date.now()) {
      data.loginOtps = data.loginOtps.filter((o) => o.email !== normalizedEmail);
      writeStore(data);
      return { success: false, error: "Verification code has expired. Please request a new code." };
    }

    if (entry.attempts >= 5) {
      data.loginOtps = data.loginOtps.filter((o) => o.email !== normalizedEmail);
      writeStore(data);
      return {
        success: false,
        error: "Too many failed attempts. For your security, this code has been invalidated. Please log in again.",
      };
    }

    if (entry.code !== cleanCode) {
      entry.attempts += 1;
      writeStore(data);
      const remaining = 5 - entry.attempts;
      return {
        success: false,
        error: `Incorrect security code. ${remaining} ${remaining === 1 ? "attempt" : "attempts"} remaining.`,
      };
    }

    // Code is valid! Invalidate OTP to prevent replay
    data.loginOtps = data.loginOtps.filter((o) => o.email !== normalizedEmail);
    writeStore(data);

    const user = data.users.find((u) => u.id === entry.userId);
    if (!user) {
      return { success: false, error: "User account not found." };
    }

    // Permanently mark user email as verified
    user.emailVerified = true;
    user.updatedAt = new Date().toISOString();
    writeStore(data);

    return { success: true, user };
  },

  canResendLoginOtp(
    email: string,
    cooldownSeconds = 60
  ): { allowed: boolean; waitSeconds: number; userId?: string } {
    const data = ensureStore();
    const normalizedEmail = email.trim().toLowerCase();
    const entry = data.loginOtps?.find((o) => o.email === normalizedEmail);
    if (!entry) {
      const user = data.users.find((u) => u.email === normalizedEmail);
      return { allowed: Boolean(user), waitSeconds: 0, userId: user?.id };
    }

    const elapsedSeconds = Math.floor((Date.now() - new Date(entry.lastSentAt).getTime()) / 1000);
    if (elapsedSeconds < cooldownSeconds) {
      return { allowed: false, waitSeconds: cooldownSeconds - elapsedSeconds, userId: entry.userId };
    }

    return { allowed: true, waitSeconds: 0, userId: entry.userId };
  },

  deleteUserAndAllData(userId: string): boolean {
    const data = ensureStore();
    const exists = data.users.some((u) => u.id === userId);
    if (!exists) return false;

    const userUploadDir = path.join(getUploadsRoot(), userId);
    if (fs.existsSync(userUploadDir)) {
      fs.rmSync(userUploadDir, { recursive: true, force: true });
    }

    this.deleteUserAvatar(userId);

    data.users = data.users.filter((u) => u.id !== userId);
    data.cvs = data.cvs.filter((c) => c.userId !== userId);
    data.cvVersions = data.cvVersions.filter((v) => v.userId !== userId);
    data.uploads = data.uploads.filter((u) => u.userId !== userId);
    data.analyses = data.analyses.filter((a) => a.userId !== userId);
    data.jobDescriptions = data.jobDescriptions.filter((j) => j.userId !== userId);
    data.aiLogs = data.aiLogs.filter((l) => l.userId !== userId);
    writeStore(data);
    return true;
  },

  listCvsForUser(userId: string): CvRecord[] {
    const data = ensureStore();
    return data.cvs
      .filter((c) => c.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  getCvForUser(cvId: string, userId: string): CvRecord | null {
    const data = ensureStore();
    return data.cvs.find((c) => c.id === cvId && c.userId === userId) || null;
  },

  createCv(input: Omit<CvRecord, "id" | "createdAt" | "updatedAt">): CvRecord {
    const data = ensureStore();
    const now = new Date().toISOString();
    const cv: CvRecord = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    data.cvs.push(cv);

    // Track cumulative generated CVs count permanently on the user record
    const user = data.users.find((u) => u.id === input.userId);
    if (user) {
      const activeCount = data.cvs.filter((c) => c.userId === input.userId).length;
      user.generatedCvsCount = Math.max((user.generatedCvsCount ?? 0) + 1, activeCount);
      user.updatedAt = now;
    }

    writeStore(data);
    return cv;
  },

  updateCv(
    cvId: string,
    userId: string,
    patch: Partial<Pick<CvRecord, "title" | "careerProfile" | "templateId" | "structuredContent" | "settings" | "status">>
  ): CvRecord | null {
    const data = ensureStore();
    const cv = data.cvs.find((c) => c.id === cvId && c.userId === userId);
    if (!cv) return null;
    if (patch.title !== undefined) cv.title = patch.title;
    if (patch.careerProfile !== undefined) cv.careerProfile = patch.careerProfile;
    if (patch.templateId !== undefined) cv.templateId = patch.templateId;
    if (patch.structuredContent !== undefined) cv.structuredContent = patch.structuredContent;
    if (patch.settings !== undefined) cv.settings = patch.settings as CvEditorSettings;
    if (patch.status !== undefined) cv.status = patch.status;
    cv.updatedAt = new Date().toISOString();
    writeStore(data);
    return cv;
  },

  deleteCv(cvId: string, userId: string): boolean {
    const data = ensureStore();
    const user = data.users.find((u) => u.id === userId);
    const activeBefore = (data.cvs || []).filter((c) => c.userId === userId).length;

    // CRITICAL COMMERCIAL RESTRICTION: Lock in cumulative generations count before deleting CV.
    // Deleting a saved CV does NOT restore CV generation credits.
    if (user) {
      user.generatedCvsCount = Math.max(user.generatedCvsCount ?? 0, activeBefore);
      user.updatedAt = new Date().toISOString();
    }

    const before = data.cvs.length;
    data.cvs = data.cvs.filter((c) => !(c.id === cvId && c.userId === userId));
    if (data.cvs.length === before) return false;
    data.cvVersions = data.cvVersions.filter((v) => !(v.cvId === cvId && v.userId === userId));
    data.analyses = data.analyses.filter((a) => !(a.cvId === cvId && a.userId === userId));
    writeStore(data);
    return true;
  },

  createCvVersion(
    cvId: string,
    userId: string,
    label: string,
    templateId: CvRecord["templateId"],
    structuredContent: StructuredCvContent
  ): LocalCvVersionRecord {
    const data = ensureStore();
    const existingCount = data.cvVersions.filter((v) => v.cvId === cvId && v.userId === userId).length;
    const version: LocalCvVersionRecord = {
      id: crypto.randomUUID(),
      cvId,
      userId,
      versionNumber: existingCount + 1,
      label,
      templateId,
      structuredContent,
      createdAt: new Date().toISOString(),
    };
    data.cvVersions.push(version);
    writeStore(data);
    return version;
  },

  listCvVersions(cvId: string, userId: string): LocalCvVersionRecord[] {
    const data = ensureStore();
    return data.cvVersions
      .filter((v) => v.cvId === cvId && v.userId === userId)
      .sort((a, b) => b.versionNumber - a.versionNumber);
  },

  saveUploadedFile(userId: string, fileName: string, buffer: Buffer): string {
    const userDir = path.join(getUploadsRoot(), userId);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    const safeName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]+/g, "_")}`;
    const relativePath = `${userId}/${safeName}`;
    fs.writeFileSync(path.join(getUploadsRoot(), relativePath), buffer);
    return relativePath;
  },

  createUploadRecord(input: Omit<LocalUploadRecord, "id" | "createdAt">): LocalUploadRecord {
    const data = ensureStore();
    const record: LocalUploadRecord = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    data.uploads.push(record);
    writeStore(data);
    return record;
  },

  listUploadsForUser(userId: string): LocalUploadRecord[] {
    const data = ensureStore();
    return data.uploads
      .filter((u) => u.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  deleteUploadRecord(uploadId: string, userId: string): boolean {
    const data = ensureStore();
    const record = data.uploads.find((u) => u.id === uploadId && u.userId === userId);
    if (!record) return false;
    const absPath = path.join(getUploadsRoot(), record.originalFilePath);
    if (fs.existsSync(absPath)) {
      fs.rmSync(absPath, { force: true });
    }
    data.uploads = data.uploads.filter((u) => !(u.id === uploadId && u.userId === userId));
    writeStore(data);
    return true;
  },

  saveAnalysis(cvId: string, userId: string, analysisResult: CvAnalysisResult): LocalAnalysisRecord {
    const data = ensureStore();
    const record: LocalAnalysisRecord = {
      id: crypto.randomUUID(),
      cvId,
      userId,
      analysisResult,
      createdAt: new Date().toISOString(),
    };
    data.analyses.push(record);
    writeStore(data);
    return record;
  },

  getLatestAnalysisForCv(cvId: string, userId: string): LocalAnalysisRecord | null {
    const data = ensureStore();
    const list = data.analyses
      .filter((a) => a.cvId === cvId && a.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list[0] || null;
  },

  saveJobDescription(input: Omit<LocalJobDescriptionRecord, "id" | "createdAt">): LocalJobDescriptionRecord {
    const data = ensureStore();
    const record: LocalJobDescriptionRecord = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    data.jobDescriptions.push(record);
    writeStore(data);
    return record;
  },

  countAiUsageToday(userId: string): number {
    const data = ensureStore();
    const todayPrefix = new Date().toISOString().slice(0, 10);
    return data.aiLogs.filter(
      (l) => l.userId === userId && l.createdAt.startsWith(todayPrefix) && l.status === "success"
    ).length;
  },

  logAiUsage(input: Omit<LocalAiLog, "id" | "createdAt">): void {
    const data = ensureStore();
    data.aiLogs.push({
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    });
    writeStore(data);
  },

  getAtsEngineMode(): AtsEngineMode {
    const data = ensureStore();
    if (data.systemSettings?.atsEngineMode) {
      return data.systemSettings.atsEngineMode;
    }
    const envMode = process.env.ATS_ENGINE_MODE?.trim().toLowerCase();
    if (envMode === "deterministic_only" || envMode === "ai_only" || envMode === "user_choice") {
      return envMode;
    }
    return "user_choice";
  },

  setAtsEngineMode(mode: AtsEngineMode): AtsEngineMode {
    const data = ensureStore();
    if (!data.systemSettings) {
      data.systemSettings = {};
    }
    data.systemSettings.atsEngineMode = mode;
    data.systemSettings.updatedAt = new Date().toISOString();
    writeStore(data);
    return mode;
  },
};
