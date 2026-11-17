import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { paystackService } from "@/lib/payments/paystack-service";
import { type PricingPlanId, getPlanById } from "@/types/pricing";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference") || searchParams.get("trxref");
  const planId = (searchParams.get("plan") || searchParams.get("planId")) as PricingPlanId | null;

  if (!reference) {
    return NextResponse.json(
      { ok: false, error: "Missing transaction reference for verification." },
      { status: 400 }
    );
  }

  const user = await getAuthenticatedUser();
  const verifyResult = await paystackService.verifyTransaction(reference, planId || undefined);

  if (!verifyResult.ok) {
    return NextResponse.json({
      ok: false,
      error: verifyResult.error || "Payment verification could not be confirmed.",
      transaction: verifyResult,
    });
  }

  // Activate the plan for the user and send receipt email
  const resolvedPlanId = verifyResult.planId || planId || "starter";
  const plan = getPlanById(resolvedPlanId) || getPlanById("pro")!;

  const activation = await paystackService.activatePlan({
    userId: user?.id,
    email: user?.email || verifyResult.customerEmail,
    fullName: user?.fullName || verifyResult.customerName,
    planId: plan.id,
    reference,
    amountNaira: verifyResult.amountNaira,
    channel: verifyResult.channel,
  });

  return NextResponse.json({
    ok: true,
    verified: true,
    plan: {
      id: plan.id,
      name: plan.name,
      formattedPrice: plan.formattedPrice,
      maxCvs: plan.maxCvs,
    },
    transaction: {
      ...verifyResult,
      receiptNumber: activation.receiptNumber,
    },
    emailDispatched: activation.emailDispatched,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const reference = body.reference || body.trxref;
    const planId = (body.plan || body.planId) as PricingPlanId | null;

    if (!reference) {
      return NextResponse.json(
        { ok: false, error: "Missing transaction reference for verification." },
        { status: 400 }
      );
    }

    const user = await getAuthenticatedUser();
    const verifyResult = await paystackService.verifyTransaction(reference, planId || undefined);

    if (!verifyResult.ok) {
      return NextResponse.json({
        ok: false,
        error: verifyResult.error || "Payment verification could not be confirmed.",
        transaction: verifyResult,
      });
    }

    const resolvedPlanId = verifyResult.planId || planId || "starter";
    const plan = getPlanById(resolvedPlanId) || getPlanById("pro")!;

    const activation = await paystackService.activatePlan({
      userId: user?.id,
      email: user?.email || body.email || verifyResult.customerEmail,
      fullName: user?.fullName || body.fullName || verifyResult.customerName,
      planId: plan.id,
      reference,
      amountNaira: verifyResult.amountNaira,
      channel: verifyResult.channel,
    });

    return NextResponse.json({
      ok: true,
      verified: true,
      plan: {
        id: plan.id,
        name: plan.name,
        formattedPrice: plan.formattedPrice,
        maxCvs: plan.maxCvs,
      },
      transaction: {
        ...verifyResult,
        receiptNumber: activation.receiptNumber,
      },
      emailDispatched: activation.emailDispatched,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Verification error." },
      { status: 500 }
    );
  }
}

