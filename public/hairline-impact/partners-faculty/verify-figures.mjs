import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire("/Users/johngrey/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/verify.cjs");
const { chromium } = require("playwright-core");
const browser = await chromium.launch({ channel: "chrome" });
const context = await browser.newContext({ viewport: { width: 800, height: 900 }, deviceScaleFactor: 1 });
const report = [];
const captures = [];
const tours = [];
const fixtures = [
  {
    name: "partners-network",
    tour: ["RBC", "GeoComply", "Tesla", "rest"],
    picks: [
      ["RBC", -61, -20, 6.3], ["a16z", -22, -66, 7.2], ["GeoComply", 46, -48, 6.6],
      ["Deloitte", 67, 22, 7.6], ["Tesla", 20, 67, 6.7], ["EA", -47, 48, 6.1],
    ],
  },
  {
    name: "faculty-pie",
    tour: ["Science 36.3%", "Engineering 11.3%", "Other 5.4%", "rest"],
    picks: [
      ["Science 36.3%", -21.0378, 36.3494, 12.5],
      ["Commerce 36.1%", -14.102, -39.5622, 12.5],
      ["Engineering 11.3%", 38.2786, -17.2854, 12.5],
      ["Arts 10.9%", 40.4402, 11.3372, 12.5],
      ["Other 5.4%", 31.6784, 31.6784, 13.6],
    ],
  },
];

try {
  for (const fixture of fixtures) {
    const page = await context.newPage(), errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (["error", "warning"].includes(message.type())) errors.push(message.text()); });
    await page.addInitScript(() => {
      let hl, mountFigure;
      Object.defineProperty(window, "HL", { configurable: true, get: () => hl, set: (value) => {
        hl = { ...value, proj: (camera) => (window.P = value.proj(camera)) };
      } });
      Object.defineProperty(window, "hairline", { configurable: true, get: () => mountFigure, set: (value) => {
        mountFigure = (figure) => { window.figureTour = figure.tour; return value(figure); };
      } });
    });
    await page.goto(pathToFileURL(join(here, `hairline-${fixture.name}.html`)).href);
    await page.waitForTimeout(1800);
    for (const [expected, x, y, z] of fixture.picks) {
      const at = await page.evaluate(([a, b, c]) => window.P(a, b, c), [x, y, z]);
      await page.evaluate(([sx, sy]) => {
        const stage = document.getElementById("stage"), rect = stage.getBoundingClientRect();
        stage.dispatchEvent(new PointerEvent("pointermove", {
          pointerType: "mouse", pointerId: 1, bubbles: true,
          clientX: rect.left + sx / 400 * rect.width, clientY: rect.top + sy / 320 * rect.height,
        }));
      }, at);
      await page.waitForTimeout(1000);
      const before = await page.locator("#stage > svg").innerHTML();
      await page.waitForTimeout(300);
      const actual = await page.locator("#read").textContent();
      const stable = before === await page.locator("#stage > svg").innerHTML();
      const box = await page.locator("#stage > svg").evaluate((svg) => {
        const b = svg.getBBox(); return [b.x, b.y, b.x + b.width, b.y + b.height];
      });
      const result = { figure: fixture.name, expected, actual, at: at.map(Math.round), stable, insideFrame: box[0] > 0 && box[1] > 0 && box[2] < 400 && box[3] < 320 };
      report.push(result);
      if (actual !== expected || !stable || !result.insideFrame) throw new Error(JSON.stringify(result));
    }
    const tour = await page.evaluate(() => window.figureTour);
    for (let i = 0; i < tour.length; i++) {
      await page.evaluate((at) => {
        const stage = document.getElementById("stage"), rect = stage.getBoundingClientRect();
        stage.dispatchEvent(new PointerEvent(at ? "pointermove" : "pointerleave", {
          pointerType: "mouse", pointerId: 1, bubbles: true,
          ...(at ? { clientX: rect.left + at[0] / 400 * rect.width, clientY: rect.top + at[1] / 320 * rect.height } : {}),
        }));
      }, tour[i]);
      await page.waitForTimeout(1000);
      const actual = await page.locator("#read").textContent();
      tours.push({ figure: fixture.name, stop: i + 1, at: tour[i], expected: fixture.tour[i], actual });
      if (actual !== fixture.tour[i]) throw new Error("Tour stop missed");
    }
    await page.evaluate(() => document.getElementById("stage").dispatchEvent(new PointerEvent("pointerleave", { pointerType: "mouse", bubbles: true })));
    await page.waitForTimeout(1100);
    if (await page.locator("#read").textContent() !== "rest") throw new Error(`${fixture.name} did not return to rest`);
    await page.locator(".tag").evaluateAll((elements) => elements.forEach((element) => { element.style.visibility = "hidden"; }));
    for (const pose of ["rest", "answer"]) {
      if (pose === "answer") {
        const [expected, x, y, z] = fixture.picks[0];
        const at = await page.evaluate(([a, b, c]) => window.P(a, b, c), [x, y, z]);
        await page.evaluate(([sx, sy]) => {
          const stage = document.getElementById("stage"), rect = stage.getBoundingClientRect();
          stage.dispatchEvent(new PointerEvent("pointermove", { pointerType: "mouse", pointerId: 1, bubbles: true,
            clientX: rect.left + sx / 400 * rect.width, clientY: rect.top + sy / 320 * rect.height }));
        }, at);
        await page.waitForTimeout(1100);
        if (await page.locator("#read").textContent() !== expected) throw new Error("80px answer missed");
      }
      const svg = page.locator("#stage > svg");
      await svg.evaluate((element) => { element.style.width = "80px"; element.style.height = "64px"; element.style.display = "block"; element.style.margin = "30px"; });
      const file = `hairline-${fixture.name}-80px-${pose}.png`;
      await svg.screenshot({ path: join(here, file) });
      captures.push({ name: `${fixture.name} ${pose}`, file });
      await svg.evaluate((element) => { element.style.width = ""; element.style.height = ""; element.style.display = ""; element.style.margin = ""; });
    }
    if (errors.length) throw new Error(errors.join("\n"));
    await page.close();
  }
  writeFileSync(join(here, "verification.json"), JSON.stringify({ selections: report, tours, eightyPixelCaptures: captures, console: "clean" }, null, 2) + "\n");
  console.log(JSON.stringify({ selections: report, tours, eightyPixelCaptures: captures, console: "clean" }, null, 2));
} finally {
  await context.close();
  await browser.close();
}
