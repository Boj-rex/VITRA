import { type PricingPlanId, getPlanById } from "@/types/pricing";
import { isLocalDevModeAllowed, isSupabaseConfigured } from "@/lib/config/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { localDevDb } from "@/lib/data/local-dev-store";
import { sendPaymentReceiptEmail } from "@/lib/email";

export interface CheckoutInitResult {
  ok: boolean;
  authorizationUrl?: string;
  accessCode?: string;
  reference: string;
  isSimulated: boolean;
  error?: string;
}

export interface VerifyTransactionResult {
  ok: boolean;
  status: "success" | "failed" | "abandoned" | "pending";
  reference: string;
  amountNaira: number;
  planId: PricingPlanId;
  channel?: string;
  paidAt: string;
  customerEmail: string;
  customerName?: string;
  receiptNumber: string;
  gatewayResponse?: string;
  isSimulated: boolean;
  error?: string;
}

export interface ActivatePlanInput {
  userId?: string;
  email?: string;
  fullName?: string;
  planId: PricingPlanId;
  reference: string;
  amountNaira?: number;
  channel?: string;
}

export interface PlanActivationResult {
  ok: boolean;
  receiptNumber: string;
  planId: PricingPlanId;
  maxCvs: number;
  emailDispatched: boolean;
  error?: string;
}

