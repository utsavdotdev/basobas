import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isUserRole } from "@/lib/auth/roles";

function getSafeNextPath(nextParam: string | null) {
  if (!nextParam) return "/";
  return nextParam.startsWith("/") ? nextParam : "/";
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const roleParam = requestUrl.searchParams.get("role");
  const nextPath = getSafeNextPath(requestUrl.searchParams.get("next"));

  const redirectUrl = new URL(nextPath, requestUrl.origin);

  if (!code) {
    redirectUrl.searchParams.set("auth_error", "missing_code");
    return NextResponse.redirect(redirectUrl);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    redirectUrl.searchParams.set("auth_error", "oauth_exchange_failed");
    return NextResponse.redirect(redirectUrl);
  }

  if (isUserRole(roleParam)) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("role, role_locked")
        .eq("id", user.id)
        .maybeSingle();

      const existingRole =
        typeof existingProfile?.role === "string" ? existingProfile.role : null;
      const roleLocked = existingProfile?.role_locked === true;

      if (isUserRole(existingRole) && existingRole !== roleParam && roleLocked) {
        await supabase.auth.signOut();
        redirectUrl.searchParams.set("auth_error", "role_conflict");
        return NextResponse.redirect(redirectUrl);
      }

      await supabase
        .from("profiles")
        .upsert(
          { id: user.id, role: roleParam, role_locked: true },
          { onConflict: "id" },
        );
    }
  }

  return NextResponse.redirect(redirectUrl);
}
