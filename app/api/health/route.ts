import { NextResponse } from "next/server";
import { getSystemStatus } from "@/lib/config/env";
import { localDevDb } from "@/lib/data/local-dev-store";

export async function GET() {
  const status = getSystemStatus();
  return NextResponse.json({
    ok: true,
    service: "vitra",
    atsEngineMode: localDevDb.getAtsEngineMode(),
    ...status,
  });
}

