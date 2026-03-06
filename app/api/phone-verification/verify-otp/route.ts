import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeNepaliPhone } from "@/lib/phone";

const MAX_VERIFY_ATTEMPTS = 5;

type VerifyOtpBody = {
  phone?: string;
  otp?: string;
};

type ChallengeRow = {
  phone: string;
  otp_hash: string;
  otp_expires_at: string;
  attempts: number;
};

const hashOtp = ({
  otp,
  userId,
  phone,
  pepper,
}: {
  otp: string;
  userId: string;
  phone: string;
  pepper: string;
}) =>
  createHash("sha256")
    .update(`${pepper}:${userId}:${phone}:${otp}`)
    .digest("hex");

const isHashMatch = (actualHash: string, expectedHash: string) => {
  const actual = Buffer.from(actualHash, "hex");
  const expected = Buffer.from(expectedHash, "hex");

  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
};

export async function POST(request: Request) {
  const pepper = process.env.PHONE_OTP_PEPPER;
  if (!pepper) {
    return NextResponse.json(
      {
        error:
          "Phone OTP secret is missing. Set PHONE_OTP_PEPPER in environment.",
      },
      { status: 500 },
    );
  }

  let body: VerifyOtpBody;
  try {
    body = (await request.json()) as VerifyOtpBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const normalizedPhone = normalizeNepaliPhone(body.phone ?? "");
  if (!normalizedPhone) {
    return NextResponse.json(
      { error: "Only valid Nepali phone numbers (+9779XXXXXXXXX) are allowed." },
      { status: 400 },
    );
  }

  const otp = (body.otp ?? "").trim();
  if (!/^\d{6}$/.test(otp)) {
    return NextResponse.json(
      { error: "Please enter a valid 6-digit OTP." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: challenge, error: challengeError } = await supabase
    .from("phone_verification_challenges")
    .select("phone, otp_hash, otp_expires_at, attempts")
    .eq("user_id", user.id)
    .maybeSingle<ChallengeRow>();

  if (challengeError) {
    return NextResponse.json(
      { error: "Unable to read verification challenge." },
      { status: 500 },
    );
  }

  if (!challenge) {
    return NextResponse.json(
      { error: "No active OTP request found. Please request a new OTP." },
      { status: 400 },
    );
  }

  if (challenge.phone !== normalizedPhone) {
    return NextResponse.json(
      { error: "OTP was requested for a different phone number." },
      { status: 400 },
    );
  }

  const now = Date.now();
  const expiresAt = new Date(challenge.otp_expires_at).getTime();
  if (Number.isNaN(expiresAt) || now > expiresAt) {
    await supabase
      .from("phone_verification_challenges")
      .delete()
      .eq("user_id", user.id);
    return NextResponse.json(
      { error: "OTP has expired. Please request a new one." },
      { status: 400 },
    );
  }

  if (challenge.attempts >= MAX_VERIFY_ATTEMPTS) {
    return NextResponse.json(
      { error: "Too many incorrect attempts. Request a new OTP." },
      { status: 429 },
    );
  }

  const expectedHash = hashOtp({
    otp,
    userId: user.id,
    phone: normalizedPhone,
    pepper,
  });

  if (!isHashMatch(challenge.otp_hash, expectedHash)) {
    const nextAttempts = challenge.attempts + 1;

    await supabase
      .from("phone_verification_challenges")
      .update({ attempts: nextAttempts })
      .eq("user_id", user.id);

    const remainingAttempts = Math.max(0, MAX_VERIFY_ATTEMPTS - nextAttempts);

    return NextResponse.json(
      {
        error:
          remainingAttempts > 0
            ? `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`
            : "Too many incorrect attempts. Request a new OTP.",
      },
      { status: 400 },
    );
  }

  const nowIso = new Date(now).toISOString();
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        phone: normalizedPhone,
        phone_verified: true,
        phone_verified_at: nowIso,
      },
      { onConflict: "id" },
    );

  if (profileError) {
    return NextResponse.json(
      { error: "Failed to mark phone as verified." },
      { status: 500 },
    );
  }

  await supabase
    .from("phone_verification_challenges")
    .delete()
    .eq("user_id", user.id);

  return NextResponse.json({
    success: true,
    phone: normalizedPhone,
  });
}
