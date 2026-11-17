import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEV_SESSION_COOKIE } from "@/lib/auth/session";

export async function POST() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(DEV_SESSION_COOKIE);
  return res;
}

