import { NextResponse } from "next/server";
import { localDevDb } from "@/lib/data/local-dev-store";

export async function GET() {
  const mode = localDevDb.getAtsEngineMode();
  return NextResponse.json({
    ok: true,
    atsEngineMode: mode,
  });
}
