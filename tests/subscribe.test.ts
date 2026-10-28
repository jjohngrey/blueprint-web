import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";
import { auth } from "@googleapis/sheets";
import { POST } from "../app/api/subscribe/route";
import { subscriberSignupAvailable } from "../lib/subscribers";

type SheetsRequest = Parameters<InstanceType<typeof auth.JWT>["request"]>[0];

const testConfig = {
  GOOGLE_SHEETS_SPREADSHEET_ID: "test-spreadsheet-id",
  GOOGLE_SERVICE_ACCOUNT_EMAIL: "subscriber-test@example.iam.gserviceaccount.com",
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: "test-private-key\\nsecond-line",
};
const originalConfig = new Map(Object.keys(testConfig).map((key) => [key, process.env[key]]));
let appendRequests: SheetsRequest[] = [];
let upstreamFailure = false;

beforeEach(() => {
  Object.assign(process.env, testConfig);
  appendRequests = [];
  upstreamFailure = false;
  mock.method(auth.JWT.prototype, "request", async function (
    this: InstanceType<typeof auth.JWT>,
    options: SheetsRequest,
  ) {
    assert.equal(this.email, testConfig.GOOGLE_SERVICE_ACCOUNT_EMAIL);
    assert.equal(this.key, "test-private-key\nsecond-line");
    assert.deepEqual(this.scopes, ["https://www.googleapis.com/auth/spreadsheets"]);
    appendRequests.push(options);
    if (upstreamFailure) throw new Error("Private Google failure details");
    return { data: {}, headers: new Headers() };
  });
});

afterEach(() => {
  mock.restoreAll();
  for (const [key, value] of originalConfig) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

function request(body: unknown) {
  return new Request("http://localhost/api/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("rejects malformed JSON and invalid emails without contacting Google", async () => {
  const malformed = new Request("http://localhost/api/subscribe", { method: "POST", body: "{" });
  assert.equal((await POST(malformed)).status, 400);

  for (const body of [null, [], "email", {}, { email: 123 }, { email: "invalid" }, { email: `${"a".repeat(250)}@example.com` }]) {
    assert.equal((await POST(request(body))).status, 400);
  }
  assert.equal(appendRequests.length, 0);
});

test("silently ignores the honeypot without claiming a completed append", async () => {
  const response = await POST(request({ email: "test@example.com", website: "bot.example" }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {});
  assert.equal(appendRequests.length, 0);
});

test("requires every server configuration value", async () => {
  assert.equal(subscriberSignupAvailable(), true);
  for (const key of Object.keys(testConfig)) {
    const configuredValue = process.env[key];
    delete process.env[key];
    assert.equal(subscriberSignupAvailable(), false);
    const response = await POST(request({ email: "test@example.com" }));
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: "Email updates are not available yet." });
    process.env[key] = configuredValue;
  }
  assert.equal(appendRequests.length, 0);
});

test("appends the normalized address and a UTC timestamp with raw values and no retry", async () => {
  const response = await POST(request({ email: "  Alice@Example.COM  " }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(appendRequests.length, 1);
  const [append] = appendRequests;
  assert.equal(append.method, "POST");
  assert.equal(decodeURIComponent(String(append.url)), "https://sheets.googleapis.com/v4/spreadsheets/test-spreadsheet-id/values/Subscribers!A:B:append");
  assert.deepEqual(append.params, { valueInputOption: "RAW", insertDataOption: "INSERT_ROWS" });
  assert.equal(append.retry, false);
  assert.equal(append.timeout, 10_000);

  const data: unknown = append.data;
  assert.ok(data && typeof data === "object" && "values" in data && Array.isArray(data.values));
  assert.equal(data.values.length, 1);
  const [row] = data.values;
  assert.ok(Array.isArray(row));
  assert.equal(row.length, 2);
  assert.equal(row[0], "alice@example.com");
  assert.match(row[1], /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
});

test("repeated addresses each append a new row", async () => {
  const responses = await Promise.all([
    POST(request({ email: "same@example.com" })),
    POST(request({ email: "same@example.com" })),
  ]);
  for (const response of responses) {
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
  }
  assert.equal(appendRequests.length, 2);
});

test("Google failures return a generic 503 without success", async () => {
  upstreamFailure = true;
  const response = await POST(request({ email: "test@example.com" }));
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "Could not save your email. Try again later." });
  assert.equal(appendRequests.length, 1);
});
