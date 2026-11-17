"use client";

import React, { useState } from "react";
import { Mail, MapPin, Clock, CheckCircle2, AlertCircle, Send } from "lucide-react";
import { WashiTape } from "@/components/scrapbook/WashiTape";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ type: "error", text: data.error || "Unable to send message." });
      } else {
        setStatus({ type: "success", text: data.message });
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
      }
    } catch {
      setStatus({ type: "error", text: "Network error while sending message." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* Header */}
      <section className="text-center space-y-4 pt-2">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1 rounded-full border-2 border-[#111111] dark:border-[#333C52] bg-[#D1FAE5] dark:bg-[#0E2E23] px-3.5 py-1 text-xs font-bold text-[#065F46] dark:text-[#34D399] font-tech shadow-sticker-sm">
            <span>●</span>
            <span>SUPPORT &amp; INQUIRIES</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border-2 border-[#111111] dark:border-[#333C52] bg-[#FEF3C7] dark:bg-[#252210] px-3.5 py-1 text-xs font-bold text-[#92400E] dark:text-[#FBBF24] font-tech shadow-sticker-sm">
            <span>✦</span>
            <span>FAST RESPONSE</span>
          </span>
        </div>

        <div className="pt-2">
          <p className="font-handwriting text-2xl sm:text-3xl text-[#55564E] dark:text-[#CBD5E1] font-semibold -rotate-2">
            say hello or request help
          </p>
        </div>

        <div className="relative inline-block mx-auto">
          <h1 className="font-tech text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#111111] dark:text-white uppercase">
            GET IN TOUCH
          </h1>
        </div>

        <p className="font-tech text-base sm:text-lg text-[#55564E] dark:text-[#CBD5E1] max-w-xl mx-auto">
          Questions about payments, formatting, accessibility, or account support? Reach out directly.
        </p>
      </section>

      {/* Grid: Contact Form & Scrapbook Post-it Note */}
      <section className="grid gap-8 lg:grid-cols-12 max-w-4xl mx-auto items-start">
        {/* Form Container */}
        <div className="lg:col-span-7">
          <div className="relative rounded-2xl border-2 border-black dark:border-[#333C52] bg-white dark:bg-[#1E2333] p-6 sm:p-8 shadow-sticker">
            <WashiTape color="blue" angle="left" className="-top-3 left-6" />

            {status && (
              <div
                className={`mb-6 flex items-start gap-3 rounded-xl border-2 p-4 text-xs font-tech font-bold ${status.type === "success"
                  ? "border-[#10B981] bg-[#D1FAE5] dark:bg-[#0E2E23] text-[#065F46] dark:text-[#34D399]"
                  : "border-red-500 bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300"
                  }`}
              >
                {status.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                <p>{status.text}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 font-tech text-xs">
              <div>
                <label className="block font-bold text-[#111111] dark:text-white mb-1.5 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aisha Bello"
                  className="w-full rounded-lg border-2 border-black dark:border-[#333C52] bg-[#F9FAFB] dark:bg-[#242A3D] px-3.5 py-2.5 text-sm text-[#111111] dark:text-white placeholder:text-[#9CA3AF] dark:placeholder:text-[#94A3B8] focus:border-[#1845E8] dark:focus:border-[#34D399] focus:bg-white dark:focus:bg-[#1E2333] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block font-bold text-[#111111] dark:text-white mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="aisha@example.ng"
                  className="w-full rounded-lg border-2 border-black dark:border-[#333C52] bg-[#F9FAFB] dark:bg-[#242A3D] px-3.5 py-2.5 text-sm text-[#111111] dark:text-white placeholder:text-[#9CA3AF] dark:placeholder:text-[#94A3B8] focus:border-[#1845E8] dark:focus:border-[#34D399] focus:bg-white dark:focus:bg-[#1E2333] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block font-bold text-[#111111] dark:text-white mb-1.5 uppercase tracking-wider">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Package activation inquiry"
                  className="w-full rounded-lg border-2 border-black dark:border-[#333C52] bg-[#F9FAFB] dark:bg-[#242A3D] px-3.5 py-2.5 text-sm text-[#111111] dark:text-white placeholder:text-[#9CA3AF] dark:placeholder:text-[#94A3B8] focus:border-[#1845E8] dark:focus:border-[#34D399] focus:bg-white dark:focus:bg-[#1E2333] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block font-bold text-[#111111] dark:text-white mb-1.5 uppercase tracking-wider">
                  Message
                </label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can our support team assist your career journey today?"
                  className="w-full rounded-lg border-2 border-black dark:border-[#333C52] bg-[#F9FAFB] dark:bg-[#242A3D] px-3.5 py-2.5 text-sm text-[#111111] dark:text-white placeholder:text-[#9CA3AF] dark:placeholder:text-[#94A3B8] focus:border-[#1845E8] dark:focus:border-[#34D399] focus:bg-white dark:focus:bg-[#1E2333] focus:outline-none transition-colors resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-[6px] border-2 border-black dark:border-[#333C52] bg-[#111111] dark:bg-[#1A202C] py-3 px-4 font-tech text-xs font-bold text-white shadow-[3px_3px_0px_#1B3AFF] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer disabled:opacity-60"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{submitting ? "SENDING MESSAGE..." : "SEND MESSAGE"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Sticky Post-it Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="relative rounded-2xl border-2 border-black dark:border-[#333C52] bg-[#FEF9C3] dark:bg-[#252110] p-6 shadow-sticker space-y-4">
            <WashiTape color="yellow" angle="right" className="-top-3 right-6" />

            <span className="font-tech text-xs font-bold text-[#854D0E] dark:text-[#FBBF24] uppercase tracking-wider">
              OFFICE &amp; SUPPORT NOTE
            </span>

            <h3 className="font-handwriting text-2xl text-[#111111] dark:text-white font-bold">
              We read every single message.
            </h3>

            <div className="space-y-3 font-tech text-xs text-[#55564E] dark:text-[#CBD5E1]">
              <div className="flex items-start gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-[#854D0E] dark:text-[#FBBF24] mt-0.5" />
                <div>
                  <p className="font-bold text-[#111111] dark:text-white">Direct Support</p>
                  <p className="text-[#333333] dark:text-[#CBD5E1]">support@vitra.ng</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Clock className="h-4 w-4 shrink-0 text-[#854D0E] dark:text-[#FBBF24] mt-0.5" />
                <div>
                  <p className="font-bold text-[#111111] dark:text-white">Turnaround Time</p>
                  <p className="text-[#333333] dark:text-[#CBD5E1]">Usually within 2 to 6 business hours</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 shrink-0 text-[#854D0E] dark:text-[#FBBF24] mt-0.5" />
                <div>
                  <p className="font-bold text-[#111111] dark:text-white">Locations Served</p>
                  <p className="text-[#333333] dark:text-[#CBD5E1]">Lagos, Abuja, Port Harcourt &amp; Remote Global</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border-2 border-black/10 dark:border-white/10 bg-[#D1FAE5] dark:bg-[#0E2E23] p-5 font-tech text-xs text-[#065F46] dark:text-[#34D399] space-y-1">
            <p className="font-bold">🔒 Privacy Guarantee</p>
            <p className="text-[11px] text-[#065F46]/90 dark:text-[#34D399]/90">
              We never sell or distribute your contact email or CV documents to third-party recruitment agencies without your explicit consent.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
