import { NextResponse } from "next/server";

import { createServerClient } from "@/lib/db/supabase";

async function signOutAndRedirect(request: Request): Promise<NextResponse> {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  const url = new URL("/", request.url);
  return NextResponse.redirect(url, { status: 302 });
}

export async function GET(request: Request): Promise<NextResponse> {
  return signOutAndRedirect(request);
}

export async function POST(request: Request): Promise<NextResponse> {
  return signOutAndRedirect(request);
}
