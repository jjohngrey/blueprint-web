import { NextResponse } from "next/server";
import { appendSubscriber, subscriberSignupAvailable } from "../../../lib/subscribers";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const submittedEmail = "email" in body ? body.email : undefined;
  const website = "website" in body ? body.website : undefined;

  if (typeof website === "string" && website.length > 0) {
    return NextResponse.json({});
  }

  const email = typeof submittedEmail === "string" ? submittedEmail.trim().toLowerCase() : "";
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  if (!subscriberSignupAvailable()) {
    return NextResponse.json({ error: "Email updates are not available yet." }, { status: 503 });
  }

  try {
    await appendSubscriber(email);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not save your email. Try again later." }, { status: 503 });
  }
}
