import { NextResponse } from "next/server";
import { z } from "zod";
import { sendSupportInquiryEmail } from "@/lib/email";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().email("Please enter a valid email address"),
  category: z.string().trim().max(100).optional(),
  subject: z.string().trim().min(3, "Please enter a subject").max(140),
  message: z.string().trim().min(10, "Please enter a brief message (at least 10 characters)").max(2000),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message || "Invalid inquiry." },
        { status: 400 }
      );
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      undefined;

    const emailResult = await sendSupportInquiryEmail({
      name: parsed.data.name,
      email: parsed.data.email,
      category: parsed.data.category,
      subject: parsed.data.subject,
      message: parsed.data.message,
      ip,
    });

    return NextResponse.json({
      ok: true,
      message:
        "Thank you! Your message has been sent to our support team. We will review your inquiry and get back to you shortly.",
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Failed to process inquiry.";
    return NextResponse.json({ ok: false, error: errorMessage }, { status: 500 });
  }
}
