import { NextResponse } from "next/server";
import { config } from "@/lib/config.js";

export async function GET() {
  return NextResponse.json({
    environment: config.appEnv,
    notice: "Demo credentials are for local use only and must be changed before public deployment.",
  });
}
