import { NextResponse } from "next/server";
import { getAuthenticatedUser, isSuperUser } from "@/lib/auth/session";
import { localDevDb, LocalUser } from "@/lib/data/local-dev-store";
import { maskEmail } from "@/lib/email";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user || !isSuperUser(user)) {
      return NextResponse.json(
        { ok: false, error: "Not found" },
        { status: 404 }
      );
    }

    const allUsers = localDevDb.listAllUsers();
    const allTxs = localDevDb.listAllTransactions();
    const allCvs = localDevDb.listAllCvs();
    const authLogs = localDevDb.listAuthEvents(200);
    const pendingOtps = localDevDb.listPendingOtps();
    const supportInquiries = localDevDb.listSupportInquiries();
    const receiptEmails = localDevDb.listReceiptEmails();

    // Calculate Financial and Operational KPIs
    const successfulTxs = allTxs.filter((t) => t.status === "success");
    const totalRevenueNaira = successfulTxs.reduce((sum, t) => sum + (t.amount || 0), 0);

    const planBreakdown = {
      starter: {
        count: successfulTxs.filter((t) => t.planId === "starter").length,
        revenue: successfulTxs.filter((t) => t.planId === "starter").reduce((sum, t) => sum + (t.amount || 0), 0),
      },
      pro: {
        count: successfulTxs.filter((t) => t.planId === "pro").length,
        revenue: successfulTxs.filter((t) => t.planId === "pro").reduce((sum, t) => sum + (t.amount || 0), 0),
      },
      executive: {
        count: successfulTxs.filter((t) => t.planId === "executive").length,
        revenue: successfulTxs.filter((t) => t.planId === "executive").reduce((sum, t) => sum + (t.amount || 0), 0),
      },
    };

    const payingCandidates = allUsers.filter((u) => Boolean(u.planId && u.maxCvs > 0)).length;
    const verifiedUsers = allUsers.filter((u) => u.emailVerified).length;
    const totalCvsGenerated = allUsers.reduce(
      (sum, u) => sum + (u.generatedCvsCount || localDevDb.getGeneratedCvsCount(u.id)),
      0
    );

    const secretKey = process.env.PAYSTACK_SECRET_KEY?.trim() || "";
    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY?.trim() || "";

    const gatewayDiagnostics = {
      provider: "Paystack",
      isLiveKey: secretKey.startsWith("sk_live_"),
      isTestKey: secretKey.startsWith("sk_test_"),
      secretKeyConfigured: Boolean(secretKey),
      publicKeyConfigured: Boolean(publicKey),
      secretKeyMasked: secretKey ? `${secretKey.slice(0, 10)}...${secretKey.slice(-6)}` : "Not configured",
      publicKeyMasked: publicKey ? `${publicKey.slice(0, 10)}...${publicKey.slice(-6)}` : "Not configured",
      emailSmtpConfigured: Boolean(
        process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.RESEND_API_KEY
      ),
      supportInbox: process.env.SUPPORT_RECIPIENT_EMAIL
        ? maskEmail(process.env.SUPPORT_RECIPIENT_EMAIL)
        : "Configured Support Desk",
    };

    return NextResponse.json({
      ok: true,
      superUser: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      summary: {
        totalRevenueNaira,
        totalTransactions: allTxs.length,
        successfulTransactions: successfulTxs.length,
        totalCandidates: allUsers.length,
        payingCandidates,
        verifiedUsers,
        totalCvsGenerated,
        totalActiveCvs: allCvs.length,
        pendingOtpCount: pendingOtps.length,
        supportInquiryCount: supportInquiries.length,
        planBreakdown,
      },
      transactions: allTxs,
      authLogs,
      users: allUsers.map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        country: u.country,
        role: u.role,
        emailVerified: u.emailVerified,
        planId: u.planId || null,
        maxCvs: u.maxCvs || 0,
        generatedCvsCount: localDevDb.getGeneratedCvsCount(u.id),
        planPurchasedAt: u.planPurchasedAt || null,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      })),
      pendingOtps,
      supportInquiries,
      recentCvs: allCvs,
      receiptEmails,
      gatewayDiagnostics,
      atsEngineMode: localDevDb.getAtsEngineMode(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load back office data.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || !isSuperUser(user)) {
      return NextResponse.json(
        { ok: false, error: "Not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === "override_plan") {
      const { userId, planId, maxCvs } = body;
      if (!userId) {
        return NextResponse.json({ ok: false, error: "Candidate ID is required." }, { status: 400 });
      }
      const updated = localDevDb.overrideUserPlan(userId, planId, Number(maxCvs) || 0);
      if (!updated) {
        return NextResponse.json({ ok: false, error: "Candidate not found." }, { status: 404 });
      }
      localDevDb.recordAuthEvent({
        eventType: "admin_action",
        email: user.email,
        userId: user.id,
        details: `Super User overridden plan for ${updated.email}: ${planId || "none"} (${maxCvs} CVs)`,
        status: "warning",
      });
      return NextResponse.json({ ok: true, user: updated });
    }

    if (action === "grant_bonus_cvs") {
      const { userId, bonusCount } = body;
      if (!userId || typeof bonusCount !== "number") {
        return NextResponse.json({ ok: false, error: "Candidate ID and bonus count are required." }, { status: 400 });
      }
      const updated = localDevDb.grantBonusCvs(userId, bonusCount);
      if (!updated) {
        return NextResponse.json({ ok: false, error: "Candidate not found." }, { status: 404 });
      }
      localDevDb.recordAuthEvent({
        eventType: "admin_action",
        email: user.email,
        userId: user.id,
        details: `Super User granted ${bonusCount} bonus CVs to ${updated.email} (New Max: ${updated.maxCvs})`,
        status: "success",
      });
      return NextResponse.json({ ok: true, user: updated });
    }

    if (action === "verify_user_email") {
      const { userId } = body;
      if (!userId) {
        return NextResponse.json({ ok: false, error: "Candidate ID is required." }, { status: 400 });
      }
      const updated = localDevDb.verifyUserEmailManually(userId);
      if (!updated) {
        return NextResponse.json({ ok: false, error: "Candidate not found." }, { status: 404 });
      }
      localDevDb.recordAuthEvent({
        eventType: "admin_action",
        email: user.email,
        userId: user.id,
        details: `Super User manually verified email for ${updated.email}`,
        status: "success",
      });
      return NextResponse.json({ ok: true, user: updated });
    }

    if (action === "toggle_role") {
      const { userId, role } = body;
      if (!userId || (role !== "admin" && role !== "user")) {
        return NextResponse.json({ ok: false, error: "Valid User ID and role ('user' | 'admin') required." }, { status: 400 });
      }
      const updated = localDevDb.updateUserRole(userId, role);
      if (!updated) {
        return NextResponse.json({ ok: false, error: "Candidate not found." }, { status: 404 });
      }
      localDevDb.recordAuthEvent({
        eventType: "admin_action",
        email: user.email,
        userId: user.id,
        details: `Super User changed role for ${updated.email} to '${role}'`,
        status: "warning",
      });
      return NextResponse.json({ ok: true, user: updated });
    }

    if (action === "set_ats_engine_mode") {
      const { mode } = body;
      if (mode !== "user_choice" && mode !== "deterministic_only" && mode !== "ai_only") {
        return NextResponse.json(
          { ok: false, error: "Invalid ATS engine mode. Choose 'user_choice', 'deterministic_only', or 'ai_only'." },
          { status: 400 }
        );
      }
      const updatedMode = localDevDb.setAtsEngineMode(mode);
      localDevDb.recordAuthEvent({
        eventType: "admin_action",
        email: user.email,
        userId: user.id,
        details: `Super User changed ATS System Mode to '${updatedMode}'`,
        status: "warning",
      });
      return NextResponse.json({ ok: true, atsEngineMode: updatedMode });
    }

    if (action === "clear_all_payments") {
      const { resetUserPlans } = body;
      const res = localDevDb.clearAllPayments(Boolean(resetUserPlans));
      localDevDb.recordAuthEvent({
        eventType: "admin_action",
        email: user.email,
        userId: user.id,
        details: `Super User cleared all payment history (${res.transactionsCleared} cleared, ${res.usersReset} users reset)`,
        status: "warning",
      });
      return NextResponse.json({ ok: true, ...res });
    }

    return NextResponse.json({ ok: false, error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Back office action failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

