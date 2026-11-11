import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const destination = new URL(code ? "/dashboard" : "/auth", url.origin);

  if (code) {
    const client = await createServerSupabaseClient();
    if (client) {
      const { error } = await client.auth.exchangeCodeForSession(code);
      if (error) destination.pathname = "/auth";
    } else {
      destination.pathname = "/auth";
    }
  }

  return NextResponse.redirect(destination);
}
