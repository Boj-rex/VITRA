"use client";

import React, { useState, useEffect, useMemo, useTransition } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  CreditCard,
  Users,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  Eye,
  Download,
  Filter,
  Crown,
  Settings,
  Mail,
  Clock,
  Database,
  Activity,
  SlidersHorizontal,
  Plus,
  Trash2,
  FileText,
  UserCheck,
  Check,
  X,
  ExternalLink,
  Printer,
  Copy,
  Cpu,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WashiTape } from "@/components/scrapbook/WashiTape";
import { VitraLogo } from "@/components/layout/VitraLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

interface SuperUserData {
  id: string;
  email: string;
  fullName: string;
  role: "user" | "admin";
}

interface SummaryData {
  totalRevenueNaira: number;
  totalTransactions: number;
  successfulTransactions: number;
  totalCandidates: number;
  payingCandidates: number;
  verifiedUsers: number;
  totalCvsGenerated: number;
  totalActiveCvs: number;
  pendingOtpCount: number;
  supportInquiryCount: number;
  planBreakdown: {
    starter: { count: number; revenue: number };
    pro: { count: number; revenue: number };
    executive: { count: number; revenue: number };
  };
}

interface TransactionItem {
  id: string;
  reference: string;
  userId: string;
  userEmail: string;
  planId: "starter" | "pro" | "executive";
  amount: number;
  currency: string;
  status: "success" | "failed" | "pending" | "abandoned";
  channel?: string;
  gatewayResponse?: string;
  createdAt: string;
  verifiedAt?: string;
}

interface AuthLogItem {
  id: string;
  eventType:
  | "login_success"
  | "login_failed"
  | "otp_sent"
  | "otp_verified"
  | "otp_failed"
  | "signup"
  | "plan_activated"
  | "admin_action";
  email: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  details?: string;
  status: "success" | "failed" | "warning";
  createdAt: string;
}

interface UserItem {
  id: string;
  email: string;
  fullName: string;
  country: string;
  role: "user" | "admin";
  emailVerified: boolean;
  planId: "starter" | "pro" | "executive" | null;
  maxCvs: number;
  generatedCvsCount: number;
  planPurchasedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PendingOtpItem {
  email: string;
  code: string;
  expiresAt: string;
  attempts: number;
}

interface SupportInquiryItem {
  id: string;
  name: string;
  email: string;
  subject: string;
  category?: string;
  message: string;
  createdAt: string;
}

interface GatewayDiagnostics {
  provider: string;
  isLiveKey: boolean;
  isTestKey: boolean;
  secretKeyConfigured: boolean;
  publicKeyConfigured: boolean;
  secretKeyMasked: string;
  publicKeyMasked: string;
  emailSmtpConfigured: boolean;
  supportInbox: string;
}

interface BackOfficePayload {
  ok: boolean;
  superUser: SuperUserData;
  summary: SummaryData;
  transactions: TransactionItem[];
  authLogs: AuthLogItem[];
  users: UserItem[];
  pendingOtps: PendingOtpItem[];
  supportInquiries: SupportInquiryItem[];
  gatewayDiagnostics: GatewayDiagnostics;
  atsEngineMode?: "user_choice" | "deterministic_only" | "ai_only";
}

export function BackOfficeDashboard() {
  const [data, setData] = useState<BackOfficePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "payments" | "auth" | "candidates" | "support" | "diagnostics"
  >("overview");

  // Modals & Action States
  const [inspectReceipt, setInspectReceipt] = useState<TransactionItem | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmClearPayments, setConfirmClearPayments] = useState(false);
  const [resetUsersOnClear, setResetUsersOnClear] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Filters
  const [txSearch, setTxSearch] = useState("");
  const [txPlanFilter, setTxPlanFilter] = useState<string>("all");
  const [txStatusFilter, setTxStatusFilter] = useState<string>("all");

  const [authSearch, setAuthSearch] = useState("");
  const [authEventFilter, setAuthEventFilter] = useState<string>("all");

  const [userSearch, setUserSearch] = useState("");
  const [userPlanFilter, setUserPlanFilter] = useState<string>("all");

