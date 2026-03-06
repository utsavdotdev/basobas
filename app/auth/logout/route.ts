import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const nextParam = requestUrl.searchParams.get("next");
  const nextPath = nextParam?.startsWith("/") ? nextParam : "/";

  const supabase = await createClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL(nextPath, requestUrl.origin));
}
