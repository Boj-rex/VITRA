"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Printer,
  Mail,
  CheckCircle2,
  Clock,
  CreditCard,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Check,
  FileText,
  AlertCircle,
} from "lucide-react";
import { PRICING_PLANS, getPlanById, type PricingPlanId, type PricingPlan } from "@/types/pricing";
import { WashiTape } from "@/components/scrapbook/WashiTape";
import { cn } from "@/lib/utils";

interface BillingUser {
  id: string;
  email: string;
  fullName?: string;
  planId: string | null;
  planName: string;
  maxCvs: number;
  usedCvs: number;
}

function ReceiptContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search parameters
  const rawPlanParam = searchParams.get("plan") || searchParams.get("planId") || "pro";
  const initialPlanId: PricingPlanId =
    rawPlanParam === "starter" || rawPlanParam === "executive" ? rawPlanParam : "pro";

  const urlReference = searchParams.get("reference") || searchParams.get("trxref");
  const isSimulatedParam = searchParams.get("simulated") === "true";
  const initialQtyParam = parseInt(searchParams.get("qty") || searchParams.get("quantity") || "1", 10);

  // State
  const [selectedPlanId, setSelectedPlanId] = useState<PricingPlanId>(initialPlanId);
  const [quantity, setQuantity] = useState<number>(
    Number.isFinite(initialQtyParam) && initialQtyParam >= 1 ? Math.min(20, initialQtyParam) : 1
  );
  const [currentUser, setCurrentUser] = useState<BillingUser | null>(null);
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "verifying" | "paid" | "error">(
    urlReference ? "verifying" : "pending"
  );
  const [paymentRef, setPaymentRef] = useState<string>(urlReference || "");
  const [receiptNumber, setReceiptNumber] = useState<string>("");
  const [paidAtDate, setPaidAtDate] = useState<string>("");
  const [payChannel, setPayChannel] = useState<string>("Paystack");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<{ sent: boolean; message?: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedPlan: PricingPlan = getPlanById(selectedPlanId) || PRICING_PLANS[1];
  const totalPriceNumber = selectedPlan.priceNaira * quantity;
  const formattedTotalPrice = `₦${totalPriceNumber.toLocaleString("en-NG")}`;
  const totalCvs = selectedPlan.maxCvs * quantity;

  // 1. Fetch user status from /api/billing
  useEffect(() => {
    fetch("/api/billing")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.ok && data.user) {
          setCurrentUser(data.user);
          setCustomerEmail(data.user.email || "");
          setCustomerName(data.user.fullName || "");
        }
      })
      .catch(() => { });
  }, []);

  // 2. Auto-verify if returning from Paystack with a reference
  useEffect(() => {
    if (!urlReference) return;
    const refToVerify = urlReference;

    let isMounted = true;
    async function verifyPayment(ref: string) {
      setPaymentStatus("verifying");
      try {
        const res = await fetch(`/api/billing/verify?reference=${encodeURIComponent(ref)}&plan=${selectedPlanId}`);
        const data = await res.json();

        if (!isMounted) return;

        if (data.ok && data.verified) {
          setPaymentStatus("paid");
          setPaymentRef(ref);
          setReceiptNumber(data.transaction?.receiptNumber || `VIT-REC-${new Date().getFullYear()}-${ref.slice(-6).toUpperCase()}`);
          setPaidAtDate(data.transaction?.paidAt || new Date().toISOString());
          setPayChannel(data.transaction?.channel || "Paystack");
          if (data.transaction?.planId) {
            setSelectedPlanId(data.transaction.planId);
          }
        } else {
          setPaymentStatus("error");
          setErrorMessage(data.error || "Payment verification could not be confirmed.");
        }
      } catch {
        if (isMounted) {
          setPaymentStatus("error");
          setErrorMessage("Network error while verifying Paystack transaction.");
        }
      }
    }

    verifyPayment(refToVerify);
    return () => {
      isMounted = false;
    };
  }, [urlReference, selectedPlanId]);

  // Generate fallback receipt number if pending
  useEffect(() => {
    if (!receiptNumber) {
      const year = new Date().getFullYear();
      const code = Math.random().toString(36).slice(2, 8).toUpperCase();
      setReceiptNumber(`VIT-INV-${year}-${code}`);
    }
  }, [receiptNumber]);

  // Handle Paystack Checkout Initialization
  async function handlePayWithPaystack() {
    const finalEmail = (customerEmail || currentUser?.email || "").trim();
    if (!finalEmail) {
      alert("Please enter a valid candidate email address to proceed with Paystack payment.");
      return;
    }

    setLoadingAction("paystack");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlanId,
          action: "initialize",
          email: finalEmail,
          fullName: customerName.trim() || undefined,
          quantity,
        }),
      });

      const data = await res.json();
      if (data.ok && data.authorizationUrl) {
        window.location.assign(data.authorizationUrl);
      } else {
        setErrorMessage(data.error || "Failed to initialize Paystack checkout.");
      }
    } catch {
      setErrorMessage("Network error while communicating with Paystack.");
    } finally {
      setLoadingAction(null);
    }
  }

  // Handle Emailing Receipt
  async function handleEmailReceipt() {
    const finalEmail = (customerEmail || currentUser?.email || "").trim();
    if (!finalEmail) {
      alert("Please enter your email address to receive your receipt.");
      return;
    }

    setLoadingAction("email");
    setEmailStatus(null);

    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlanId,
          action: "send_receipt_email",
          email: finalEmail,
          fullName: customerName.trim() || undefined,
          reference: paymentRef || `vitra_${selectedPlanId}_${Date.now()}`,
          receiptNumber,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setEmailStatus({ sent: true, message: `Receipt sent to ${finalEmail}` });
      } else {
        setEmailStatus({ sent: false, message: data.error || "Could not deliver email receipt." });
      }
    } catch {
      setEmailStatus({ sent: false, message: "Network error sending receipt email." });
    } finally {
      setLoadingAction(null);
    }
  }

  const isPaid = paymentStatus === "paid";
  const isVerifying = paymentStatus === "verifying";

  const formattedDate = paidAtDate
    ? new Date(paidAtDate).toLocaleDateString("en-NG", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    })
    : new Date().toLocaleDateString("en-NG", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const formattedTime = paidAtDate
    ? new Date(paidAtDate).toLocaleTimeString("en-NG", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    : new Date().toLocaleTimeString("en-NG", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Top Breadcrumb & Actions Bar (Hidden on Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 font-tech text-xs font-bold text-[#1845E8] hover:underline"
        >
          <span>RETURN TO PACKAGES &amp; PLANS</span>
        </Link>

        <div className="flex items-center gap-2">
          {isPaid && (
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#1E2333] px-3 py-1.5 font-tech text-xs font-bold text-[#111111] dark:text-white shadow-[2px_2px_0px_#111111] hover:bg-[#F3F4F6] transition-all cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>PRINT / SAVE PDF</span>
            </button>
          )}

          <div className="inline-flex items-center gap-1.5 rounded-full border border-black/15 bg-black/5 dark:bg-white/5 px-3 py-1 font-tech text-[11px] font-bold text-[#55564E] dark:text-[#CBD5E1]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#10B981]" />
            <span>SECURE CHECKOUT</span>
          </div>
        </div>
      </div>

      {/* Plan Selector Pills (Allows Switching Plans on the Fly) (Hidden on Print) */}
      {!isPaid && (
        <div className="print:hidden space-y-2">
          <p className="font-tech text-xs font-bold text-[#55564E] dark:text-[#CBD5E1] uppercase tracking-wider">
            Choose Package Tier:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {PRICING_PLANS.map((plan) => {
              const isSelected = selectedPlanId === plan.id;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => {
                    setSelectedPlanId(plan.id);
                    // Update URL without full refresh
                    router.replace(`/pricing/receipt?plan=${plan.id}`, { scroll: false });
                  }}
                  className={cn(
                    "flex flex-col items-start p-3 rounded-xl border-2 transition-all cursor-pointer text-left select-none",
                    isSelected
                      ? "border-black dark:border-[#333C52] bg-[#FEF3C7] dark:bg-[#252210] shadow-[3px_3px_0px_#111111] dark:shadow-[3px_3px_0px_#000] -translate-y-0.5"
                      : "border-black/20 dark:border-white/20 bg-white dark:bg-[#1E2333] hover:border-black/50 text-[#55564E] dark:text-[#CBD5E1]"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-tech text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white">
                      {plan.name}
                    </span>
                    {plan.popular && (
                      <span className="rounded-full bg-[#10B981] px-1.5 py-0.2 font-tech text-[9px] font-bold text-white uppercase">
                        POPULAR
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="font-tech text-base font-bold text-[#111111] dark:text-white">
                      {plan.formattedPrice}
                    </span>
                    <span className="font-tech text-[10px] text-[#55564E] dark:text-[#CBD5E1]">· Up to {plan.maxCvs} CVs</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Verification Loading Banner */}
      {isVerifying && (
        <div className="rounded-xl border-2 border-black dark:border-[#333C52] bg-[#EFF6FF] dark:bg-[#1E293B] p-4 flex items-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin text-[#1845E8]" />
          <div>
            <h3 className="font-tech text-sm font-bold text-[#111111] dark:text-white">
              Verifying Paystack Transaction...
            </h3>
            <p className="text-xs text-[#55564E] dark:text-[#94A3B8]">
              Connecting to Paystack gateway to confirm reference{" "}
              <code className="font-mono font-bold text-[#1845E8]">{urlReference}</code>.
            </p>
          </div>
        </div>
      )}

      {/* Verification Error Banner */}
      {errorMessage && (
        <div className="rounded-xl border-2 border-red-500 bg-red-50 dark:bg-red-950/40 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-tech text-xs font-bold text-red-800 dark:text-red-200">
              Payment Notice
            </h3>
            <p className="text-xs text-red-700 dark:text-red-300">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* THE OFFICIAL TACTILE ORDER INVOICE & RECEIPT */}
      {/* ========================================================================= */}
      <div
        id="vitra-official-receipt"
        className={cn(
          "relative rounded-2xl border-2 border-black dark:border-[#333C52] bg-[#FFFDF7] dark:bg-[#161B26] p-6 sm:p-10 shadow-[6px_6px_0px_#111111] dark:shadow-[6px_6px_0px_#000] transition-all",
          "print:border-none print:shadow-none print:p-0 print:bg-white"
        )}
      >
        {/* Washi Tape Header Accent */}
        <WashiTape
          color="mint"
          angle="horizontal"
          className="-top-3.5 left-1/2 -translate-x-1/2 print:hidden z-10"
        />

        {/* 1. Header & Rubber Stamp */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b-2 border-dashed border-black/20 dark:border-white/20 pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-black/15 bg-black/5 dark:bg-white/5 px-2.5 py-0.5 font-tech text-[10px] font-bold uppercase tracking-wider text-[#111111] dark:text-white">
              <span>●</span>
              <span>VITRA CAREER LABS</span>
            </div>
            <h1 className="font-tech text-2xl sm:text-3xl font-bold text-[#111111] dark:text-white uppercase tracking-wide">
              ORDER RECEIPT &amp; INVOICE
            </h1>
            <p className="text-xs font-tech text-[#55564E] dark:text-[#94A3B8]">
              Official document for candidate package activation &amp; accounting.
            </p>
          </div>

          {/* Status Stamp */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2">
            {isPaid ? (
              <div className="rotate-[-3deg] border-2 border-dashed border-[#10B981] bg-[#10B981]/15 px-4 py-2 rounded-lg font-tech text-xs sm:text-sm font-black tracking-widest text-[#065F46] dark:text-[#34D399] uppercase shadow-sm">
                ✓ PAID &amp; VERIFIED
              </div>
            ) : (
              <div className="border-2 border-dashed border-[#F59E0B] bg-[#FEF3C7] dark:bg-[#2A2415] px-3.5 py-1.5 rounded-lg font-tech text-xs font-bold tracking-wider text-[#B45309] dark:text-[#FBBF24] uppercase flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>PENDING PAYMENT</span>
              </div>
            )}
            <span className="font-mono text-[11px] font-bold text-[#77786F] dark:text-[#94A3B8]">
              {receiptNumber}
            </span>
          </div>
        </div>

        {/* 2. Metadata Grid (Bill To, Date, Reference) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 py-6 border-b-2 border-dashed border-black/20 dark:border-white/20 font-tech text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#55564E] dark:text-[#E2E8F0] block">
              Issue Date &amp; Time
            </span>
            <span className="font-bold text-[#111111] dark:text-white mt-0.5 block">
              {formattedDate}
            </span>
            <span className="text-[11px] text-[#55564E] dark:text-[#CBD5E1]">{formattedTime}</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-[#55564E] dark:text-[#E2E8F0] block">
              Payment Gateway
            </span>
            <span className="font-bold text-[#111111] dark:text-white mt-0.5 block">
              Paystack Nigeria
            </span>
            <span className="text-[11px] text-[#065F46] dark:text-[#34D399] font-medium">
              {payChannel}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-[#55564E] dark:text-[#E2E8F0] block">
              Payment Reference
            </span>
            <span className="font-mono font-bold text-[#111111] dark:text-white mt-0.5 block break-all text-[11px]">
              {paymentRef || "Generated upon checkout"}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-[#55564E] dark:text-[#E2E8F0] block">
              Currency
            </span>
            <span className="font-bold text-[#111111] dark:text-white mt-0.5 block">
              NGN (Nigerian Naira - ₦)
            </span>
            <span className="text-[11px] text-[#55564E] dark:text-[#CBD5E1]">Zero Gateway Surcharge</span>
          </div>
        </div>

        {/* 3. Candidate / Bill-To Section */}
        <div className="py-5 border-b-2 border-dashed border-black/20 dark:border-white/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="font-tech text-[10px] uppercase font-bold text-[#55564E] dark:text-[#E2E8F0] block">
                Billed To Candidate:
              </span>
              {!isPaid && !currentUser ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[10px] font-bold text-[#111111] dark:text-white uppercase">
                      Candidate Full Name:
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Alex Johnson"
                      className="mt-1 w-full rounded-lg border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#1E2333] px-3 py-1.5 font-tech text-xs text-[#111111] dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#111111] dark:text-white uppercase">
                      Candidate Email Address: <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="mt-1 w-full rounded-lg border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#1E2333] px-3 py-1.5 font-tech text-xs text-[#111111] dark:text-white"
                    />
                  </div>
                </div>
              ) : (
                <div className="font-tech text-xs space-y-0.5">
                  <p className="font-bold text-[#111111] dark:text-white text-sm">
                    {customerName || currentUser?.fullName || "Vitra Candidate"}
                  </p>
                  <p className="text-[#55564E] dark:text-[#CBD5E1]">
                    {customerEmail || currentUser?.email || "candidate@vitra.careers"}
                  </p>
                  {currentUser && (
                    <span className="inline-block rounded-full bg-[#10B981]/15 px-2 py-0.2 text-[10px] font-bold text-[#065F46] dark:text-[#34D399]">
                      Verified Account
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Quick login reminder if guest */}
            {!currentUser && !isPaid && (
              <div className="font-tech text-[11px] text-[#55564E] dark:text-[#CBD5E1] sm:text-right print:hidden">
                Have an account?{" "}
                <Link href={`/login?redirect=/pricing/receipt?plan=${selectedPlanId}`} className="text-[#1845E8] dark:text-[#60A5FA] font-bold hover:underline">
                  Log in to auto-fill details
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* 4. Itemized Pricing Table */}
        <div className="py-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-tech text-xs">
              <thead>
                <tr className="border-b-2 border-black dark:border-[#333C52] text-[#55564E] dark:text-[#E2E8F0] uppercase text-[10px] sm:text-xs tracking-wider font-bold">
                  <th className="pb-2.5">Item &amp; Description</th>
                  <th className="pb-2.5 text-center">Package Tier</th>
                  <th className="pb-2.5 text-center">Qty</th>
                  <th className="pb-2.5 text-right">Unit Price</th>
                  <th className="pb-2.5 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10 dark:divide-white/10">
                <tr>
                  <td className="py-4 pr-4">
                    <strong className="text-sm font-bold text-[#111111] dark:text-white block">
                      {selectedPlan.name}
                    </strong>
                    <p className="text-[11px] text-[#55564E] dark:text-[#CBD5E1] mt-0.5">
                      {selectedPlan.tagline}
                    </p>
                    <ul className="mt-2 space-y-1 text-[11px] text-[#55564E] dark:text-[#CBD5E1]">
                      <li className="flex items-center gap-1.5">
                        <Check className="h-3 w-3 text-[#10B981] shrink-0" />
                        <span>Up to {totalCvs} distinct, fully-tailored CVs</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="h-3 w-3 text-[#10B981] shrink-0" />
                        <span>All 4 ATS-conscious scrapbook &amp; modern templates</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="h-3 w-3 text-[#10B981] shrink-0" />
                        <span>Gemini AI writing assistant &amp; keyword alignment</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="h-3 w-3 text-[#10B981] shrink-0" />
                        <span>Unlimited PDF and Word (.docx) document exports</span>
                      </li>
                    </ul>
                  </td>
                  <td className="py-4 px-2 text-center align-top">
                    <span className="inline-block rounded-md border border-black/20 dark:border-[#4B5563] bg-black/5 dark:bg-[#242A3D] px-2.5 py-0.5 font-bold uppercase text-[10px] text-[#111111] dark:text-white">
                      {selectedPlan.badge}
                    </span>
                  </td>
                  <td className="py-4 px-2 text-center align-top">
                    <div className="inline-flex items-center rounded-lg border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#1E2333] shadow-sm">
                      <button
                        type="button"
                        disabled={quantity <= 1 || isPaid}
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        aria-label="Decrease quantity"
                        className="h-7 w-7 flex items-center justify-center font-bold text-xs text-[#111111] dark:text-white hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer select-none rounded-l-[6px]"
                      >
                        −
                      </button>
                      <span className="min-w-[28px] px-1 text-center font-tech font-bold text-xs sm:text-sm text-[#111111] dark:text-white select-none">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        disabled={quantity >= 20 || isPaid}
                        onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                        aria-label="Increase quantity"
                        className="h-7 w-7 flex items-center justify-center font-bold text-xs text-[#111111] dark:text-white hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer select-none rounded-r-[6px]"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="py-4 px-2 text-right align-top font-tech font-bold text-xs sm:text-sm text-[#111111] dark:text-white whitespace-nowrap">
                    {selectedPlan.formattedPrice}
                  </td>
                  <td className="py-4 pl-2 text-right align-top font-tech font-bold text-sm sm:text-base text-[#111111] dark:text-white whitespace-nowrap">
                    {formattedTotalPrice}
                  </td>
                </tr>

                {/* Surcharge Line (Waived) */}
                <tr className="border-t border-black/10 dark:border-white/10">
                  <td colSpan={4} className="py-2.5 text-xs text-[#55564E] dark:text-[#E2E8F0]">
                    Paystack Payment Gateway Processing Surcharge
                  </td>
                  <td className="py-2.5 text-right font-tech font-bold text-xs text-[#10B981] dark:text-[#34D399] whitespace-nowrap">
                    ₦0.00 (Waived)
                  </td>
                </tr>

                {/* VAT Line */}
                <tr className="border-t border-black/10 dark:border-white/10">
                  <td colSpan={4} className="py-2.5 text-xs text-[#55564E] dark:text-[#E2E8F0]">
                    Value Added Tax (VAT 7.5%)
                  </td>
                  <td className="py-2.5 text-right font-tech font-bold text-xs text-[#55564E] dark:text-[#E2E8F0] whitespace-nowrap">
                    Included
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Grand Total Strip */}
          <div className="mt-4 pt-4 border-t-2 border-black dark:border-[#333C52] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F8F9FA] dark:bg-[#1E2333] border-2 border-black/10 dark:border-[#333C52] p-4 sm:p-5 rounded-xl">
            <div>
              <span className="font-tech text-xs uppercase font-bold text-[#111111] dark:text-white block">
                Total Payment Due:
              </span>
              <span className="text-xs text-[#55564E] dark:text-[#CBD5E1]">
                One-time payment · Unlock {totalCvs} CV generations ({quantity} × {selectedPlan.name})
              </span>
            </div>
            <div className="text-right">
              <span className="font-tech text-2xl sm:text-3xl font-bold text-[#111111] dark:text-white">
                {formattedTotalPrice} NGN
              </span>
            </div>
          </div>
        </div>

        {/* 5. Actions / Gateway Area (Hidden on Print) */}
        <div className="pt-6 border-t-2 border-dashed border-black/20 dark:border-white/20 print:hidden space-y-6">
          {/* WHEN STATUS IS PAID */}
          {isPaid ? (
            <div className="space-y-4">
              <div className="rounded-xl border-2 border-[#10B981] bg-[#10B981]/10 p-4 text-center sm:text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[#065F46] dark:text-[#34D399] font-tech font-bold text-sm">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Payment Confirmed &amp; CV Allowance Active!</span>
                  </div>
                  <p className="text-xs text-[#55564E] dark:text-[#CBD5E1]">
                    Your workspace is unlocked with up to {selectedPlan.maxCvs} CVs. You can start crafting and tailoring your documents right away.
                  </p>
                </div>

                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-black dark:border-[#333C52] bg-[#111111] dark:bg-[#1A202C] px-6 py-3 font-tech text-xs font-bold text-white shadow-[3px_3px_0px_#1B3AFF] hover:-translate-y-0.5 hover:shadow-[4.5px_4.5px_0px_#1B3AFF] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap select-none"
                >
                  <span>GO TO CV WORKSPACE</span>
                </Link>
              </div>

              {/* Secondary Actions: Print, Email, Editor */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 font-tech text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 rounded-lg border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#1E2333] px-3.5 py-2 font-bold text-[#111111] dark:text-white shadow-[2px_2px_0px_#111111] hover:bg-[#F3F4F6] transition-all cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print Receipt (PDF)</span>
                  </button>

                  <button
                    type="button"
                    disabled={loadingAction === "email"}
                    onClick={handleEmailReceipt}
                    className="inline-flex items-center gap-1.5 rounded-lg border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#1E2333] px-3.5 py-2 font-bold text-[#111111] dark:text-white shadow-[2px_2px_0px_#111111] hover:bg-[#F3F4F6] transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    <span>{loadingAction === "email" ? "Sending..." : "Email Receipt to Me"}</span>
                  </button>
                </div>

                <Link
                  href="/create"
                  className="font-bold text-[#1845E8] hover:underline inline-flex items-center gap-1"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Start New CV with AI</span>
                </Link>
              </div>

              {emailStatus && (
                <div
                  className={cn(
                    "text-xs font-tech font-bold p-2.5 rounded-lg border",
                    emailStatus.sent
                      ? "border-[#10B981] bg-[#10B981]/10 text-[#065F46] dark:text-[#34D399]"
                      : "border-red-500 bg-red-50 text-red-800"
                  )}
                >
                  {emailStatus.message}
                </div>
              )}
            </div>
          ) : (
            /* WHEN STATUS IS PENDING PAYMENT */
            <div className="space-y-4 flex flex-col items-center justify-center text-center">
              <div className="w-full max-w-md mx-auto">
                {/* Checkout Gateway Button */}
                <button
                  type="button"
                  disabled={loadingAction !== null}
                  onClick={handlePayWithPaystack}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-black dark:border-[#333C52] bg-[#111111] dark:bg-[#1A202C] py-4 px-6 font-tech text-xs sm:text-sm font-bold text-white shadow-[4px_4px_0px_#1845E8] hover:-translate-y-0.5 hover:shadow-[5.5px_5.5px_0px_#1845E8] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none active:scale-[0.98] transition-all cursor-pointer select-none disabled:opacity-60"
                >
                  {loadingAction === "paystack" ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>INITIALIZING CHECKOUT...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 text-[#10B981]" />
                      <span>Check Out</span>
                    </>
                  )}
                </button>
              </div>

              {/* Security & Assurance Badges */}
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-2 text-[11px] font-tech text-[#55564E] dark:text-[#CBD5E1] text-center">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-[#10B981]" />
                  <span>256-bit Bank Grade Encryption</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
                  <span>Instant Quota Activation</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-[#1845E8] dark:text-[#60A5FA]" />
                  <span>Official Receipt Emailed Instantly</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 6. Footer Disclaimer & Support Note */}
        <div className="mt-8 pt-4 border-t border-black/10 dark:border-white/10 text-center font-tech text-[10px] text-[#55564E] dark:text-[#CBD5E1]">
          <p>
            Vitra Career Studio • Empowering Nigerian &amp; Global Professionals • Questions or need help?{" "}
            <Link
              href="/contact"
              className="text-[#1845E8] dark:text-[#60A5FA] underline font-bold hover:text-[#111111] dark:hover:text-white transition-colors"
            >
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PricingReceiptPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center font-tech text-xs text-[#77786F]">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-[#1845E8] mb-2" />
          <span>Loading official order receipt...</span>
        </div>
      }
    >
      <ReceiptContent />
    </Suspense>
  );
}
