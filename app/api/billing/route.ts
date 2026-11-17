import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { cvService } from "@/services/cv-service";
import { PRICING_PLANS, getPlanById, type PricingPlanId } from "@/types/pricing";
import { paystackService } from "@/lib/payments/paystack-service";
import { localDevDb } from "@/lib/data/local-dev-store";
import { isLocalDevModeAllowed } from "@/lib/config/env";
import { sendPaymentReceiptEmail } from "@/lib/email";

const checkoutSchema = z.object({
  planId: z.enum(["starter", "pro", "executive"]),
  action: z.enum(["initialize", "activate_simulated", "send_receipt_email"]).default("initialize"),
  reference: z.string().optional(),
  email: z.string().email().optional(),
  fullName: z.string().optional(),
  receiptNumber: z.string().optional(),
  quantity: z.number().int().min(1).max(20).default(1),
});

export async function GET() {
  const user = await getAuthenticatedUser();

  let userBilling = null;
  let transactions: unknown[] = [];

  if (user) {
    const cvs = await cvService.listCvs(user.id);
    const currentPlan = user.planId ? getPlanById(user.planId) : null;
    const usedCvs = Math.max(user.generatedCvsCount ?? 0, cvs.length);
    userBilling = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      planId: user.planId || null,
      planName: currentPlan?.name || "No Plan Selected",
      maxCvs: user.maxCvs,
      usedCvs,
      remainingCvs: Math.max(0, user.maxCvs - usedCvs),
      activeCvsCount: cvs.length,
      planPurchasedAt: user.planPurchasedAt || null,
    };

    if (isLocalDevModeAllowed()) {
      transactions = localDevDb.listPaymentsForUser(user.id);
    }
  }

  return NextResponse.json({
    ok: true,
    user: userBilling,
    plans: PRICING_PLANS,
    paystackConfigured: paystackService.isConfigured(),
    paystackPublicKey: paystackService.getPublicKey(),
    transactions,
  });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  const body = await request.json();
  const parsed = checkoutSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message || "Invalid checkout payload." },
      { status: 400 }
    );
  }

  const { planId, action, reference, email: bodyEmail, fullName: bodyFullName, receiptNumber, quantity = 1 } = parsed.data;
  const plan = getPlanById(planId);
  if (!plan) {
    return NextResponse.json({ ok: false, error: "Selected plan does not exist." }, { status: 400 });
  }

  const targetEmail = (user?.email || bodyEmail || "").trim();
  const targetFullName = (user?.fullName || bodyFullName || "Vitra Candidate").trim();
  const totalAmountNaira = plan.priceNaira * quantity;
  const totalMaxCvs = plan.maxCvs * quantity;

  // 1. Resend Receipt Email
  if (action === "send_receipt_email") {
    if (!targetEmail) {
      return NextResponse.json({ ok: false, error: "An email address is required to deliver your receipt." }, { status: 400 });
    }

    const finalRef = reference || `vitra_${plan.id}_${Date.now()}`;
    const finalReceiptNum = receiptNumber || `VIT-REC-${new Date().getFullYear()}-${finalRef.slice(-6).toUpperCase()}`;

    const dispatch = await sendPaymentReceiptEmail({
      email: targetEmail,
      fullName: targetFullName,
      planId: plan.id,
      planName: quantity > 1 ? `${plan.name} (Qty: ${quantity})` : plan.name,
      amountNaira: totalAmountNaira,
      maxCvs: totalMaxCvs,
      reference: finalRef,
      receiptNumber: finalReceiptNum,
      paidAt: new Date().toISOString(),
      channel: "Paystack",
    });

    return NextResponse.json({
      ok: dispatch.success,
      provider: dispatch.provider,
      message: dispatch.success
        ? `Official payment receipt dispatched to ${targetEmail}`
        : "Could not send receipt email at this time.",
    });
  }

  // 2. Simulated Instant Activation (for Dev & Instant Testing)
  if (action === "activate_simulated") {
    const finalRef = reference || `sim_${planId}_${Date.now()}`;
    const result = await paystackService.activatePlan({
      userId: user?.id,
      email: targetEmail,
      fullName: targetFullName,
      planId,
      reference: finalRef,
      amountNaira: totalAmountNaira,
      channel: "Dev Mode Simulation",
    });

    return NextResponse.json({
      ok: true,
      message: `Successfully activated ${plan.name} (${plan.formattedPrice} for up to ${totalMaxCvs} CVs).`,
      planId,
      maxCvs: totalMaxCvs,
      reference: finalRef,
      receiptNumber: result.receiptNumber,
    });
  }

  // 3. Initialize Real or Dev Paystack Checkout
  if (!targetEmail) {
    return NextResponse.json(
      { ok: false, error: "Please enter your email address to proceed to checkout." },
      { status: 400 }
    );
  }

  const origin = new URL(request.url).origin;
  // Redirect back to our dedicated receipt page so candidate sees their receipt!
  const callbackUrl = `${origin}/pricing/receipt?plan=${plan.id}&quantity=${quantity}`;

  const checkout = await paystackService.initializeCheckout({
    userId: user?.id,
    email: targetEmail,
    fullName: targetFullName,
    planId: planId as PricingPlanId,
    callbackUrl,
    quantity,
  });

  return NextResponse.json(checkout);
}
