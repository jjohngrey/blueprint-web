import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { cacheDir, playwright, launch } from "/private/tmp/hairline-skill/look.mjs";

const browser = await launch(playwright(cacheDir()));
const context = await browser.newContext({ viewport: { width: 800, height: 900 }, deviceScaleFactor: 1 });
const specs = [
  { name: "attendee-badges", at: "280,199", tour: [[136, 142], [280, 199], [195, 123]] },
  { name: "feedback-token", at: "260,173", tour: [[139, 153], [254, 176], [207, 118]] },
];
const shots = [];
for (const spec of specs) {
  const url = pathToFileURL(resolve(`hairline-${spec.name}.html`)).href;
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const theme of ["light", "dark"]) for (const state of ["rest", "answer"]) {
    await page.goto(`${url}?theme=${theme}${state === "answer" ? `&at=${spec.at}` : ""}`);
    await page.waitForTimeout(2000);
    const result = await page.evaluate(() => ({
      read: document.querySelector("#read").textContent,
      bright: [...document.querySelectorAll("#stage .hi")].map((el) => getComputedStyle(el).stroke),
    }));
    console.log(`${spec.name} ${theme} ${state}: ${JSON.stringify(result)}`);
    await page.evaluate(() => {
      const stage = document.querySelector("#stage"), svg = stage.querySelector("svg");
      stage.style.width = "80px"; stage.style.height = "64px";
      svg.style.width = "80px"; svg.style.height = "64px";
      document.querySelectorAll(".tag").forEach((el) => { el.hidden = true; });
    });
    const png = await page.locator("#stage > svg").screenshot();
    writeFileSync(`hairline-${spec.name}-80-${theme}-${state}.png`, png);
    shots.push({ label: `${spec.name}<br>${theme} ${state}`, data: png.toString("base64") });
  }
  for (const at of spec.tour) {
    await page.goto(`${url}?at=${at.join(",")}`);
    await page.waitForTimeout(1600);
    console.log(`${spec.name} tour ${at}: ${await page.locator("#read").textContent()}`);
  }
  console.log(`${spec.name} errors: ${JSON.stringify(errors)}`);
  await page.close();
}
const sheet = await context.newPage();
await sheet.setContent(`<body style="margin:0;padding:16px;background:#eaeaee;font:12px system-ui;display:grid;grid-template-columns:repeat(4,130px);gap:16px;width:568px;height:240px;min-height:0">${shots.map(({ label, data }) => `<div><div style="height:38px">${label}</div><img width="80" height="64" src="data:image/png;base64,${data}"></div>`).join("")}</body>`);
await sheet.locator("body").screenshot({ path: "hairline-badges-score-80-proof.png" });
await browser.close();
