#!/usr/bin/env node
// Deterministic UI smoke: dimensions, both appearances/locales, route and search focus.
import { execFileSync } from "node:child_process";
import { writeFile, mkdir } from "node:fs/promises";
const session = "dhamma-accept";
const script = `async page => {
  const cases = [];
  const sizes = [[860,620],[1024,768],[1280,820],[1440,900]];
  for (const [width,height] of sizes) {
    for (const theme of ["Light","Dark"]) {
      for (const language of ["English","မြန်မာ"]) {
        await page.setViewportSize({width,height});
        await page.goto("http://127.0.0.1:51729/");
        await page.keyboard.press("Control+,");
        await page.getByRole("button", {name:"English", exact:true}).click();
        await page.getByRole("button", {name:theme, exact:true}).click();
        await page.getByRole("button", {name:language, exact:true}).click();
        const routes = [];
        for (let i=0;i<5;i++) {
          await page.locator("aside nav button").nth(i).click();
          await page.waitForTimeout(70);
          const dimensions = await page.evaluate(() => {
            const c=document.querySelector("[data-content-scroller]");
            return { overflow:Math.max(0, c.scrollWidth-c.clientWidth),
              docOverflow:Math.max(0, document.documentElement.scrollWidth-window.innerWidth),
              heading:document.querySelector("main h1,main h2")?.textContent?.trim()??"",
              active:document.querySelector("aside nav button[aria-current=page]")?.textContent?.trim()??""
            };
          });
          routes.push(dimensions);
        }
        await page.keyboard.press("Control+f");
        const focused = await page.locator('input[name="query"]').evaluate(input => document.activeElement===input);
        if (routes.some(r=>r.overflow>0||r.docOverflow>0)||!focused) throw new Error(JSON.stringify({width,height,theme,language,routes,focused}));
        cases.push({width,height,theme,language,routes,focused});
      }
    }
  }
  await page.setViewportSize({width:860,height:620});
  await page.goto("http://127.0.0.1:51729/");
  await page.evaluate(() => { document.documentElement.style.fontSize = "150%"; });
  const scaled = await page.evaluate(() => ({
    viewport: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    contentWidth: document.querySelector("main")?.scrollWidth ?? 0,
    contentClient: document.querySelector("main")?.clientWidth ?? 0
  }));
  if (scaled.documentWidth > scaled.viewport || scaled.contentWidth > scaled.contentClient)
    throw new Error("150% text scaling caused horizontal overflow: " + JSON.stringify(scaled));
  cases.push({kind:"text-scale-150", ...scaled});

  await page.goto("http://127.0.0.1:51729/");
  await page.keyboard.press("Tab");
  const skip = await page.evaluate(() => document.activeElement?.getAttribute("href"));
  if (skip !== "#main-content") throw new Error("Skip link was not first keyboard stop: " + skip);
  await page.keyboard.press("Enter");
  const destination = await page.evaluate(() => document.activeElement?.id);
  if (destination !== "main-content") throw new Error("Skip link destination was not focused: " + destination);
  cases.push({kind:"skip-navigation", destination});
  return JSON.stringify(cases);
}`;
const run = execFileSync("playwright-cli", [`-s=${session}`, "run-code", script], {
  encoding: "utf8",
  maxBuffer: 8 * 1024 * 1024,
  timeout: 180000
});
await mkdir("docs/redesign", { recursive: true });
await writeFile("docs/redesign/qa-automated-ui-check.log", run);
console.log(run.slice(-2500));
