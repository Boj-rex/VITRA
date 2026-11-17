"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Check, CreditCard, Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SubscriptionRequiredModalProps {
  open: boolean;
  onClose: () => void;
  cvId?: string;
  format?: "pdf" | "docx";
  isExhausted?: boolean;
  title?: string;
  description?: string;
}

export function SubscriptionRequiredModal({
  open,
  onClose,
  cvId,
  format,
  isExhausted,
  title,
  description,
}: SubscriptionRequiredModalProps) {
  const router = useRouter();

  if (!open) return null;

  const handleGoToPricing = () => {
    onClose();
    if (cvId) {
      router.push(`/pricing?cvId=${encodeURIComponent(cvId)}`);
    } else {
      router.push("/pricing");
    }
  };

  const modalTitle =
    title ||
    (isExhausted
      ? "Pay Another Premium to Continue"
      : "Unlock High-Resolution CV Downloads");

  const modalDescription =
    description ||
    (isExhausted
      ? "You have consumed all CV generations on your active package. To create, upload, duplicate, or tailor additional CVs, please select a package and pay another premium."
      : `To download and export your completed CV in ${format ? format.toUpperCase() : "PDF or Word"
      } format, please activate a package starting from ₦6,000.`);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sub-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[#C4A46B]/40 bg-[#FFFEFA] shadow-2xl">
        {/* Top header accent */}
        <div className="bg-[#173B30] px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[#D4CFC3]">
              <Lock className="h-3.5 w-3.5 text-amber-300" />
              <span>{isExhausted ? "Package Access Exhausted" : "Paid Subscription Feature"}</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <h2 id="sub-modal-title" className="mt-3 font-editorial text-2xl font-bold tracking-tight text-white">
            {modalTitle}
          </h2>
          <p className="mt-1 text-xs text-white/80 leading-relaxed">
            {modalDescription}
          </p>
        </div>

        {/* Pricing tiers snapshot */}
        <div className="p-6 space-y-4">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between rounded-xl border border-[#173B30]/30 bg-[#173B30]/5 p-3.5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#173B30]">Starter Package</p>
                <p className="text-sm font-bold text-[#252821]">Up to 2 CVs</p>
                <p className="text-[11px] text-[#77786F]">Ideal for single job applications</p>
              </div>
              <div className="text-right">
                <span className="font-editorial text-lg font-bold text-[#173B30]">₦6,000</span>
              </div>
            </div>

            <div className="relative flex items-center justify-between rounded-xl border-2 border-[#173B30] bg-[#173B30]/10 p-3.5 shadow-sm">
              <span className="absolute -top-2.5 right-4 rounded-full bg-[#173B30] px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                Popular
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#173B30]">Standard Career Pro</p>
                <p className="text-sm font-bold text-[#252821]">3 to 6 CVs (Max 6)</p>
                <p className="text-[11px] text-[#77786F]">Target multiple roles & industries</p>
              </div>
              <div className="text-right">
                <span className="font-editorial text-lg font-bold text-[#173B30]">₦15,000</span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-[#E2DDD2] bg-[#F6F3ED] p-3.5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#77786F]">Executive & Multi-Track</p>
                <p className="text-sm font-bold text-[#252821]">7 to 13 CVs (Max 13)</p>
                <p className="text-[11px] text-[#77786F]">Full access with senior executive templates</p>
              </div>
              <div className="text-right">
                <span className="font-editorial text-lg font-bold text-[#252821]">₦20,000</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-[#FAF8F5] p-3 text-xs text-[#55564E] space-y-1.5 border border-[#E2DDD2]">
            <div className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-[#173B30] shrink-0" />
              <span>Clean, readable <strong>Calibri body</strong> or <strong>Times New Roman</strong> formatting</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-[#173B30] shrink-0" />
              <span>Executive hanging-indent bullets & 100% ATS score compatibility</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-[#173B30] shrink-0" />
              <span>Instant download activation with secure Nigerian payment support</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Continue in Preview Mode
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleGoToPricing}
              className="gap-2 bg-[#173B30] text-white hover:bg-[#1E4D3F]"
            >
              <CreditCard className="h-4 w-4" />
              <span>
                {isExhausted
                  ? "Pay Another Premium & Renew"
                  : "Choose a Package & Download"}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

