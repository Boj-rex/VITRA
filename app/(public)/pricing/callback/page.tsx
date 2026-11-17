"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PricingCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");
  const planId = searchParams.get("planId");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function completeActivation() {
      if (!reference || !planId) {
        setStatus("error");
        setErrorMessage("Missing payment reference or plan details.");
        return;
      }

      try {
        const res = await fetch("/api/billing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId,
            action: "activate_simulated",
            reference,
          }),
        });

        const data = await res.json();
        if (data.ok) {
          setStatus("success");
          setTimeout(() => {
            router.push("/dashboard?payment=success");
          }, 2000);
        } else {
          setStatus("error");
          setErrorMessage(data.error || "Failed to confirm payment.");
        }
      } catch (err) {
        setStatus("error");
        setErrorMessage(err instanceof Error ? err.message : "Payment processing error.");
      }
    }

    completeActivation();
  }, [reference, planId, router]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg items-center justify-center px-4 py-16">
      <Card className="w-full p-8 text-center space-y-4">
        {status === "loading" && (
          <>
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#173B30]" />
            <h2 className="font-editorial text-xl text-[#252821]">Verifying Payment & Quota...</h2>
            <p className="text-xs text-[#77786F]">
              Please hold on while we activate your CV allowance on Vitra.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#173B30]/10 text-[#173B30]">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 className="font-editorial text-2xl font-bold text-[#173B30]">
              Package Activated!
            </h2>
            <p className="text-sm text-[#252821]">
              Your CV package is now active. Redirecting you to your workspace...
            </p>
            <Button
              variant="primary"
              className="mt-4"
              onClick={() => router.push("/dashboard?payment=success")}
            >
              Go to Workspace Now
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-[#8F2424]">
              <XCircle className="h-7 w-7" />
            </div>
            <h2 className="font-editorial text-xl text-[#8F2424]">Activation Failed</h2>
            <p className="text-sm text-[#77786F]">{errorMessage}</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/pricing")}>
              Return to Pricing
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}