  // Candidate Action Form Inputs
  const [overridePlanTier, setOverridePlanTier] = useState<"starter" | "pro" | "executive" | "none">("starter");
  const [overrideMaxCvs, setOverrideMaxCvs] = useState<number>(3);
  const [bonusCvsCount, setBonusCvsCount] = useState<number>(3);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/backoffice", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Failed to load Back Office data");
      }
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function showNotification(msg: string, isError = false) {
    if (isError) {
      setActionErrorMessage(msg);
      setTimeout(() => setActionErrorMessage(null), 5000);
    } else {
      setActionSuccessMessage(msg);
      setTimeout(() => setActionSuccessMessage(null), 5000);
    }
  }

  function handleCopy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2500);
  }

  // Super User Action Handlers
  async function handleOverridePlan() {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/backoffice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "override_plan",
          userId: selectedUser.id,
          planId: overridePlanTier === "none" ? null : overridePlanTier,
          maxCvs: overridePlanTier === "none" ? 0 : overrideMaxCvs,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed to override plan");
      showNotification(`Successfully updated plan for ${selectedUser.email}`);
      setSelectedUser(null);
      await loadData();
    } catch (err) {
      showNotification(err instanceof Error ? err.message : "Action failed", true);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleGrantBonusCvs() {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/backoffice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "grant_bonus_cvs",
          userId: selectedUser.id,
          bonusCount: bonusCvsCount,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed to grant bonus CVs");
      showNotification(`Granted +${bonusCvsCount} bonus CVs to ${selectedUser.email}`);
      setSelectedUser(null);
      await loadData();
    } catch (err) {
      showNotification(err instanceof Error ? err.message : "Action failed", true);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleVerifyEmail() {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/backoffice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify_user_email",
          userId: selectedUser.id,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed to verify email");
      showNotification(`Manually marked ${selectedUser.email} as verified`);
      setSelectedUser(null);
      await loadData();
    } catch (err) {
      showNotification(err instanceof Error ? err.message : "Action failed", true);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleToggleRole(targetRole: "user" | "admin") {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/backoffice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_role",
          userId: selectedUser.id,
          role: targetRole,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed to update role");
      showNotification(`Updated role for ${selectedUser.email} to ${targetRole}`);
      setSelectedUser(null);
      await loadData();
    } catch (err) {
      showNotification(err instanceof Error ? err.message : "Action failed", true);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleClearAllPayments() {
    setActionLoading(true);
    try {
      const res = await fetch("/api/backoffice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "clear_all_payments",
          resetUserPlans: resetUsersOnClear,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed to clear payments");
      showNotification(`Cleared ${json.transactionsCleared} transaction records`);
      setConfirmClearPayments(false);
      await loadData();
    } catch (err) {
      showNotification(err instanceof Error ? err.message : "Action failed", true);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSetAtsEngineMode(mode: "user_choice" | "deterministic_only" | "ai_only") {
    setActionLoading(true);
    try {
      const res = await fetch("/api/backoffice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set_ats_engine_mode",
          mode,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed to update ATS mode");
      showNotification(`ATS Engine System Mode updated to '${mode}'`);
      if (data) {
        setData({ ...data, atsEngineMode: mode });
      }
      await loadData();
    } catch (err) {
      showNotification(err instanceof Error ? err.message : "Action failed", true);
    } finally {
      setActionLoading(false);
    }
  }

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    if (!data) return [];
    return data.transactions.filter((tx) => {
      const matchSearch =
        tx.reference.toLowerCase().includes(txSearch.toLowerCase()) ||
        tx.userEmail.toLowerCase().includes(txSearch.toLowerCase());
      const matchPlan = txPlanFilter === "all" || tx.planId === txPlanFilter;
      const matchStatus = txStatusFilter === "all" || tx.status === txStatusFilter;
      return matchSearch && matchPlan && matchStatus;
    });
  }, [data, txSearch, txPlanFilter, txStatusFilter]);

  // Filtered Auth Logs
  const filteredAuthLogs = useMemo(() => {
    if (!data) return [];
    return data.authLogs.filter((log) => {
      const matchSearch =
        log.email.toLowerCase().includes(authSearch.toLowerCase()) ||
        (log.details && log.details.toLowerCase().includes(authSearch.toLowerCase()));
      const matchEvent =
        authEventFilter === "all" ||
        (authEventFilter === "logins" &&
          (log.eventType === "login_success" || log.eventType === "login_failed")) ||
        (authEventFilter === "otps" &&
          (log.eventType === "otp_sent" ||
            log.eventType === "otp_verified" ||
            log.eventType === "otp_failed")) ||
        (authEventFilter === "signups" && log.eventType === "signup") ||
        (authEventFilter === "plans" && log.eventType === "plan_activated") ||
        (authEventFilter === "admin" && log.eventType === "admin_action");
      return matchSearch && matchEvent;
    });
  }, [data, authSearch, authEventFilter]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    if (!data) return [];
    return data.users.filter((u) => {
      const matchSearch =
        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.country.toLowerCase().includes(userSearch.toLowerCase());
      const matchPlan =
        userPlanFilter === "all" ||
        (userPlanFilter === "paid" && Boolean(u.planId && u.maxCvs > 0)) ||
        (userPlanFilter === "free" && (!u.planId || u.maxCvs === 0)) ||
        u.planId === userPlanFilter;
      return matchSearch && matchPlan;
    });
  }, [data, userSearch, userPlanFilter]);

  // CSV Export
  function exportCsv(type: "transactions" | "authLogs" | "users") {
    if (!data) return;
    let csvContent = "";
    let filename = "";

    if (type === "transactions") {
      filename = `vitra-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
      const headers = ["Reference", "Email", "Plan", "Amount_NGN", "Status", "Channel", "Date"];
      const rows = data.transactions.map((t) => [
        t.reference,
        t.userEmail,
        t.planId,
        t.amount,
        t.status,
        t.channel || "card",
        t.createdAt,
      ]);
      csvContent = [headers.join(","), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(","))].join("\n");
    } else if (type === "authLogs") {
      filename = `vitra-auth-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      const headers = ["Timestamp", "EventType", "Email", "Status", "Details", "IP"];
      const rows = data.authLogs.map((l) => [
        l.createdAt,
        l.eventType,
        l.email,
        l.status,
        (l.details || "").replace(/"/g, '""'),
        l.ip || "",
      ]);
      csvContent = [headers.join(","), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(","))].join("\n");
    } else if (type === "users") {
      filename = `vitra-candidates-${new Date().toISOString().slice(0, 10)}.csv`;
      const headers = ["ID", "Email", "FullName", "Country", "Role", "EmailVerified", "Plan", "MaxCvs", "GeneratedCount", "JoinedDate"];
      const rows = data.users.map((u) => [
        u.id,
        u.email,
        u.fullName,
        u.country,
        u.role,
        u.emailVerified ? "Yes" : "No",
        u.planId || "free",
        u.maxCvs,
        u.generatedCvsCount,
        u.createdAt,
      ]);
      csvContent = [headers.join(","), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(","))].join("\n");
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-drafting-grid flex flex-col items-center justify-center p-6 text-center font-tech">
        <div className="relative border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#181C28] p-8 rounded-2xl shadow-sticker max-w-md w-full">
          <WashiTape color="yellow" angle="right" className="-top-3 left-6" />
          <div className="flex justify-center mb-4">
            <RefreshCw className="h-8 w-8 animate-spin text-[#1B3AFF]" />
          </div>
          <h2 className="text-xl font-bold uppercase tracking-tight text-[#111111] dark:text-white">
            Accessing Super User Vault
          </h2>
          <p className="mt-2 text-xs text-[#55564E] dark:text-[#94A3B8]">
            Validating security credentials and fetching real-time Paystack, candidate, and auth telemetry...
          </p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-drafting-grid flex flex-col items-center justify-center p-6 text-center font-tech">
        <div className="relative border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#181C28] p-8 rounded-2xl shadow-sticker max-w-md w-full">
          <WashiTape color="pink" angle="left" className="-top-3 left-6" />
          <div className="flex justify-center mb-4">
            <ShieldAlert className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="text-xl font-bold uppercase tracking-tight text-[#111111] dark:text-white">
            Super User Access Denied
          </h2>
          <p className="mt-2 text-xs text-red-600 dark:text-red-400 font-semibold">{error}</p>
          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={loadData}
              className="w-full py-2.5 px-4 bg-[#111111] dark:bg-[#1E2536] text-white dark:text-white font-bold rounded-lg border-2 border-black dark:border-[#333C52] shadow-[2px_2px_0px_#111111] hover:-translate-y-0.5 active:translate-y-0.5"
            >
              Retry Authentication
            </button>
            <Link
              href="/dashboard"
              className="w-full py-2 px-4 bg-transparent text-[#55564E] dark:text-[#CBD5E1] text-xs font-bold hover:underline"
            >
              Return to Candidate Workspace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const summary = data?.summary;
  const diagnostics = data?.gatewayDiagnostics;

  return (
    <div className="min-h-screen bg-drafting-grid text-[#111111] dark:text-[#F1F5F9] pb-24 font-tech">
      {/* Top Super User Command Bar */}
      <header className="sticky top-0 z-40 border-b-2 border-black dark:border-[#2D3548] bg-[#FFFEFA]/95 dark:bg-[#141722]/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <VitraLogo href="/backoffice" />
            <div className="hidden sm:flex items-center gap-2">
              <span className="h-5 w-px bg-black/20 dark:bg-white/20" />
              <span className="rounded bg-[#F8D849] border border-black px-2 py-0.5 text-[10px] font-black tracking-wider uppercase text-black shadow-[1px_1px_0px_#000]">
                SUPER USER COMMAND CENTER
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Paystack Mode Pill */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-black/20 dark:border-white/20 bg-white dark:bg-[#1E2536] text-[11px] font-bold">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  diagnostics?.isLiveKey ? "bg-emerald-500 animate-pulse" : "bg-amber-400"
                )}
              />
              <span>PAYSTACK {diagnostics?.isLiveKey ? "LIVE" : "TEST MODE"}</span>
            </div>

            <ThemeToggle variant="segmented" />

            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#1E2536] px-3 py-1.5 text-xs font-bold text-[#111111] dark:text-white shadow-[2px_2px_0px_#111111] dark:shadow-[2px_2px_0px_#000] hover:-translate-y-0.5 active:translate-y-0.5 cursor-pointer disabled:opacity-50 select-none"
              title="Refresh telemetry"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>

            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 rounded-lg border-2 border-black dark:border-[#333C52] bg-[#111111] dark:bg-[#1E2536] text-white dark:text-white px-3 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#1B3AFF] hover:-translate-y-0.5 active:translate-y-0.5 select-none"
            >
              <span>Candidate Workspace</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Floating Action Notifications */}
      {actionSuccessMessage && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 rounded-xl border-2 border-black bg-[#D1FAE5] dark:bg-[#064E3B] px-4 py-3 text-xs font-bold text-[#065F46] dark:text-[#6EE7B7] shadow-sticker animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}
      {actionErrorMessage && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 rounded-xl border-2 border-black bg-[#FEE2E2] dark:bg-[#7F1D1D] px-4 py-3 text-xs font-bold text-[#991B1B] dark:text-[#FCA5A5] shadow-sticker animate-in fade-in slide-in-from-top-4">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{actionErrorMessage}</span>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        {/* Super User Identity & Subheader */}
        <div className="relative mb-8 rounded-2xl border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#181C28] p-6 shadow-sticker">
          <WashiTape color="blue" angle="left" className="-top-3 left-8" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-[#F59E0B]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#55564E] dark:text-[#94A3B8]">
                  Super User Access
                </span>
                <span className="rounded bg-black text-white dark:bg-[#1E2536] dark:text-white border dark:border-[#333C52] px-2 py-0.5 text-[10px] font-black uppercase">
                  {data?.superUser.role === "admin" ? "ROOT ADMINISTRATOR" : "AUTHORIZED"}
                </span>
              </div>
              <h1 className="mt-1 text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#111111] dark:text-white">
                Live Operations Command
              </h1>
              <p className="mt-1 text-xs text-[#55564E] dark:text-[#94A3B8]">
                Real-time tracking of Paystack payments, candidate login sessions, 6-digit OTP verification codes, and generation quotas.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmClearPayments(true)}
                className="flex items-center gap-1.5 rounded-lg border-2 border-red-600 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 px-3 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#B91C1C] hover:-translate-y-0.5 active:translate-y-0.5 cursor-pointer select-none"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear Payment History</span>
              </button>

              <button
                type="button"
                onClick={() => exportCsv("transactions")}
                className="flex items-center gap-1.5 rounded-lg border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#1E2536] px-3 py-1.5 text-xs font-bold text-[#111111] dark:text-white shadow-[2px_2px_0px_#111111] dark:shadow-[2px_2px_0px_#000] hover:-translate-y-0.5 active:translate-y-0.5 cursor-pointer select-none"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Transactions CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* 6 Key Telemetry Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
            {/* Total Revenue */}
            <div className="relative rounded-xl border-2 border-black dark:border-[#333C52] bg-[#ECFDF5] dark:bg-[#064E3B]/30 p-4 shadow-sticker-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#065F46] dark:text-[#34D399]">
                Gross Revenue
              </span>
              <p className="mt-1 text-xl sm:text-2xl font-black text-[#065F46] dark:text-[#34D399]">
                ₦{summary.totalRevenueNaira.toLocaleString()}
              </p>
              <p className="mt-0.5 text-[10px] text-[#047857] dark:text-[#6EE7B7]">
                {summary.successfulTransactions} paid charges
              </p>
            </div>

            {/* Total Transactions */}
            <div className="relative rounded-xl border-2 border-black dark:border-[#333C52] bg-[#EFF6FF] dark:bg-[#1E3A8A]/30 p-4 shadow-sticker-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#1E40AF] dark:text-[#60A5FA]">
                Paystack Orders
              </span>
              <p className="mt-1 text-xl sm:text-2xl font-black text-[#1E40AF] dark:text-[#60A5FA]">
                {summary.totalTransactions}
              </p>
              <p className="mt-0.5 text-[10px] text-[#2563EB] dark:text-[#93C5FD]">
                {summary.totalTransactions > 0
                  ? `${Math.round((summary.successfulTransactions / summary.totalTransactions) * 100)}% success rate`
                  : "0 attempts"}
              </p>
            </div>

            {/* Paying Candidates */}
            <div className="relative rounded-xl border-2 border-black dark:border-[#333C52] bg-[#FEF3C7] dark:bg-[#78350F]/30 p-4 shadow-sticker-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#92400E] dark:text-[#FBBF24]">
                Subscribers
              </span>
              <p className="mt-1 text-xl sm:text-2xl font-black text-[#92400E] dark:text-[#FBBF24]">
                {summary.payingCandidates}
              </p>
              <p className="mt-0.5 text-[10px] text-[#B45309] dark:text-[#FDE68A]">
                of {summary.totalCandidates} registered
              </p>
            </div>

            {/* Total CV Generations */}
            <div className="relative rounded-xl border-2 border-black dark:border-[#333C52] bg-[#F5F3FF] dark:bg-[#4C1D95]/30 p-4 shadow-sticker-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5B21B6] dark:text-[#A78BFA]">
                CVs Generated
              </span>
              <p className="mt-1 text-xl sm:text-2xl font-black text-[#5B21B6] dark:text-[#A78BFA]">
                {summary.totalCvsGenerated}
              </p>
              <p className="mt-0.5 text-[10px] text-[#6D28D9] dark:text-[#C4B5FD]">
                Strict quota enforced
              </p>
            </div>

            {/* Pending OTPs */}
            <div className="relative rounded-xl border-2 border-black dark:border-[#333C52] bg-[#FFF1F2] dark:bg-[#881337]/30 p-4 shadow-sticker-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9F1239] dark:text-[#FB7185]">
                Active OTPs
              </span>
              <p className="mt-1 text-xl sm:text-2xl font-black text-[#9F1239] dark:text-[#FB7185]">
                {summary.pendingOtpCount}
              </p>
              <p className="mt-0.5 text-[10px] text-[#BE123C] dark:text-[#FDA4AF]">
                Awaiting verification
              </p>
            </div>

            {/* Support Inquiries */}
            <div className="relative rounded-xl border-2 border-black dark:border-[#333C52] bg-[#F0FDF4] dark:bg-[#14532D]/30 p-4 shadow-sticker-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#166534] dark:text-[#4ADE80]">
                Support Inquiries
              </span>
              <p className="mt-1 text-xl sm:text-2xl font-black text-[#166534] dark:text-[#4ADE80]">
                {summary.supportInquiryCount}
              </p>
              <p className="mt-0.5 text-[10px] text-[#15803D] dark:text-[#86EFAC]">
                Dispatched to configured support inbox
              </p>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b-2 border-black/10 dark:border-white/10 mb-6 scrollbar-none">
          {[
            { id: "overview", label: "Overview & Revenue", icon: Activity },
            { id: "payments", label: `Payment History (${data?.transactions.length || 0})`, icon: CreditCard },
            { id: "auth", label: `Login & Auth Logs (${data?.authLogs.length || 0})`, icon: KeyRound },
            { id: "candidates", label: `Candidate Directory (${data?.users.length || 0})`, icon: Users },
            { id: "support", label: `Customer Support (${data?.supportInquiries.length || 0})`, icon: Mail },
            { id: "diagnostics", label: "Gateway & System Health", icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap cursor-pointer select-none",
                  active
                    ? "border-2 border-black dark:border-[#333C52] bg-[#111111] dark:bg-[#1E2536] text-white shadow-[2px_2px_0px_#1B3AFF]"
                    : "border-2 border-transparent text-[#55564E] dark:text-[#CBD5E1] hover:bg-black/5 dark:hover:bg-white/5"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW & REVENUE BREAKDOWN */}
        {activeTab === "overview" && summary && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Revenue by Plan Tier */}
            <div className="rounded-2xl border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#181C28] p-6 shadow-sticker">
              <h2 className="text-lg font-black uppercase tracking-tight text-[#111111] dark:text-white">
                Revenue by Commercial Plan Tier
              </h2>
              <p className="text-xs text-[#55564E] dark:text-[#94A3B8] mt-0.5">
                Breakdown of active packages purchased through Paystack checkout
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                {/* Starter */}
                <div className="rounded-xl border-2 border-black dark:border-[#333C52] bg-[#F8FAFC] dark:bg-[#1E2333] p-4">
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-black text-white dark:bg-[#1E2536] dark:text-white border dark:border-[#333C52] px-2 py-0.5 text-[10px] font-black uppercase">
                      Starter Plan (₦6,000)
                    </span>
                    <span className="text-xs font-bold text-[#55564E] dark:text-[#94A3B8]">
                      3 CVs Quota
                    </span>
                  </div>
                  <p className="mt-3 text-2xl font-black text-[#111111] dark:text-white">
                    ₦{summary.planBreakdown.starter.revenue.toLocaleString()}
                  </p>
                  <p className="text-xs font-semibold text-[#55564E] dark:text-[#94A3B8] mt-1">
                    {summary.planBreakdown.starter.count} total subscribers
                  </p>
                </div>

                {/* Pro */}
                <div className="rounded-xl border-2 border-black dark:border-[#333C52] bg-[#FEF3C7]/40 dark:bg-[#2A2312] p-4 border-l-4 border-l-[#F59E0B]">
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-[#F8D849] text-black border border-black px-2 py-0.5 text-[10px] font-black uppercase shadow-[1px_1px_0px_#000]">
                      Pro Plan (₦15,000)
                    </span>
                    <span className="text-xs font-bold text-[#92400E] dark:text-[#FBBF24]">
                      5 CVs Quota
                    </span>
                  </div>
                  <p className="mt-3 text-2xl font-black text-[#111111] dark:text-white">
                    ₦{summary.planBreakdown.pro.revenue.toLocaleString()}
                  </p>
                  <p className="text-xs font-semibold text-[#55564E] dark:text-[#94A3B8] mt-1">
                    {summary.planBreakdown.pro.count} total subscribers
                  </p>
                </div>

                {/* Executive */}
                <div className="rounded-xl border-2 border-black dark:border-[#333C52] bg-[#EFF6FF]/40 dark:bg-[#172554] p-4 border-l-4 border-l-[#1B3AFF]">
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-[#1B3AFF] text-white px-2 py-0.5 text-[10px] font-black uppercase">
                      Executive Plan (₦20,000)
                    </span>
                    <span className="text-xs font-bold text-[#1E40AF] dark:text-[#60A5FA]">
                      7 CVs Quota
                    </span>
                  </div>
                  <p className="mt-3 text-2xl font-black text-[#111111] dark:text-white">
                    ₦{summary.planBreakdown.executive.revenue.toLocaleString()}
                  </p>
                  <p className="text-xs font-semibold text-[#55564E] dark:text-[#94A3B8] mt-1">
                    {summary.planBreakdown.executive.count} total subscribers
                  </p>
                </div>
              </div>
            </div>

            {/* Split Grid: Recent Transactions & Recent Security Events */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Transactions */}
              <div className="rounded-2xl border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#181C28] p-6 shadow-sticker">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-black uppercase tracking-tight text-[#111111] dark:text-white flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-[#1B3AFF]" />
                    Latest Paystack Payments
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("payments")}
                    className="text-xs font-bold text-[#1B3AFF] hover:underline"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-2.5">
                  {data?.transactions.slice(0, 5).map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-black/10 dark:border-[#333C52] bg-[#F8FAFC] dark:bg-[#1E2536]"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#111111] dark:text-white">
                            {t.userEmail}
                          </span>
                          <span className="rounded bg-black/10 dark:bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase">
                            {t.planId}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#77786F] dark:text-[#94A3B8] font-mono mt-0.5">
                          {t.reference}
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <p className="text-xs font-black text-[#111111] dark:text-white">
                            ₦{t.amount.toLocaleString()}
                          </p>
                          <span
                            className={cn(
                              "text-[10px] font-bold uppercase",
                              t.status === "success"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-red-600 dark:text-red-400"
                            )}
                          >
                            {t.status}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setInspectReceipt(t)}
                          className="rounded border border-black dark:border-white/20 bg-white dark:bg-[#181C28] p-1.5 text-xs text-[#111111] dark:text-white shadow-sm hover:bg-black/5"
                          title="Inspect receipt"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {data?.transactions.length === 0 && (
                    <div className="text-center py-8 text-xs text-[#77786F] dark:text-[#94A3B8]">
                      No transactions recorded yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Security & Auth Logs */}
              <div className="rounded-2xl border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#181C28] p-6 shadow-sticker">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-black uppercase tracking-tight text-[#111111] dark:text-white flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-[#F59E0B]" />
                    Real-time Auth Events
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("auth")}
                    className="text-xs font-bold text-[#1B3AFF] hover:underline"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-2.5">
                  {data?.authLogs.slice(0, 5).map((l) => (
                    <div
                      key={l.id}
                      className="p-3 rounded-xl border border-black/10 dark:border-[#333C52] bg-[#F8FAFC] dark:bg-[#1E2536]"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            "rounded px-2 py-0.5 text-[9px] font-black uppercase",
                            l.eventType === "login_success" && "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
                            l.eventType === "login_failed" && "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
                            l.eventType === "otp_sent" && "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
                            l.eventType === "otp_verified" && "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
                            l.eventType === "otp_failed" && "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
                            l.eventType === "signup" && "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
                            l.eventType === "plan_activated" && "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
                            l.eventType === "admin_action" && "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300"
                          )}
                        >
                          {l.eventType.replace("_", " ")}
                        </span>
                        <span className="text-[10px] text-[#77786F] dark:text-[#94A3B8]">
                          {new Date(l.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-[#111111] dark:text-white mt-1">
                        {l.email}
                      </p>
                      {l.details && (
                        <p className="text-[11px] text-[#55564E] dark:text-[#94A3B8] mt-0.5 line-clamp-1">
                          {l.details}
                        </p>
                      )}
                    </div>
                  ))}
                  {data?.authLogs.length === 0 && (
                    <div className="text-center py-8 text-xs text-[#77786F] dark:text-[#94A3B8]">
                      No authentication events logged yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PAYMENT HISTORY & ITEMIZED RECEIPTS */}
        {activeTab === "payments" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Filter Bar */}
            <div className="rounded-2xl border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#181C28] p-4 shadow-sticker flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#77786F]" />
                <input
                  type="text"
                  placeholder="Search by email or reference..."
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border-2 border-black/20 dark:border-[#333C52] bg-transparent text-[#111111] dark:text-white focus:border-black dark:focus:border-white focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                {/* Plan Filter */}
                <select
                  value={txPlanFilter}
                  onChange={(e) => setTxPlanFilter(e.target.value)}
                  aria-label="Filter by plan"
                  className="px-3 py-2 text-xs font-bold rounded-lg border-2 border-black/20 dark:border-[#333C52] bg-white dark:bg-[#1E2536] text-[#111111] dark:text-white focus:outline-none"
                >
                  <option value="all">All Plans</option>
                  <option value="starter">Starter (₦6k)</option>
                  <option value="pro">Pro (₦15k)</option>
                  <option value="executive">Executive (₦20k)</option>
                </select>

                {/* Status Filter */}
                <select
                  value={txStatusFilter}
                  onChange={(e) => setTxStatusFilter(e.target.value)}
                  aria-label="Filter by transaction status"
                  className="px-3 py-2 text-xs font-bold rounded-lg border-2 border-black/20 dark:border-[#333C52] bg-white dark:bg-[#1E2536] text-[#111111] dark:text-white focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                  <option value="pending">Pending</option>
                </select>

                <button
                  type="button"
                  onClick={() => exportCsv("transactions")}
                  className="px-3 py-2 text-xs font-bold rounded-lg border-2 border-black dark:border-[#333C52] bg-[#111111] dark:bg-[#1E2536] text-white dark:text-white shadow-[2px_2px_0px_#1B3AFF] hover:-translate-y-0.5 active:translate-y-0.5 cursor-pointer select-none"
                >
                  Export CSV
                </button>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="rounded-2xl border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#181C28] shadow-sticker overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] dark:bg-[#1E2536] border-b-2 border-black/10 dark:border-[#333C52] font-black uppercase tracking-wider text-[#55564E] dark:text-[#94A3B8]">
                    <tr>
                      <th className="py-3.5 px-4">Paystack Reference</th>
                      <th className="py-3.5 px-4">Candidate Email</th>
                      <th className="py-3.5 px-4">Plan Tier</th>
                      <th className="py-3.5 px-4">Amount</th>
                      <th className="py-3.5 px-4">Channel</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Timestamp</th>
                      <th className="py-3.5 px-4 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/10 dark:divide-[#333C52]">
                    {filteredTransactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors font-medium"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-[#111111] dark:text-white">
                          <div className="flex items-center gap-1.5">
                            <span>{tx.reference}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(tx.reference, tx.reference)}
                              className="text-[#77786F] hover:text-black dark:hover:text-white"
                              title="Copy Reference"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[#111111] dark:text-white">
                          {tx.userEmail}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={cn(
                              "rounded px-2 py-0.5 text-[10px] font-black uppercase",
                              tx.planId === "starter" && "bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200",
                              tx.planId === "pro" && "bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200",
                              tx.planId === "executive" && "bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-200"
                            )}
                          >
                            {tx.planId}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-black font-mono text-[#111111] dark:text-white">
                          ₦{tx.amount.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 capitalize text-[#55564E] dark:text-[#94A3B8]">
                          {tx.channel || "card"}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                              tx.status === "success" && "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
                              tx.status === "failed" && "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
                              tx.status === "pending" && "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            )}
                          >
                            {tx.status === "success" && <CheckCircle2 className="h-3 w-3" />}
                            {tx.status === "failed" && <XCircle className="h-3 w-3" />}
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#77786F] dark:text-[#94A3B8]">
                          {new Date(tx.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setInspectReceipt(tx)}
                            className="inline-flex items-center gap-1 rounded-lg border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#1E2536] px-2.5 py-1 text-[11px] font-bold shadow-[1.5px_1.5px_0px_#111111] dark:shadow-[1.5px_1.5px_0px_#000] hover:-translate-y-0.5 active:translate-y-0.5 cursor-pointer select-none"
                          >
                            <Eye className="h-3 w-3" />
                            <span>View Receipt</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredTransactions.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-xs text-[#77786F] dark:text-[#94A3B8]">
                          No transactions matching the selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LOGIN & AUTH AUDIT LOGS + ACTIVE OTPs */}
        {activeTab === "auth" && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Live Pending OTPs Inspector */}
            <div className="rounded-2xl border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#181C28] p-6 shadow-sticker">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight text-[#111111] dark:text-white flex items-center gap-2">
                    <KeyRound className="h-5 w-5 text-[#F59E0B]" />
                    Active / Pending 6-Digit OTP Verification Codes
                  </h2>
                  <p className="text-xs text-[#55564E] dark:text-[#94A3B8] mt-0.5">
                    Real-time inspection of one-time login passwords currently awaiting candidate entry (10-minute validity)
                  </p>
                </div>
                <span className="rounded bg-[#F8D849] border border-black px-2.5 py-1 text-xs font-black uppercase text-black shadow-[1px_1px_0px_#000]">
                  {data?.pendingOtps.length || 0} Awaiting Verification
                </span>
              </div>

              {data && data.pendingOtps.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.pendingOtps.map((otp, idx) => {
                    const expiresAtMs = new Date(otp.expiresAt).getTime();
                    const nowMs = Date.now();
                    const remainingSeconds = Math.max(0, Math.floor((expiresAtMs - nowMs) / 1000));
                    const remainingMinutes = Math.floor(remainingSeconds / 60);
                    const secs = remainingSeconds % 60;

                    return (
                      <div
                        key={idx}
                        className="rounded-xl border-2 border-black dark:border-[#333C52] bg-[#FEF9C3]/50 dark:bg-[#252110] p-4 relative"
                      >
                        <WashiTape color="yellow" angle="left" className="-top-2 left-4 scale-75" />
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#854D0E] dark:text-[#FBBF24]">
                            Recipient Candidate
                          </span>
                          <span className="text-[10px] font-mono font-bold text-[#854D0E] dark:text-[#FBBF24]">
                            {otp.attempts} / 5 attempts
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-bold text-[#111111] dark:text-white truncate">
                          {otp.email}
                        </p>

                        <div className="mt-3 flex items-center justify-between bg-white dark:bg-[#181C28] p-2.5 rounded-lg border border-black/20 dark:border-white/20">
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-[#77786F] block">
                              6-Digit Code
                            </span>
                            <span className="text-xl font-black font-mono tracking-widest text-[#111111] dark:text-white">
                              {otp.code}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(otp.code, `otp-${otp.email}`)}
                            className="rounded border border-black px-2 py-1 text-[10px] font-bold hover:bg-black/5"
                          >
                            {copiedKey === `otp-${otp.email}` ? "Copied!" : "Copy Code"}
                          </button>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between text-[10px] text-[#854D0E] dark:text-[#FBBF24] font-semibold">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Expires in {remainingMinutes}m {secs}s
                          </span>
                          <span>Active session</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-black/20 dark:border-white/20 p-8 text-center text-xs text-[#77786F] dark:text-[#94A3B8]">
                  No active OTP codes in the queue. When candidates request login codes, they appear here live.
                </div>
              )}
            </div>

            {/* Authentication Audit Log Feed */}
            <div className="rounded-2xl border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#181C28] p-6 shadow-sticker">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight text-[#111111] dark:text-white flex items-center gap-2">
                    <Activity className="h-5 w-5 text-[#1B3AFF]" />
                    Candidate Authentication & Security Audit Trail
                  </h2>
                  <p className="text-xs text-[#55564E] dark:text-[#94A3B8] mt-0.5">
                    Track every login, OTP verification, credential failure, registration, and administrative override
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#77786F]" />
                    <input
                      type="text"
                      placeholder="Search email or details..."
                      value={authSearch}
                      onChange={(e) => setAuthSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border-2 border-black/20 dark:border-[#333C52] bg-transparent text-[#111111] dark:text-white focus:outline-none"
                    />
                  </div>

                  <select
                    value={authEventFilter}
                    onChange={(e) => setAuthEventFilter(e.target.value)}
                    aria-label="Filter by auth event type"
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border-2 border-black/20 dark:border-[#333C52] bg-white dark:bg-[#1E2536] text-[#111111] dark:text-white focus:outline-none"
                  >
                    <option value="all">All Events</option>
                    <option value="logins">Logins (Success & Failed)</option>
                    <option value="otps">OTP Verification Events</option>
                    <option value="signups">New Registrations</option>
                    <option value="plans">Plan Activations</option>
                    <option value="admin">Super User Overrides</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => exportCsv("authLogs")}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border-2 border-black dark:border-[#333C52] bg-[#111111] dark:bg-[#1E2536] text-white dark:text-white shadow-[1.5px_1.5px_0px_#1B3AFF] hover:-translate-y-0.5 active:translate-y-0.5 select-none"
                  >
                    Export CSV
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] dark:bg-[#1E2536] border-b-2 border-black/10 dark:border-[#333C52] font-black uppercase tracking-wider text-[#55564E] dark:text-[#94A3B8]">
                    <tr>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Event Type</th>
                      <th className="py-3 px-4">Candidate Email</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Audit Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/10 dark:divide-[#333C52]">
                    {filteredAuthLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      >
                        <td className="py-3 px-4 text-[#77786F] dark:text-[#94A3B8] whitespace-nowrap font-mono text-[11px]">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              "rounded px-2 py-0.5 text-[9px] font-black uppercase inline-block whitespace-nowrap",
                              log.eventType === "login_success" && "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
                              log.eventType === "login_failed" && "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
                              log.eventType === "otp_sent" && "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
                              log.eventType === "otp_verified" && "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
                              log.eventType === "otp_failed" && "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
                              log.eventType === "signup" && "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
                              log.eventType === "plan_activated" && "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
                              log.eventType === "admin_action" && "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300"
                            )}
                          >
                            {log.eventType.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-[#111111] dark:text-white">
                          {log.email}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              "text-[10px] font-bold uppercase",
                              log.status === "success" && "text-emerald-600 dark:text-emerald-400",
                              log.status === "failed" && "text-red-600 dark:text-red-400",
                              log.status === "warning" && "text-amber-600 dark:text-amber-400"
                            )}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#55564E] dark:text-[#CBD5E1]">
                          {log.details || "-"}
                        </td>
                      </tr>
                    ))}
                    {filteredAuthLogs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-xs text-[#77786F] dark:text-[#94A3B8]">
                          No authentication events match the filter criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CANDIDATE DIRECTORY & QUOTAS */}
        {activeTab === "candidates" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Filter Bar */}
            <div className="rounded-2xl border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#181C28] p-4 shadow-sticker flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#77786F]" />
                <input
                  type="text"
                  placeholder="Search by name, email, or country..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border-2 border-black/20 dark:border-[#333C52] bg-transparent text-[#111111] dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <select
                  value={userPlanFilter}
                  onChange={(e) => setUserPlanFilter(e.target.value)}
                  aria-label="Filter candidates by subscription status"
                  className="px-3 py-2 text-xs font-bold rounded-lg border-2 border-black/20 dark:border-[#333C52] bg-white dark:bg-[#1E2536] text-[#111111] dark:text-white focus:outline-none"
                >
                  <option value="all">All Candidates</option>
                  <option value="paid">Subscribed Candidates</option>
                  <option value="free">No Active Plan</option>
                  <option value="starter">Starter Plan</option>
                  <option value="pro">Pro Plan</option>
                  <option value="executive">Executive Plan</option>
                </select>

                <button
                  type="button"
                  onClick={() => exportCsv("users")}
                  className="px-3 py-2 text-xs font-bold rounded-lg border-2 border-black dark:border-[#333C52] bg-[#111111] dark:bg-[#1E2536] text-white dark:text-white shadow-[2px_2px_0px_#1B3AFF] hover:-translate-y-0.5 active:translate-y-0.5 select-none"
                >
                  Export CSV
                </button>
              </div>
            </div>

            {/* Candidates Table */}
            <div className="rounded-2xl border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#181C28] shadow-sticker overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] dark:bg-[#1E2536] border-b-2 border-black/10 dark:border-[#333C52] font-black uppercase tracking-wider text-[#55564E] dark:text-[#94A3B8]">
                    <tr>
                      <th className="py-3.5 px-4">Candidate</th>
                      <th className="py-3.5 px-4">Verification</th>
                      <th className="py-3.5 px-4">Role</th>
                      <th className="py-3.5 px-4">Plan Tier</th>
                      <th className="py-3.5 px-4">Strict CV Quota</th>
                      <th className="py-3.5 px-4">Registered</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/10 dark:divide-[#333C52]">
                    {filteredUsers.map((u) => {
                      const quotaPercent = u.maxCvs > 0 ? Math.min(100, Math.round((u.generatedCvsCount / u.maxCvs) * 100)) : 0;
                      const isAtLimit = u.maxCvs > 0 && u.generatedCvsCount >= u.maxCvs;

                      return (
                        <tr
                          key={u.id}
                          className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors font-medium"
                        >
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-[#111111] dark:text-white">{u.fullName}</p>
                            <p className="text-[11px] text-[#77786F] dark:text-[#94A3B8]">{u.email}</p>
                            <span className="text-[10px] text-[#999A90] dark:text-[#64748B]">
                              📍 {u.country}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {u.emailVerified ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                Unverified
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={cn(
                                "rounded px-2 py-0.5 text-[10px] font-black uppercase",
                                u.role === "admin"
                                  ? "bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300"
                                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              )}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {u.planId ? (
                              <span
                                className={cn(
                                  "rounded px-2 py-0.5 text-[10px] font-black uppercase",
                                  u.planId === "starter" && "bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200",
                                  u.planId === "pro" && "bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200",
                                  u.planId === "executive" && "bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-200"
                                )}
                              >
                                {u.planId}
                              </span>
                            ) : (
                              <span className="text-[11px] text-[#77786F] dark:text-[#94A3B8]">
                                No Active Plan
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 min-w-[180px]">
                            <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                              <span>
                                {u.generatedCvsCount} / {u.maxCvs} CVs
                              </span>
                              <span
                                className={cn(
                                  "text-[10px] uppercase font-bold",
                                  isAtLimit ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
                                )}
                              >
                                {isAtLimit ? "Limit Reached" : `${u.maxCvs - u.generatedCvsCount} left`}
                              </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  isAtLimit ? "bg-red-500" : quotaPercent > 70 ? "bg-amber-500" : "bg-[#1B3AFF]"
                                )}
                                style={{ width: `${quotaPercent}%` }}
                              />
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-[#77786F] dark:text-[#94A3B8] whitespace-nowrap">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUser(u);
                                setOverridePlanTier(u.planId || "starter");
                                setOverrideMaxCvs(u.maxCvs || 3);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#1E2536] px-2.5 py-1 text-[11px] font-bold shadow-[1.5px_1.5px_0px_#111111] dark:shadow-[1.5px_1.5px_0px_#000] hover:-translate-y-0.5 active:translate-y-0.5 cursor-pointer select-none"
                            >
                              <SlidersHorizontal className="h-3 w-3" />
                              <span>Manage Candidate</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-xs text-[#77786F] dark:text-[#94A3B8]">
                          No candidates found matching the search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CUSTOMER SUPPORT INQUIRIES */}
        {activeTab === "support" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="rounded-2xl border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#181C28] p-6 shadow-sticker">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight text-[#111111] dark:text-white flex items-center gap-2">
                    <Mail className="h-5 w-5 text-[#1B3AFF]" />
                    Customer Inquiries & Feedback Desk
                  </h2>
                  <p className="text-xs text-[#55564E] dark:text-[#94A3B8] mt-0.5">
                    Messages submitted by candidates through contact forms and live help widgets, delivered to {diagnostics?.supportInbox}
                  </p>
                </div>
                <span className="rounded bg-black text-white dark:bg-[#1E2536] dark:text-white border dark:border-[#333C52] px-2.5 py-1 text-xs font-black uppercase">
                  {data?.supportInquiries.length || 0} Messages
                </span>
              </div>

              {data && data.supportInquiries.length > 0 ? (
                <div className="space-y-4">
                  {data.supportInquiries.map((inquiry) => (
                    <div
                      key={inquiry.id}
                      className="rounded-xl border-2 border-black dark:border-[#333C52] bg-[#F8FAFC] dark:bg-[#1E2536] p-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/10 dark:border-white/10 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#111111] dark:text-white">
                              {inquiry.name}
                            </span>
                            <span className="text-xs text-[#77786F] dark:text-[#94A3B8]">
                              ({inquiry.email})
                            </span>
                          </div>
                          <p className="text-xs font-bold text-[#1B3AFF] mt-0.5">
                            Subject: {inquiry.subject}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-[#77786F] dark:text-[#94A3B8]">
                            {new Date(inquiry.createdAt).toLocaleString()}
                          </span>
                          <a
                            href={`mailto:${inquiry.email}?subject=Re: ${encodeURIComponent(inquiry.subject)}`}
                            className="rounded-lg border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#181C28] px-3 py-1 text-xs font-bold text-[#111111] dark:text-white shadow-[1.5px_1.5px_0px_#111111] hover:-translate-y-0.5 active:translate-y-0.5"
                          >
                            Reply via Email
                          </a>
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-[#252821] dark:text-[#E2E8F0] whitespace-pre-wrap leading-relaxed">
                        {inquiry.message}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-black/20 dark:border-white/20 p-12 text-center text-xs text-[#77786F] dark:text-[#94A3B8]">
                  No support inquiries in the inbox.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: GATEWAY & SYSTEM HEALTH */}
        {activeTab === "diagnostics" && diagnostics && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Paystack Gateway Details */}
            <div className="rounded-2xl border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#181C28] p-6 shadow-sticker">
              <h2 className="text-lg font-black uppercase tracking-tight text-[#111111] dark:text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#1B3AFF]" />
                Paystack Payment Gateway Configuration
              </h2>
              <p className="text-xs text-[#55564E] dark:text-[#94A3B8] mt-0.5">
                Current API integration status and commercial gateway readiness
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="rounded-xl border border-black/10 dark:border-[#333C52] bg-[#F8FAFC] dark:bg-[#1E2536] p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#77786F]">
                    Gateway Mode
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={cn(
                        "h-3 w-3 rounded-full",
                        diagnostics.isLiveKey ? "bg-emerald-500 animate-pulse" : "bg-amber-400"
                      )}
                    />
                    <span className="text-base font-black text-[#111111] dark:text-white">
                      {diagnostics.isLiveKey ? "LIVE COMMERCIAL MODE" : "TEST / SANDBOX MODE"}
                    </span>
                  </div>
                  <p className="text-xs text-[#55564E] dark:text-[#94A3B8] mt-1">
                    {diagnostics.isLiveKey
                      ? "Processing real Naira payments from candidates."
                      : "Using test cards for checkout verification. Safe to test."}
                  </p>
                </div>

                <div className="rounded-xl border border-black/10 dark:border-[#333C52] bg-[#F8FAFC] dark:bg-[#1E2536] p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#77786F]">
                    Support Recipient Email
                  </span>
                  <p className="mt-1 text-base font-black text-[#111111] dark:text-white">
                    {diagnostics.supportInbox}
                  </p>
                  <p className="text-xs text-[#55564E] dark:text-[#94A3B8] mt-1">
                    All contact messages and customer receipt copies route here.
                  </p>
                </div>

                <div className="rounded-xl border border-black/10 dark:border-[#333C52] bg-[#F8FAFC] dark:bg-[#1E2536] p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#77786F]">
                    Public Key (Frontend Checkout)
                  </span>
                  <p className="mt-1 font-mono text-xs font-bold text-[#111111] dark:text-white">
                    {diagnostics.publicKeyMasked}
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                    <CheckCircle2 className="h-3 w-3" /> Configured & Verified
                  </span>
                </div>

                <div className="rounded-xl border border-black/10 dark:border-[#333C52] bg-[#F8FAFC] dark:bg-[#1E2536] p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#77786F]">
                    Secret Key (Server Verification)
                  </span>
                  <p className="mt-1 font-mono text-xs font-bold text-[#111111] dark:text-white">
                    {diagnostics.secretKeyMasked}
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                    <CheckCircle2 className="h-3 w-3" /> Configured & Verified
                  </span>
                </div>
              </div>

              {/* Commercial Launch Checklist Box */}
              <div className="mt-6 rounded-xl border-2 border-black dark:border-[#333C52] bg-[#FEF9C3]/40 dark:bg-[#252110] p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#854D0E] dark:text-[#FBBF24]">
                  Commercial Market Launch Checklist
                </h3>
                <ul className="mt-2 space-y-1.5 text-xs text-[#55564E] dark:text-[#CBD5E1]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Paystack inline pop-up & redirect checkout gateway implemented</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Anti-tamper server-side verification and receipt generation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Strict quota enforcement (prevents deleted CV loophole)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Super user payment monitoring and candidate management back office</span>
                  </li>
                  <li className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold">
                    <span className="h-3.5 w-3.5 flex items-center justify-center rounded-full bg-amber-500 text-white text-[9px]">!</span>
                    <span>To activate live bank cards: replace <code className="font-mono">sk_test_...</code> with your live keys in Paystack Dashboard</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* ATS System Engine Configuration Card */}
            <div className="rounded-2xl border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#181C28] p-6 shadow-sticker">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight text-[#111111] dark:text-white flex items-center gap-2">
                    <Cpu className="h-5 w-5 text-[#173B30] dark:text-[#A7F3D0]" />
                    ATS System Engine &amp; AI Mode Policy
                  </h2>
                  <p className="text-xs text-[#55564E] dark:text-[#94A3B8] mt-0.5">
                    Control whether candidates use AI or Vitra&apos;s hard-coded deterministic ATS engine. Only Super Users can switch this setting.
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider self-start sm:self-auto border",
                    (data?.atsEngineMode || "user_choice") === "user_choice" &&
                    "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700",
                    data?.atsEngineMode === "deterministic_only" &&
                    "bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-700",
                    data?.atsEngineMode === "ai_only" &&
                    "bg-blue-100 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 border-blue-300 dark:border-blue-700"
                  )}
                >
                  {(data?.atsEngineMode || "user_choice") === "user_choice" && "Candidate Choice Active"}
                  {data?.atsEngineMode === "deterministic_only" && "Hard-Coded ATS Enforced (No AI)"}
                  {data?.atsEngineMode === "ai_only" && "AI Engine Enforced"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                {/* Option 1: Candidate Choice */}
                <div
                  onClick={() => handleSetAtsEngineMode("user_choice")}
                  className={cn(
                    "cursor-pointer rounded-xl border-2 p-4 transition-all relative select-none",
                    (data?.atsEngineMode || "user_choice") === "user_choice"
                      ? "border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/20 shadow-[2px_2px_0px_#059669]"
                      : "border-black/10 dark:border-[#333C52] hover:border-black/30 dark:hover:border-white/30"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-[#111111] dark:text-white flex items-center gap-1.5">
                      <SlidersHorizontal className="h-4 w-4 text-emerald-600" />
                      Candidate Choice
                    </span>
                    {(data?.atsEngineMode || "user_choice") === "user_choice" && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    )}
                  </div>
                  <p className="mt-2 text-xs text-[#55564E] dark:text-[#94A3B8] leading-relaxed">
                    Users can toggle between Hard-Coded Rule-Based ATS (instant, no AI token usage) and AI-Powered ATS inside their workspace.
                  </p>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetAtsEngineMode("user_choice");
                    }}
                    className="mt-4 w-full rounded-lg border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#1E2536] px-3 py-1.5 text-xs font-bold text-[#111111] dark:text-white shadow-[1.5px_1.5px_0px_#111111] hover:-translate-y-0.5 active:translate-y-0.5 cursor-pointer select-none"
                  >
                    Enable Candidate Choice
                  </button>
                </div>

                {/* Option 2: Deterministic Only (Hard-Coded) */}
                <div
                  onClick={() => handleSetAtsEngineMode("deterministic_only")}
                  className={cn(
                    "cursor-pointer rounded-xl border-2 p-4 transition-all relative select-none",
                    data?.atsEngineMode === "deterministic_only"
                      ? "border-amber-600 bg-amber-50/60 dark:bg-amber-950/20 shadow-[2px_2px_0px_#D97706]"
                      : "border-black/10 dark:border-[#333C52] hover:border-black/30 dark:hover:border-white/30"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-[#111111] dark:text-white flex items-center gap-1.5">
                      <Cpu className="h-4 w-4 text-amber-600" />
                      Hard-Coded ATS Only
                    </span>
                    {data?.atsEngineMode === "deterministic_only" && (
                      <CheckCircle2 className="h-4 w-4 text-amber-600" />
                    )}
                  </div>
                  <p className="mt-2 text-xs text-[#55564E] dark:text-[#94A3B8] leading-relaxed">
                    Completely disables external AI APIs for ATS. All tailoring, keyword extraction, and score audits use fast, deterministic offline rules.
                  </p>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetAtsEngineMode("deterministic_only");
                    }}
                    className="mt-4 w-full rounded-lg border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#1E2536] px-3 py-1.5 text-xs font-bold text-[#111111] dark:text-white shadow-[1.5px_1.5px_0px_#111111] hover:-translate-y-0.5 active:translate-y-0.5 cursor-pointer select-none"
                  >
                    Force Hard-Coded (Zero AI)
                  </button>
                </div>

                {/* Option 3: AI Only */}
                <div
                  onClick={() => handleSetAtsEngineMode("ai_only")}
                  className={cn(
                    "cursor-pointer rounded-xl border-2 p-4 transition-all relative select-none",
                    data?.atsEngineMode === "ai_only"
                      ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/20 shadow-[2px_2px_0px_#2563EB]"
                      : "border-black/10 dark:border-[#333C52] hover:border-black/30 dark:hover:border-white/30"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-[#111111] dark:text-white flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-blue-600" />
                      AI-Powered ATS Only
                    </span>
                    {data?.atsEngineMode === "ai_only" && (
                      <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <p className="mt-2 text-xs text-[#55564E] dark:text-[#94A3B8] leading-relaxed">
                    Enforces Gemini AI analysis across all candidate CV inspections and job tailoring without allowing rule-based fallback.
                  </p>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetAtsEngineMode("ai_only");
                    }}
                    className="mt-4 w-full rounded-lg border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#1E2536] px-3 py-1.5 text-xs font-bold text-[#111111] dark:text-white shadow-[1.5px_1.5px_0px_#111111] hover:-translate-y-0.5 active:translate-y-0.5 cursor-pointer select-none"
                  >
                    Force AI-Powered ATS
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: INSPECT TRANSACTION RECEIPT */}
      {inspectReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#181C28] p-6 sm:p-8 shadow-sticker">
            <WashiTape color="blue" angle="left" className="-top-3 left-8" />
            <button
              type="button"
              onClick={() => setInspectReceipt(null)}
              className="absolute top-4 right-4 rounded-lg border border-black/20 p-1.5 hover:bg-black/5"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="border-b-2 border-black/10 dark:border-white/10 pb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#1B3AFF]">
                Official Payment Receipt
              </span>
              <h3 className="text-xl font-black uppercase text-[#111111] dark:text-white">
                Vitra Document Studio
              </h3>
              <p className="text-xs text-[#77786F] dark:text-[#94A3B8]">
                Receipt Ref: {inspectReceipt.reference}
              </p>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-[#77786F] dark:text-[#94A3B8]">Candidate Email:</span>
                <span className="font-bold text-[#111111] dark:text-white">{inspectReceipt.userEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#77786F] dark:text-[#94A3B8]">Package Activated:</span>
                <span className="font-bold uppercase text-[#111111] dark:text-white">{inspectReceipt.planId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#77786F] dark:text-[#94A3B8]">Amount Paid:</span>
                <span className="font-black text-base font-mono text-[#111111] dark:text-white">
                  ₦{inspectReceipt.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#77786F] dark:text-[#94A3B8]">Payment Gateway:</span>
                <span className="font-bold text-[#111111] dark:text-white">Paystack Direct</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#77786F] dark:text-[#94A3B8]">Payment Channel:</span>
                <span className="font-bold capitalize text-[#111111] dark:text-white">
                  {inspectReceipt.channel || "card"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#77786F] dark:text-[#94A3B8]">Transaction Status:</span>
                <span className="font-bold uppercase text-emerald-600 dark:text-emerald-400">
                  {inspectReceipt.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#77786F] dark:text-[#94A3B8]">Date & Time:</span>
                <span className="font-bold text-[#111111] dark:text-white">
                  {new Date(inspectReceipt.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="border-t-2 border-black/10 dark:border-white/10 pt-4 flex gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-lg border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#1E2536] text-xs font-bold text-[#111111] dark:text-white shadow-[2px_2px_0px_#111111] hover:-translate-y-0.5 active:translate-y-0.5 flex items-center justify-center gap-1.5"
              >
                <Printer className="h-4 w-4" />
                <span>Print Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => setInspectReceipt(null)}
                className="flex-1 py-2.5 rounded-lg border-2 border-black dark:border-[#333C52] bg-[#111111] dark:bg-[#1E2536] text-white dark:text-white text-xs font-bold shadow-[2px_2px_0px_#1B3AFF] hover:-translate-y-0.5 active:translate-y-0.5"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MANAGE CANDIDATE (OVERRIDE PLAN / GRANT CVs / VERIFY EMAIL / TOGGLE ROLE) */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#181C28] p-6 shadow-sticker">
            <WashiTape color="pink" angle="right" className="-top-3 left-8" />
            <button
              type="button"
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 rounded-lg border border-black/20 p-1.5 hover:bg-black/5"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="text-xl font-black uppercase text-[#111111] dark:text-white">
              Manage Candidate
            </h3>
            <p className="text-xs text-[#55564E] dark:text-[#94A3B8]">
              {selectedUser.fullName} ({selectedUser.email})
            </p>

            <div className="mt-6 space-y-6 text-xs">
              {/* Action 1: Override Plan Tier */}
              <div className="rounded-xl border border-black/10 dark:border-[#333C52] p-4 bg-[#F8FAFC] dark:bg-[#1E2536]">
                <h4 className="font-bold text-[#111111] dark:text-white mb-2">
                  Override Package Tier & CV Quota
                </h4>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-[10px] font-bold text-[#77786F] block mb-1">
                      PLAN TIER
                    </label>
                    <select
                      value={overridePlanTier}
                      onChange={(e) => {
                        const tier = e.target.value as any;
                        setOverridePlanTier(tier);
                        if (tier === "starter") setOverrideMaxCvs(3);
                        if (tier === "pro") setOverrideMaxCvs(5);
                        if (tier === "executive") setOverrideMaxCvs(7);
                        if (tier === "none") setOverrideMaxCvs(0);
                      }}
                      className="w-full px-2.5 py-1.5 rounded border border-black/20 dark:border-[#333C52] bg-white dark:bg-[#181C28] font-bold text-[#111111] dark:text-white text-xs"
                    >
                      <option value="starter">Starter (3 CVs)</option>
                      <option value="pro">Pro (5 CVs)</option>
                      <option value="executive">Executive (7 CVs)</option>
                      <option value="none">No Plan (0 Paid CVs)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#77786F] block mb-1">
                      MAX CV ALLOWANCE
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={overrideMaxCvs}
                      onChange={(e) => setOverrideMaxCvs(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded border border-black/20 dark:border-[#333C52] bg-white dark:bg-[#181C28] font-bold text-[#111111] dark:text-white text-xs"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleOverridePlan}
                  disabled={actionLoading}
                  className="w-full py-2 rounded-lg border-2 border-black dark:border-[#333C52] bg-[#111111] dark:bg-[#1E2536] text-white dark:text-white font-bold shadow-[2px_2px_0px_#1B3AFF] hover:-translate-y-0.5 active:translate-y-0.5 disabled:opacity-50"
                >
                  Save Plan Override
                </button>
              </div>

              {/* Action 2: Grant Bonus CVs */}
              <div className="rounded-xl border border-black/10 dark:border-[#333C52] p-4 bg-[#F8FAFC] dark:bg-[#1E2536]">
                <h4 className="font-bold text-[#111111] dark:text-white mb-2">
                  Grant Bonus CV Generations
                </h4>
                <div className="flex gap-2 items-center mb-3">
                  {[1, 3, 5].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setBonusCvsCount(cnt)}
                      className={cn(
                        "flex-1 py-1.5 rounded border text-xs font-bold",
                        bonusCvsCount === cnt
                          ? "border-black bg-black text-white dark:bg-[#1E2536] dark:border-[#333C52] dark:text-white"
                          : "border-black/20 bg-white dark:bg-[#181C28] text-[#111111] dark:text-white"
                      )}
                    >
                      +{cnt} CVs
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleGrantBonusCvs}
                  disabled={actionLoading}
                  className="w-full py-2 rounded-lg border-2 border-black dark:border-[#333C52] bg-[#F8D849] text-black font-bold shadow-[2px_2px_0px_#000] hover:-translate-y-0.5 active:translate-y-0.5 disabled:opacity-50"
                >
                  Grant +{bonusCvsCount} Generations
                </button>
              </div>

              {/* Action 3: Quick Utilities */}
              <div className="flex gap-2">
                {!selectedUser.emailVerified && (
                  <button
                    type="button"
                    onClick={handleVerifyEmail}
                    disabled={actionLoading}
                    className="flex-1 py-2 rounded-lg border-2 border-emerald-600 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold hover:-translate-y-0.5 active:translate-y-0.5"
                  >
                    Verify Email Manually
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleToggleRole(selectedUser.role === "admin" ? "user" : "admin")}
                  disabled={actionLoading}
                  className="flex-1 py-2 rounded-lg border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#181C28] font-bold text-[#111111] dark:text-white shadow-[2px_2px_0px_#111111] hover:-translate-y-0.5 active:translate-y-0.5"
                >
                  {selectedUser.role === "admin" ? "Demote to User" : "Promote to Admin"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM CLEAR ALL PAYMENTS */}
      {confirmClearPayments && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl border-2 border-red-600 bg-white dark:bg-[#181C28] p-6 shadow-sticker">
            <WashiTape color="pink" angle="left" className="-top-3 left-8" />
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-lg font-black uppercase">
                Clear Payment Records?
              </h3>
            </div>
            <p className="text-xs text-[#55564E] dark:text-[#94A3B8]">
              This will erase all transaction logs and receipt records from the system. This action is irreversible.
            </p>

            <div className="mt-4 p-3 rounded-lg border border-black/10 dark:border-white/10 bg-[#F8FAFC] dark:bg-[#1E2536]">
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={resetUsersOnClear}
                  onChange={(e) => setResetUsersOnClear(e.target.checked)}
                  className="rounded border-black"
                />
                <span>Also reset subscriber plans back to 0 CVs</span>
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmClearPayments(false)}
                className="flex-1 py-2.5 rounded-lg border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#1E2536] text-xs font-bold text-[#111111] dark:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAllPayments}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-lg border-2 border-red-600 bg-red-600 text-white text-xs font-bold shadow-[2px_2px_0px_#991B1B] hover:-translate-y-0.5 active:translate-y-0.5 disabled:opacity-50"
              >
                {actionLoading ? "Clearing..." : "Yes, Clear Payments"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

