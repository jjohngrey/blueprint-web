import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const require = createRequire("/Users/johngrey/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/look.cjs");
const { chromium } = require("playwright-core");
const browser = await chromium.launch({ channel: "chrome" });
const context = await browser.newContext({ viewport: { width: 800, height: 900 }, deviceScaleFactor: 1, colorScheme: "light" });
const figures = [
  ["conference-trophy", "Trophy", "280,130"],
  ["social-megaphone", "Megaphone", "285,135"],
  ["news-television", "Television", "142,84"],
];
const cells = [], checks = [];
for (const [name, label, at] of figures) {
  for (const theme of ["light", "dark"]) {
    for (const pose of ["rest", "answer"]) {
      const page = await context.newPage();
      const url = pathToFileURL(new URL(`hairline-${name}.html`, import.meta.url).pathname);
      url.search = `w=82&theme=${theme}${pose === "answer" ? `&at=${at}` : ""}`;
      await page.goto(url.href);
      await page.addStyleTag({ content: ".tag{display:none}" });
      await page.waitForTimeout(1800);
      const status = await page.evaluate(() => ({
        read: document.querySelector("#read").textContent,
        bright: [...document.querySelectorAll("#stage svg .hi")].map((p) => ({ classes: p.getAttribute("class"), stroke: getComputedStyle(p).stroke })),
        silhouette: getComputedStyle(document.querySelector("#stage svg .sil")).stroke,
        width: document.querySelector("#stage").getBoundingClientRect().width,
      }));
      checks.push({ name, theme, pose, ...status });
      const png = await page.locator("#stage").screenshot();
      const filename = `${name}-80px-${theme}-${pose}.png`;
      writeFileSync(new URL(filename, import.meta.url), png);
      cells.push({ label, theme, pose, png: png.toString("base64") });
      await page.close();
    }
  }
}
const sheet = await context.newPage();
await sheet.setViewportSize({ width: 390, height: 500 });
await sheet.setContent(`<style>body{margin:0;padding:14px;background:white;font:11px/1.4 system-ui;color:#232327}.grid{display:grid;grid-template-columns:repeat(3,110px);gap:12px 10px}figure{margin:0}img{display:block;width:80px;height:64px;margin-top:4px;border:1px solid #e0e0e4}h1{font:13px system-ui;margin:0 0 14px}</style><h1>Actual 80px stage previews</h1><div class="grid">${["light", "dark"].flatMap(theme => ["rest", "answer"].flatMap(pose => cells.filter(c => c.theme === theme && c.pose === pose))).map(c => `<figure>${c.label}, ${c.theme}<br>${c.pose}<img src="data:image/png;base64,${c.png}"></figure>`).join("")}</div>`);
await sheet.screenshot({ path: new URL("figures-80px.png", import.meta.url).pathname, fullPage: true });
writeFileSync(new URL("80px-checks.json", import.meta.url), JSON.stringify(checks, null, 2) + "\n");
console.log(JSON.stringify(checks, null, 2));
await browser.close();
