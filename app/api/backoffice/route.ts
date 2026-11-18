import { NextResponse } from "next/server";
import { getAuthenticatedUser, isSuperUser, SUPERUSER_EMAILS } from "@/lib/auth/session";
import { localDevDb } from "@/lib/data/local-dev-store";
import { maskEmail } from "@/lib/email";
import { isSupabaseConfigured } from "@/lib/config/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user || !isSuperUser(user)) {
      return NextResponse.json(
        { ok: false, error: "Not found" },
        { status: 404 }
      );
    }

    let dbUsers: any[] = [];
    let dbTxs: any[] = [];
    let dbCvs: any[] = [];
    let dbPendingOtps: any[] = [];
    let dbAuthEvents: any[] = [];

    // Query live Supabase PostgreSQL database
    if (isSupabaseConfigured()) {
      try {
        const supabaseAdmin = createSupabaseAdminClient();
        if (supabaseAdmin) {
          // 1. Fetch profiles
          const { data: profiles, error: pErr } = await supabaseAdmin
            .from("profiles")
            .select("*")
            .order("created_at", { ascending: false });
          if (pErr) console.error("[BackOffice] Profiles fetch error:", pErr);

          // 2. Fetch auth.users to resolve email confirmation and last sign in
          let authUsers: any[] = [];
          try {
            const { data: authData, error: aErr } = await supabaseAdmin.auth.admin.listUsers({
              page: 1,
              perPage: 1000,
            });
            if (!aErr && authData?.users) {
              authUsers = authData.users;
            }
          } catch (authErr) {
            console.error("[BackOffice] Auth users list error:", authErr);
          }
          const authMap = new Map<string, any>(authUsers.map((u) => [u.id, u]));

          // 3. Fetch CVs
          const { data: cvs, error: cvErr } = await supabaseAdmin
            .from("cvs")
            .select("id, user_id, title, template_id, status, created_at, updated_at")
            .order("updated_at", { ascending: false });
          if (cvErr) console.error("[BackOffice] CVs fetch error:", cvErr);
          dbCvs = cvs || [];

          // Count CVs per user
          const cvCountMap = new Map<string, number>();
          for (const c of dbCvs) {
            if (c.user_id) {
              cvCountMap.set(c.user_id, (cvCountMap.get(c.user_id) || 0) + 1);
            }
          }

          // Map profiles into Candidate directory format
          const profileList = profiles || [];
          const seenUserIds = new Set<string>();

          for (const p of profileList) {
            seenUserIds.add(p.id);
            const authUser = authMap.get(p.id);
            const email = (p.email || authUser?.email || "").trim();
            const normalizedEmail = email.toLowerCase();
            const isOwner = SUPERUSER_EMAILS.has(normalizedEmail);
            const emailVerified = Boolean(
              authUser?.email_confirmed_at || authUser?.confirmed_at || isOwner
            );
            const cvCount = Math.max(Number(p.generated_cvs_count) || 0, cvCountMap.get(p.id) || 0);
            const role = isOwner ? "admin" : ((p.role as "user" | "admin") || "user");
            const planId = isOwner ? (p.plan_id || "executive") : (p.plan_id || null);
            const maxCvs = isOwner ? Math.max(999, Number(p.max_cvs) || 999) : (Number(p.max_cvs) || 0);

            dbUsers.push({
              id: p.id,
              email,
              fullName:
                p.full_name?.trim() ||
                (authUser?.user_metadata?.full_name as string | undefined)?.trim() ||
                (email ? email.split("@")[0] : "Candidate"),
              country: p.country || "Nigeria",
              role,
              emailVerified,
              planId,
              maxCvs,
              generatedCvsCount: cvCount,
              planPurchasedAt: p.plan_purchased_at || (isOwner ? p.created_at : null),
              createdAt: p.created_at || authUser?.created_at || new Date().toISOString(),
              updatedAt: p.updated_at || authUser?.updated_at || new Date().toISOString(),
            });
          }

          // Include any registered auth users who don't yet have a public.profiles row
          for (const au of authUsers) {
            if (!seenUserIds.has(au.id)) {
              seenUserIds.add(au.id);
              const email = (au.email || "").trim();
              const normalizedEmail = email.toLowerCase();
              const isOwner = SUPERUSER_EMAILS.has(normalizedEmail);
              const cvCount = cvCountMap.get(au.id) || 0;
              dbUsers.push({
                id: au.id,
                email,
                fullName:
                  (au.user_metadata?.full_name as string | undefined)?.trim() ||
                  (email ? email.split("@")[0] : "Candidate"),
                country: "Nigeria",
                role: isOwner ? "admin" : ((au.app_metadata?.role as "user" | "admin") || "user"),
                emailVerified: Boolean(au.email_confirmed_at || au.confirmed_at || isOwner),
                planId: isOwner ? "executive" : null,
                maxCvs: isOwner ? 999 : 0,
                generatedCvsCount: cvCount,
                planPurchasedAt: null,
                createdAt: au.created_at,
                updatedAt: au.updated_at || au.created_at,
              });
            }
          }

          // 4. Fetch Payments
          const { data: payments, error: payErr } = await supabaseAdmin
            .from("payments")
            .select("*")
            .order("created_at", { ascending: false });
          if (payErr) console.error("[BackOffice] Payments fetch error:", payErr);

          dbTxs = (payments || []).map((pay) => {
            const u = dbUsers.find((user) => user.id === pay.user_id);
            // If stored in Kobo (> 50,000), convert to Naira
            const amountNaira = pay.amount > 50000 ? Math.round(pay.amount / 100) : pay.amount;
            return {
              id: pay.id,
              reference: pay.reference,
              userId: pay.user_id,
              userEmail: u?.email || "candidate@vitra.app",
              planId: pay.plan_id as "starter" | "pro" | "executive",
              amount: amountNaira,
              currency: pay.currency || "NGN",
              status: (pay.status as "success" | "failed" | "pending" | "abandoned") || "success",
              channel: "card",
              gatewayResponse: "Approved",
              createdAt: pay.created_at,
              verifiedAt: pay.created_at,
            };
          });

          // 5. Fetch Pending OTPs
          const { data: otps, error: otpErr } = await supabaseAdmin
            .from("auth_otps")
            .select("*")
            .gt("expires_at", new Date().toISOString())
            .order("created_at", { ascending: false });
          if (otpErr) console.error("[BackOffice] OTPs fetch error:", otpErr);
          dbPendingOtps = (otps || []).map((o) => ({
            email: o.email,
            code: o.code,
            expiresAt: o.expires_at,
            attempts: o.attempts || 0,
          }));

          // 6. Real-time Auth & System Events from Supabase
          for (const au of authUsers) {
            dbAuthEvents.push({
              id: `signup_${au.id}`,
              eventType: "signup",
              email: au.email || "",
              userId: au.id,
              details: `Candidate registered on Vitra (${Boolean(au.email_confirmed_at || au.confirmed_at) ? "Email Verified" : "Verification Pending"})`,
              status: "success",
              createdAt: au.created_at,
            });
            if (au.last_sign_in_at) {
              dbAuthEvents.push({
                id: `login_${au.id}_${new Date(au.last_sign_in_at).getTime()}`,
                eventType: "login_success",
                email: au.email || "",
                userId: au.id,
                details: `Candidate signed in to workspace`,
                status: "success",
                createdAt: au.last_sign_in_at,
              });
            }
          }

          // OTP Events
          const { data: allOtps } = await supabaseAdmin
            .from("auth_otps")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(50);
          for (const o of allOtps || []) {
            dbAuthEvents.push({
              id: `otp_${o.id}`,
              eventType: "otp_sent",
              email: o.email,
              userId: o.user_id,
              details: `6-digit OTP verification dispatched via Gmail SMTP (Code: ${o.code})`,
              status: "success",
              createdAt: o.created_at,
            });
          }

          // AI Generation Logs
          const { data: aiLogs } = await supabaseAdmin
            .from("ai_usage_logs")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(50);
          for (const l of aiLogs || []) {
            const u = dbUsers.find((user) => user.id === l.user_id);
            dbAuthEvents.push({
              id: `ai_${l.id}`,
              eventType: "admin_action",
              email: u?.email || "candidate@vitra.app",
              userId: l.user_id,
              details: `AI Generation: ${l.operation || "summary"} via ${l.model || "gemini"}`,
              status: l.status === "failed" ? "failed" : "success",
              createdAt: l.created_at,
            });
          }
        }
      } catch (sbErr) {
        console.error("[BackOffice] Supabase query exception:", sbErr);
      }
    }

    // Merge with localDevDb (graceful fallback and deduplication)
    const localUsers = localDevDb.listAllUsers();
    const localTxs = localDevDb.listAllTransactions();
    const localCvs = localDevDb.listAllCvs();
    const localAuthLogs = localDevDb.listAuthEvents(200);
    const localPendingOtps = localDevDb.listPendingOtps();
    const supportInquiries = localDevDb.listSupportInquiries();
    const receiptEmails = localDevDb.listReceiptEmails();

    // Deduplicate Users by Email (case-insensitive)
    const userMap = new Map<string, any>();
    for (const u of dbUsers) {
      if (u.email) userMap.set(u.email.toLowerCase(), u);
    }
    for (const lu of localUsers) {
      const emailLower = (lu.email || "").toLowerCase();
      if (emailLower && !userMap.has(emailLower)) {
        userMap.set(emailLower, {
          id: lu.id,
          email: lu.email,
          fullName: lu.fullName,
          country: lu.country,
          role: lu.role,
          emailVerified: lu.emailVerified,
          planId: lu.planId || null,
          maxCvs: lu.maxCvs || 0,
          generatedCvsCount: localDevDb.getGeneratedCvsCount(lu.id),
          planPurchasedAt: lu.planPurchasedAt || null,
          createdAt: lu.createdAt,
          updatedAt: lu.updatedAt,
        });
      }
    }
    const allUsers = Array.from(userMap.values());

    // Deduplicate Transactions by Reference
    const txMap = new Map<string, any>();
    for (const t of dbTxs) {
      txMap.set(t.reference, t);
    }
    for (const lt of localTxs) {
      if (!txMap.has(lt.reference)) {
        txMap.set(lt.reference, lt);
      }
    }
    const allTxs = Array.from(txMap.values());

    // Deduplicate CVs by ID
    const cvMap = new Map<string, any>();
    for (const c of dbCvs) {
      cvMap.set(c.id, {
        id: c.id,
        userId: c.user_id,
        user_id: c.user_id,
        title: c.title,
        templateId: c.template_id,
        template_id: c.template_id,
        status: c.status,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      });
    }
    for (const lc of localCvs) {
      if (!cvMap.has(lc.id)) {
        cvMap.set(lc.id, lc);
      }
    }
    const allCvs = Array.from(cvMap.values());

    // Deduplicate Pending OTPs by Email
    const otpMap = new Map<string, any>();
    for (const o of dbPendingOtps) {
      otpMap.set(o.email.toLowerCase(), o);
    }
    for (const lo of localPendingOtps) {
      const emailLower = (lo.email || "").toLowerCase();
      if (emailLower && !otpMap.has(emailLower)) {
        otpMap.set(emailLower, lo);
      }
    }
    const pendingOtps = Array.from(otpMap.values());

    // Merge and sort Real-time Auth Logs
    const authLogs = [...dbAuthEvents, ...localAuthLogs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

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
      (sum, u) => sum + (Number(u.generatedCvsCount) || 0),
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
        : "support@vitra.app",
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
      users: allUsers,
      pendingOtps,
      supportInquiries,
      recentCvs: allCvs,
      receiptEmails,
      gatewayDiagnostics,
      atsEngineMode: localDevDb.getAtsEngineMode(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load back office data.";
    console.error("[BackOffice GET Error]:", error);
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
    const supabaseAdmin = isSupabaseConfigured() ? createSupabaseAdminClient() : null;

    if (action === "override_plan") {
      const { userId, planId, maxCvs } = body;
      if (!userId) {
        return NextResponse.json({ ok: false, error: "Candidate ID is required." }, { status: 400 });
      }

      let candidateEmail = "";
      if (supabaseAdmin) {
        const { data: prof } = await supabaseAdmin
          .from("profiles")
          .select("email")
          .eq("id", userId)
          .maybeSingle();
        candidateEmail = prof?.email || "";

        await supabaseAdmin
          .from("profiles")
          .update({
            plan_id: planId || null,
            max_cvs: Number(maxCvs) || 0,
            plan_purchased_at: planId ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);
      }

      const updated = localDevDb.overrideUserPlan(userId, planId, Number(maxCvs) || 0);
      const emailForLog = candidateEmail || updated?.email || userId;

      localDevDb.recordAuthEvent({
        eventType: "admin_action",
        email: user.email,
        userId: user.id,
        details: `Super User overridden plan for ${emailForLog}: ${planId || "none"} (${maxCvs} CVs)`,
        status: "warning",
      });

      return NextResponse.json({
        ok: true,
        user: updated || { id: userId, email: emailForLog, planId, maxCvs: Number(maxCvs) || 0 },
      });
    }

    if (action === "grant_bonus_cvs") {
      const { userId, bonusCount } = body;
      if (!userId || typeof bonusCount !== "number") {
        return NextResponse.json({ ok: false, error: "Candidate ID and bonus count are required." }, { status: 400 });
      }

      let candidateEmail = "";
      let newMax = 0;
      if (supabaseAdmin) {
        const { data: prof } = await supabaseAdmin
          .from("profiles")
          .select("email, max_cvs")
          .eq("id", userId)
          .maybeSingle();
        candidateEmail = prof?.email || "";
        newMax = (Number(prof?.max_cvs) || 0) + bonusCount;

        await supabaseAdmin
          .from("profiles")
          .update({
            max_cvs: newMax,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);
      }

      const updated = localDevDb.grantBonusCvs(userId, bonusCount);
      const emailForLog = candidateEmail || updated?.email || userId;

      localDevDb.recordAuthEvent({
        eventType: "admin_action",
        email: user.email,
        userId: user.id,
        details: `Super User granted ${bonusCount} bonus CVs to ${emailForLog} (New Max: ${newMax || updated?.maxCvs || bonusCount})`,
        status: "success",
      });

      return NextResponse.json({
        ok: true,
        user: updated || { id: userId, email: emailForLog, maxCvs: newMax },
      });
    }

    if (action === "verify_user_email") {
      const { userId } = body;
      if (!userId) {
        return NextResponse.json({ ok: false, error: "Candidate ID is required." }, { status: 400 });
      }

      let candidateEmail = "";
      if (supabaseAdmin) {
        const { data: prof } = await supabaseAdmin
          .from("profiles")
          .select("email")
          .eq("id", userId)
          .maybeSingle();
        candidateEmail = prof?.email || "";

        await supabaseAdmin.auth.admin.updateUserById(userId, {
          email_confirm: true,
        });

        // Clean up pending OTPs for this verified candidate
        if (candidateEmail) {
          await supabaseAdmin
            .from("auth_otps")
            .delete()
            .or(`user_id.eq.${userId},email.eq.${candidateEmail}`);
        } else {
          await supabaseAdmin
            .from("auth_otps")
            .delete()
            .eq("user_id", userId);
        }
      }

      const updated = localDevDb.verifyUserEmailManually(userId);
      const emailForLog = candidateEmail || updated?.email || userId;

      localDevDb.recordAuthEvent({
        eventType: "admin_action",
        email: user.email,
        userId: user.id,
        details: `Super User manually verified email for ${emailForLog}`,
        status: "success",
      });

      return NextResponse.json({
        ok: true,
        user: updated || { id: userId, email: emailForLog, emailVerified: true },
      });
    }

    if (action === "toggle_role") {
      const { userId, role } = body;
      if (!userId || (role !== "admin" && role !== "user")) {
        return NextResponse.json({ ok: false, error: "Valid User ID and role ('user' | 'admin') required." }, { status: 400 });
      }

      let candidateEmail = "";
      if (supabaseAdmin) {
        const { data: prof } = await supabaseAdmin
          .from("profiles")
          .select("email")
          .eq("id", userId)
          .maybeSingle();
        candidateEmail = prof?.email || "";

        await supabaseAdmin
          .from("profiles")
          .update({
            role,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        await supabaseAdmin.auth.admin.updateUserById(userId, {
          app_metadata: { role },
        });
      }

      const updated = localDevDb.updateUserRole(userId, role);
      const emailForLog = candidateEmail || updated?.email || userId;

      localDevDb.recordAuthEvent({
        eventType: "admin_action",
        email: user.email,
        userId: user.id,
        details: `Super User changed role for ${emailForLog} to '${role}'`,
        status: "warning",
      });

      return NextResponse.json({
        ok: true,
        user: updated || { id: userId, email: emailForLog, role },
      });
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
      let transactionsCleared = 0;
      let usersReset = 0;

      if (supabaseAdmin) {
        const { data: deleted } = await supabaseAdmin
          .from("payments")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000")
          .select("id");
        transactionsCleared += deleted?.length || 0;

        if (resetUserPlans) {
          const { data: resetProfs } = await supabaseAdmin
            .from("profiles")
            .update({
              plan_id: null,
              max_cvs: 0,
              plan_purchased_at: null,
              updated_at: new Date().toISOString(),
            })
            .neq("role", "admin")
            .select("id");
          usersReset += resetProfs?.length || 0;
        }
      }

      const localRes = localDevDb.clearAllPayments(Boolean(resetUserPlans));
      transactionsCleared += localRes.transactionsCleared;
      usersReset += localRes.usersReset;

      localDevDb.recordAuthEvent({
        eventType: "admin_action",
        email: user.email,
        userId: user.id,
        details: `Super User cleared all payment history (${transactionsCleared} cleared, ${usersReset} users reset)`,
        status: "warning",
      });

      return NextResponse.json({ ok: true, transactionsCleared, usersReset });
    }

    return NextResponse.json({ ok: false, error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Back office action failed.";
    console.error("[BackOffice POST Error]:", error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
