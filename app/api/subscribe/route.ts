import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const dataDirectory = process.env.SUBSCRIBER_DATA_DIR ?? path.join(process.cwd(), "data");
const subscriberFile = path.join(dataDirectory, "subscribers.ndjson");

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { email?: unknown; website?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (typeof body.website === "string" && body.website.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

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
}
