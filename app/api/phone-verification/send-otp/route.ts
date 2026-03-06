import { createHash, randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeNepaliPhone } from "@/lib/phone";

const OTP_LENGTH = 6;
const OTP_EXPIRES_IN_SECONDS = 10 * 60;
const RESEND_COOLDOWN_SECONDS = 60;
const SEND_WINDOW_SECONDS = 15 * 60;
const MAX_SENDS_PER_WINDOW = 3;

type SendOtpBody = {
  phone?: string;
};

type ChallengeRow = {
  send_count: number;
  first_sent_at: string;
  last_sent_at: string;
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

const sendOtpWithWebhook = async ({
  phone,
  otp,
}: {
  phone: string;
  otp: string;
}) => {
  const webhookUrl = process.env.PHONE_OTP_SMS_WEBHOOK_URL;
  if (!webhookUrl) {
    return { delivered: false as const };
  }

  const webhookToken = process.env.PHONE_OTP_SMS_WEBHOOK_TOKEN;
  const message = `Your BasoBas verification code is ${otp}. It expires in 10 minutes.`;

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(webhookToken ? { Authorization: `Bearer ${webhookToken}` } : {}),
    },
    body: JSON.stringify({
      to: phone,
      message,
      channel: "sms",
    }),
  });

  if (!response.ok) {
    throw new Error(`SMS delivery failed with status ${response.status}`);
  }

  return { delivered: true as const };
};

const getOtpMode = () => {
  const mode = process.env.PHONE_OTP_MODE?.trim().toLowerCase();
  if (mode === "webhook") return "webhook" as const;
  return "simulate" as const;
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

  let body: SendOtpBody;
  try {
    body = (await request.json()) as SendOtpBody;
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

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: existingChallenge, error: challengeError } = await supabase
    .from("phone_verification_challenges")
    .select("send_count, first_sent_at, last_sent_at")
    .eq("user_id", user.id)
    .maybeSingle<ChallengeRow>();

  if (challengeError) {
    return NextResponse.json(
      { error: "Unable to read verification challenge." },
      { status: 500 },
    );
  }

  const now = Date.now();
  let sendCount = 1;
  let firstSentAtIso = new Date(now).toISOString();

  if (existingChallenge) {
    const lastSentAtMs = new Date(existingChallenge.last_sent_at).getTime();
    const secondsSinceLastSent = Math.floor((now - lastSentAtMs) / 1000);

    if (secondsSinceLastSent < RESEND_COOLDOWN_SECONDS) {
      return NextResponse.json(
        {
          error: "Please wait before requesting another OTP.",
          retryAfterSeconds: RESEND_COOLDOWN_SECONDS - secondsSinceLastSent,
        },
        { status: 429 },
      );
    }

    const firstSentAtMs = new Date(existingChallenge.first_sent_at).getTime();
    const secondsSinceFirstSent = Math.floor((now - firstSentAtMs) / 1000);

    if (secondsSinceFirstSent <= SEND_WINDOW_SECONDS) {
      if (existingChallenge.send_count >= MAX_SENDS_PER_WINDOW) {
        return NextResponse.json(
          {
            error: "OTP request limit reached. Please try again later.",
            retryAfterSeconds: SEND_WINDOW_SECONDS - secondsSinceFirstSent,
          },
          { status: 429 },
        );
      }

      sendCount = existingChallenge.send_count + 1;
      firstSentAtIso = existingChallenge.first_sent_at;
    }
  }

  const otp = randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, "0");
  const otpHash = hashOtp({
    otp,
    userId: user.id,
    phone: normalizedPhone,
    pepper,
  });
  const otpExpiresAt = new Date(
    now + OTP_EXPIRES_IN_SECONDS * 1000,
  ).toISOString();
  const nowIso = new Date(now).toISOString();

  const { error: upsertError } = await supabase
    .from("phone_verification_challenges")
    .upsert(
      {
        user_id: user.id,
        phone: normalizedPhone,
        otp_hash: otpHash,
        otp_expires_at: otpExpiresAt,
        attempts: 0,
        send_count: sendCount,
        first_sent_at: firstSentAtIso,
        last_sent_at: nowIso,
      },
      { onConflict: "user_id" },
    );

  if (upsertError) {
    return NextResponse.json(
      { error: "Unable to store OTP challenge." },
      { status: 500 },
    );
  }

  try {
    const otpMode = getOtpMode();
    if (otpMode === "webhook") {
      const smsResult = await sendOtpWithWebhook({
        phone: normalizedPhone,
        otp,
      });

      if (smsResult.delivered) {
        return NextResponse.json({
          success: true,
          retryAfterSeconds: RESEND_COOLDOWN_SECONDS,
        });
      }
    }

    return NextResponse.json({
      success: true,
      retryAfterSeconds: RESEND_COOLDOWN_SECONDS,
      devOtpPreview: otp,
      mode: "simulate",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to send OTP SMS. Please try again." },
      { status: 502 },
    );
  }
}
