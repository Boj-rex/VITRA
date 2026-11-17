import { NextResponse } from "next/server";
import crypto from "crypto";
import { paystackService } from "@/lib/payments/paystack-service";
import { type PricingPlanId } from "@/types/pricing";

export async function POST(request: Request) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY?.trim();

  // If secret key is configured, verify HMAC signature
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (secretKey) {
    if (!signature) {
      return NextResponse.json({ ok: false, error: "Missing signature" }, { status: 400 });
    }
    const hash = crypto.createHmac("sha512", secretKey).update(rawBody).digest("hex");
    const sigBuffer = Buffer.from(signature, "hex");
    const hashBuffer = Buffer.from(hash, "hex");

    if (sigBuffer.length !== hashBuffer.length || !crypto.timingSafeEqual(sigBuffer, hashBuffer)) {
      console.warn("[Paystack Webhook] Invalid signature rejected.");
      return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 400 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, error: "Webhook signature key unconfigured." }, { status: 500 });
  }

  let eventPayload: {
    event?: string;
    data?: {
      reference?: string;
      amount?: number;
      channel?: string;
      customer?: { email?: string };
      metadata?: {
        userId?: string;
        fullName?: string;
        planId?: string;
      };
    };
  } = {};

  try {
    eventPayload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { event, data } = eventPayload;

  if (event === "charge.success" && data?.reference) {
    const planId = (data.metadata?.planId as PricingPlanId) || "starter";
    const amountNaira = data.amount ? Math.round(data.amount / 100) : undefined;

    await paystackService.activatePlan({
      userId: data.metadata?.userId,
      email: data.customer?.email,
      fullName: data.metadata?.fullName,
      planId,
      reference: data.reference,
      amountNaira,
      channel: data.channel || "Paystack Webhook",
    });

    console.log(`[Paystack Webhook] Successfully processed charge.success for ref ${data.reference}`);
  }

  return NextResponse.json({ received: true });
}

