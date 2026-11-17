"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  LifeBuoy,
  X,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  FileText,
  CreditCard,
  UserCheck,
} from "lucide-react";
import { WashiTape } from "@/components/scrapbook/WashiTape";
import { Input, Textarea, FieldLabel } from "@/components/ui/input";

export interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: string;
}

const SUPPORT_TOPICS = [
  { id: "general", label: "General Inquiry", icon: HelpCircle },
  { id: "payment", label: "Payment & Packages", icon: CreditCard },
  { id: "export", label: "CV Export & Formatting", icon: FileText },
  { id: "ai", label: "AI Writing Assistant", icon: Sparkles },
  { id: "account", label: "Account & Login", icon: UserCheck },
];

export function SupportModal({ isOpen, onClose, defaultCategory }: SupportModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState(defaultCategory || "general");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Attempt to pre-fill user info if authenticated
  useEffect(() => {
    if (!isOpen) return;

    setStatus(null);
    let isMounted = true;

    async function loadAccount() {
      try {
        const res = await fetch("/api/account");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.user) {
            if (!name) setName(data.user.fullName || "");
            if (!email) setEmail(data.user.email || "");
          }
        }
      } catch {
        // Guest mode, leave fields blank
      }
    }

    loadAccount();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Handle ESC key to dismiss
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);

    const activeTopic = SUPPORT_TOPICS.find((t) => t.id === category)?.label || "Support Inquiry";
    const finalSubject = subject.trim() || `[${activeTopic}] Help request from ${name || "User"}`;

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          category: activeTopic,
          subject: finalSubject,
          message: message.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatus({
          type: "error",
          text: data.error || "Unable to send inquiry. Please check your inputs.",
        });
      } else {
        setStatus({
          type: "success",
          text: data.message || "Thank you! Your message has been received.",
        });
        setMessage("");
      }
    } catch {
      setStatus({
        type: "error",
        text: "Network error while reaching Vitra support. Please check your connection.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="support-dialog-title"
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg max-h-[92vh] flex flex-col rounded-2xl border-2 border-black dark:border-[#333C52] bg-[#FFFEFA] dark:bg-[#1E2333] shadow-[6px_6px_0px_#111111] dark:shadow-[6px_6px_0px_#000000] font-tech text-xs text-[#252821] dark:text-[#E2E8F0] overflow-hidden">
        <WashiTape color="mint" angle="left" className="-top-3 left-8 z-10" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b-2 border-black/10 dark:border-white/10 px-5 sm:px-6 py-4 bg-[#F8F4EC] dark:bg-[#171C28]">
          <div className="flex items-center gap-2.5">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl border-2 border-black dark:border-[#333C52] bg-[#F8D849] dark:bg-[#252210] text-[#111111] dark:text-[#FEF08A] shadow-[2px_2px_0px_#111111] dark:shadow-[2px_2px_0px_#000000]">
              <LifeBuoy className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="support-dialog-title" className="text-base font-bold text-[#111111] dark:text-white">
                  Vitra Help &amp; Support
                </h2>
                <span className="rounded-full bg-[#10B981]/20 px-2 py-0.5 text-[10px] font-bold text-[#065F46] dark:text-[#34D399]">
                  ● Online
                </span>
              </div>
              <p className="font-handwriting text-sm text-[#55564E] dark:text-[#CBD5E1]">
                how can we help you today?
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#242A3D] text-[#111111] dark:text-white shadow-[1.5px_1.5px_0px_#111111] dark:shadow-[1.5px_1.5px_0px_#000000] hover:bg-[#FEE2E2] dark:hover:bg-[#3D1A1A] transition-colors cursor-pointer"
            aria-label="Close support dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {status && status.type === "success" ? (
            <div className="space-y-4 py-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#D1FAE5] dark:bg-[#0E2E23] text-[#065F46] dark:text-[#34D399] border-2 border-[#10B981]">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#111111] dark:text-white">
                  Inquiry Received!
                </h3>
                <p className="text-xs text-[#55564E] dark:text-[#CBD5E1] max-w-sm mx-auto leading-relaxed">
                  {status.text}
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setStatus(null);
                    onClose();
                  }}
                  className="rounded-xl border-2 border-black dark:border-[#333C52] bg-[#111111] dark:bg-[#10B981] px-5 py-2 text-xs font-bold text-white dark:text-black shadow-[2px_2px_0px_#1B3AFF] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
                >
                  Close Window
                </button>
                <Link
                  href="/faq"
                  onClick={onClose}
                  className="rounded-xl border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#242A3D] px-4 py-2 text-xs font-bold text-[#111111] dark:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#2D3548] transition-all"
                >
                  Browse FAQs
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {status && status.type === "error" && (
                <div className="flex items-start gap-2.5 rounded-xl border-2 border-red-500 bg-red-50 dark:bg-red-950/60 p-3 text-xs font-bold text-red-700 dark:text-red-300">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>{status.text}</p>
                </div>
              )}

              {/* Topic Selector Pills */}
              <div>
                <FieldLabel hint="Select area">What do you need help with?</FieldLabel>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
                  {SUPPORT_TOPICS.map((topic) => {
                    const isSelected = category === topic.id;
                    const Icon = topic.icon;
                    return (
                      <button
                        key={topic.id}
                        type="button"
                        onClick={() => setCategory(topic.id)}
                        className={`flex items-center gap-1.5 p-2 rounded-lg border-2 text-[11px] font-bold transition-all text-left cursor-pointer ${
                          isSelected
                            ? "border-black dark:border-white bg-[#111111] dark:bg-white text-white dark:text-[#111111] shadow-[2px_2px_0px_#1B3AFF]"
                            : "border-black/15 dark:border-white/15 bg-white dark:bg-[#242A3D] text-[#55564E] dark:text-[#CBD5E1] hover:border-black/40 hover:text-black dark:hover:text-white"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{topic.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name & Email Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <FieldLabel htmlFor="support-name" required>
                    Your Name
                  </FieldLabel>
                  <Input
                    id="support-name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ada Lovelace"
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="support-email" required>
                    Email Address
                  </FieldLabel>
                  <Input
                    id="support-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Subject */}
              <div>
                <FieldLabel htmlFor="support-subject" hint="Optional">
                  Subject
                </FieldLabel>
                <Input
                  id="support-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief summary of your question..."
                />
              </div>

              {/* Message */}
              <div>
                <FieldLabel htmlFor="support-message" required hint="Min 10 characters">
                  Message Details
                </FieldLabel>
                <Textarea
                  id="support-message"
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe what you are trying to do, which CV template you are using, or what question you have..."
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-black/10 dark:border-white/10">
                <div className="text-[11px] text-[#77786F] dark:text-[#94A3B8]">
                  Need instant answers? Check our{" "}
                  <Link
                    href="/faq"
                    onClick={onClose}
                    className="font-bold underline text-[#111111] dark:text-white"
                  >
                    FAQ page
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border-2 border-black dark:border-[#333C52] bg-[#F8D849] dark:bg-[#F8D849] px-5 py-2.5 text-xs font-bold text-[#111111] shadow-[2.5px_2.5px_0px_#111111] dark:shadow-[2.5px_2.5px_0px_#000000] hover:bg-[#FACC15] hover:-translate-y-0.5 hover:shadow-[3.5px_3.5px_0px_#111111] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer disabled:opacity-60"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{submitting ? "Sending..." : "Submit Inquiry"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