export function generateReceiptNumber(reference: string): string {
  const cleanRef = reference.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();
  const year = new Date().getFullYear();
  return `VIT-REC-${year}-${cleanRef || Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export const paystackService = {
  isConfigured(): boolean {
    return Boolean(process.env.PAYSTACK_SECRET_KEY?.trim());
  },

  getPublicKey(): string {
    return process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY?.trim() || "";
  },

  /**
   * Initializes a Paystack checkout transaction.
   * If PAYSTACK_SECRET_KEY is configured, calls the official Paystack API.
   * If in local development without keys, returns an honest development fallback URL.
   */
  async initializeCheckout(input: {
    userId?: string;
    email: string;
    fullName?: string;
    planId: PricingPlanId;
    callbackUrl: string;
    quantity?: number;
  }): Promise<CheckoutInitResult> {
    const plan = getPlanById(input.planId);
    if (!plan) {
      return { ok: false, reference: "", isSimulated: false, error: "Invalid pricing plan selected." };
    }

    const qty = Math.max(1, input.quantity || 1);
    const totalNaira = plan.priceNaira * qty;
    const totalCvs = plan.maxCvs * qty;
    const reference = `vitra_${plan.id}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const secretKey = process.env.PAYSTACK_SECRET_KEY?.trim();

    // 1. Real Paystack Transaction Initialization
    if (secretKey) {
      try {
        const res = await fetch("https://api.paystack.co/transaction/initialize", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: input.email.trim(),
            amount: totalNaira * 100, // Paystack requires amount in Kobo
            reference,
            callback_url: input.callbackUrl,
            metadata: {
              userId: input.userId || null,
              fullName: input.fullName || null,
              planId: plan.id,
              quantity: qty,
              maxCvs: totalCvs,
              planName: qty > 1 ? `${plan.name} × ${qty}` : plan.name,
              custom_fields: [
                {
                  display_name: "Plan Package",
                  variable_name: "plan_name",
                  value: qty > 1 ? `${plan.name} (Qty: ${qty})` : plan.name,
                },
                {
                  display_name: "CV Allowance",
                  variable_name: "cv_allowance",
                  value: `Up to ${totalCvs} CVs`,
                },
              ],
            },
          }),
        });

        const data = await res.json();
        if (data.status && data.data?.authorization_url) {
          return {
            ok: true,
            authorizationUrl: data.data.authorization_url,
            accessCode: data.data.access_code,
            reference,
            isSimulated: false,
          };
        }

        console.error("[Paystack] Initialization returned error:", data);
        return {
          ok: false,
          reference,
          isSimulated: false,
          error: data.message || "Failed to initialize Paystack transaction.",
        };
      } catch (err) {
        console.error("[Paystack] Network exception during initialize:", err);
      }
    }

    // 2. Local Development Fallback
    const fallbackUrl = new URL(input.callbackUrl);
    fallbackUrl.searchParams.set("reference", reference);
    fallbackUrl.searchParams.set("simulated", "true");
    fallbackUrl.searchParams.set("plan", plan.id);

    return {
      ok: true,
      authorizationUrl: fallbackUrl.toString(),
      reference,
      isSimulated: true,
    };
  },

  /**
   * Verifies a Paystack transaction by its reference.
   */
  async verifyTransaction(reference: string, expectedPlanId?: PricingPlanId): Promise<VerifyTransactionResult> {
    const secretKey = process.env.PAYSTACK_SECRET_KEY?.trim();
    const isSimulatedRef = reference.startsWith("sim_") || reference.startsWith("demo_") || reference.includes("simulated");

    // 1. Verify against Paystack API if secret key exists and not a simulated reference
    if (secretKey && !isSimulatedRef) {
      try {
        const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
          },
        });

        const data = await res.json();
        if (data.status && data.data) {
          const tx = data.data;
          const isSuccess = tx.status === "success";
          const metaPlanId = (tx.metadata?.planId as PricingPlanId) || expectedPlanId || "pro";
          const receiptNumber = generateReceiptNumber(reference);

          return {
            ok: isSuccess,
            status: tx.status as "success" | "failed" | "abandoned" | "pending",
            reference: tx.reference,
            amountNaira: Math.round((tx.amount || 0) / 100),
            planId: metaPlanId,
            channel: tx.channel || "card",
            paidAt: tx.paid_at || new Date().toISOString(),
            customerEmail: tx.customer?.email || "",
            customerName: tx.metadata?.fullName || tx.customer?.first_name || "Vitra Candidate",
            receiptNumber,
            gatewayResponse: tx.gateway_response || "Successful",
            isSimulated: false,
          };
        }

        return {
          ok: false,
          status: "failed",
          reference,
          amountNaira: 0,
          planId: expectedPlanId || "pro",
          paidAt: new Date().toISOString(),
          customerEmail: "",
          receiptNumber: generateReceiptNumber(reference),
          isSimulated: false,
          error: data.message || "Paystack verification failed.",
        };
      } catch (err) {
        console.error("[Paystack] Verify network error:", err);
      }
    }

    // 2. Simulated Dev Verification
    let resolvedPlanId: PricingPlanId = expectedPlanId || "pro";
    if (reference.includes("starter")) resolvedPlanId = "starter";
    if (reference.includes("executive")) resolvedPlanId = "executive";
    if (reference.includes("pro")) resolvedPlanId = "pro";

    const plan = getPlanById(resolvedPlanId) || getPlanById("pro")!;
    const receiptNumber = generateReceiptNumber(reference);

    return {
      ok: true,
      status: "success",
      reference,
      amountNaira: plan.priceNaira,
      planId: plan.id,
      channel: "Paystack (Development Simulation)",
      paidAt: new Date().toISOString(),
      customerEmail: "candidate@vitra.careers",
      customerName: "Vitra Candidate",
      receiptNumber,
      gatewayResponse: "Approved (Dev Mode Simulation)",
      isSimulated: true,
    };
  },

  /**
   * Activates a candidate's plan after verified payment and records the transaction.
   * Also sends an official branded receipt email to the candidate.
   */
  async activatePlan(input: ActivatePlanInput): Promise<PlanActivationResult> {
    const plan = getPlanById(input.planId);
    if (!plan) {
      return { ok: false, receiptNumber: "", planId: "starter", maxCvs: 2, emailDispatched: false, error: "Invalid plan." };
    }

    const receiptNumber = generateReceiptNumber(input.reference);
    const amountNaira = input.amountNaira || plan.priceNaira;
    const qtyMultiplier = Math.max(1, Math.round(amountNaira / plan.priceNaira));
    const totalAllowedCvs = plan.maxCvs * qtyMultiplier;

    // 1. Supabase Storage
    if (isSupabaseConfigured() && input.userId) {
      try {
        const supabase = await createSupabaseServerClient();
        if (supabase) {
          const { data: existingProfile } = await supabase
            .from("profiles")
            .select("max_cvs, generated_cvs_count")
            .eq("id", input.userId)
            .maybeSingle();

          const currentMax = Number(existingProfile?.max_cvs || 0);
          const currentUsed = Number(existingProfile?.generated_cvs_count || 0);
          const isExhausted = currentMax > 0 && currentUsed >= currentMax;
          const newMaxCvs = isExhausted
            ? currentUsed + totalAllowedCvs
            : Math.max(currentMax, totalAllowedCvs);

          await supabase
            .from("profiles")
            .update({
              plan_id: plan.id,
              max_cvs: newMaxCvs,
              plan_purchased_at: new Date().toISOString(),
            })
            .eq("id", input.userId);

          await supabase.from("payments").insert({
            user_id: input.userId,
            reference: input.reference,
            plan_id: plan.id,
            amount: amountNaira * 100,
            currency: "NGN",
            status: "success",
            max_cvs: totalAllowedCvs,
          });
        }
      } catch (err) {
        console.error("[Paystack] Supabase activation error:", err);
      }
    }

    // 2. Local Dev Database Storage
    if (isLocalDevModeAllowed()) {
      if (input.userId) {
        const existingUser = localDevDb.getUserById(input.userId);
        const currentMax = existingUser?.maxCvs ?? 0;
        const currentUsed = existingUser ? localDevDb.getGeneratedCvsCount(input.userId) : 0;
        // When a user exhausts their allowed access, paying another premium adds their fresh plan allowance:
        const isExhausted = currentMax > 0 && currentUsed >= currentMax;
        const newMaxCvs = isExhausted
          ? currentUsed + totalAllowedCvs
          : Math.max(currentMax, totalAllowedCvs);
        localDevDb.updateUserPlan(input.userId, plan.id, newMaxCvs);
      }
      localDevDb.recordPayment({
        userId: input.userId || "guest_user",
        reference: input.reference,
        planId: plan.id,
        amount: amountNaira,
        currency: "NGN",
        status: "success",
        maxCvs: totalAllowedCvs,
      });
      localDevDb.recordAuthEvent({
        eventType: "plan_activated",
        email: input.email || "candidate@vitra.app",
        userId: input.userId,
        details: `Payment confirmed ₦${amountNaira.toLocaleString()} for ${plan.name} (${totalAllowedCvs} CVs). Ref: ${input.reference}`,
        status: "success",
      });
    }

    // 3. Dispatch Email Receipt
    let emailDispatched = false;
    if (input.email) {
      try {
        const dispatch = await sendPaymentReceiptEmail({
          email: input.email,
          fullName: input.fullName,
          planId: plan.id,
          planName: plan.name,
          amountNaira,
          maxCvs: plan.maxCvs,
          reference: input.reference,
          receiptNumber,
          paidAt: new Date().toISOString(),
          channel: input.channel || "Paystack",
        });
        emailDispatched = dispatch.success;
      } catch (err) {
        console.error("[Paystack] Receipt email dispatch error:", err);
      }
    }

    return {
      ok: true,
      receiptNumber,
      planId: plan.id,
      maxCvs: plan.maxCvs,
      emailDispatched,
    };
  },
};
