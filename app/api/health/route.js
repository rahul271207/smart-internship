import { NextResponse } from "next/server";
import { config } from "@/lib/config.js";
import { pingDatabase } from "@/lib/db.js";
import { ensureSeeded } from "@/lib/seed.js";

export async function GET() {
  await ensureSeeded();
  const ping = await pingDatabase();
  return NextResponse.json({
    status: ping.reachable ? "ok" : "degraded",
    app: config.appName,
    environment: config.appEnv,
    database: ping,
    semantic_matching: config.enableSemanticMatching,
    prototype_notice: "Independent academic prototype. Not an official PM Internship Scheme system.",
  });
}
