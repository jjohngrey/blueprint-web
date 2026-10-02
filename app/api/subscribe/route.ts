import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const dataDirectory = process.env.SUBSCRIBER_DATA_DIR ?? path.join(process.cwd(), "data");
const subscriberFile = path.join(dataDirectory, "subscribers.ndjson");

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
  const { email: submittedEmail, website } = body as { email?: unknown; website?: unknown };

  if (typeof website === "string" && website.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const email = typeof submittedEmail === "string" ? submittedEmail.trim().toLowerCase() : "";
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  // Vercel's function filesystem cannot retain a mailing list between invocations.
  if (process.env.VERCEL || (process.env.NODE_ENV !== "development" && !process.env.SUBSCRIBER_DATA_DIR)) {
    return NextResponse.json({ error: "Email updates are not available yet." }, { status: 503 });
  }

  try {
    await mkdir(dataDirectory, { recursive: true });
    let existing = "";
    try {
      existing = await readFile(subscriberFile, "utf8");
    } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
    }

    const alreadySubscribed = existing
      .split("\n")
      .filter(Boolean)
      .some((line) => {
        try {
          return (JSON.parse(line) as { email?: string }).email === email;
        } catch {
          return false;
        }
      });

    if (!alreadySubscribed) {
      await appendFile(subscriberFile, `${JSON.stringify({ email, subscribedAt: new Date().toISOString() })}\n`, "utf8");
    }

    return NextResponse.json({ ok: true, alreadySubscribed });
  } catch {
    return NextResponse.json({ error: "Could not save your email. Try again later." }, { status: 503 });
  }
}
