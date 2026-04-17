// app/api/auth/refresh/route.ts
// Called by middleware when the access token expires.

import { NextResponse } from "next/server";
import { refreshSessionAction } from "@/actions/auth";

export async function POST() {
  const refreshed = await refreshSessionAction();

  if (!refreshed) {
    return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}