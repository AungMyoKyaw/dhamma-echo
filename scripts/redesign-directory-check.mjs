#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";

const scenario = `async page => {
  const assert = (truth, message) => { if (!truth) throw new Error(message); };
  const evidence = [];
  await page.setViewportSize({width:860,height:620});
  await page.goto("http://127.0.0.1:51729/");
  await page.keyboard.press("Control+,");
  await page.getByRole("button",{name:"English",exact:true}).click();
  await page.getByRole("button",{name:"Light",exact:true}).click();

  await page.locator("aside nav button").nth(3).click();
  const teacherQuery = page.locator('main input[name="query"]');
  await teacherQuery.fill("Jotika");
  await page.waitForTimeout(400);
  assert(await page.locator("main button").filter({hasText:"Jotika"}).count() > 0,
    "Typing a teacher's name did not surface a matching teacher");
  evidence.push("teacher-debounced-query:pass");
  await teacherQuery.fill("zxy-nonexistent-teacher");
  await page.waitForTimeout(400);
  assert((await page.locator("main").innerText()).includes("No teachers match"),
    "A missing teacher did not display the query empty state");
  evidence.push("teacher-empty-state:pass");
  await page.getByRole("button",{name:"Clear teacher search"}).click();
  await page.waitForTimeout(350);
  assert((await page.locator("main").innerText()).includes("Jotika"),"Clearing teacher query did not restore results");
  evidence.push("teacher-clear:pass");
  await teacherQuery.fill("Jotika");
  await page.locator("aside nav button").nth(0).click();
  await page.locator("aside nav button").nth(3).click();
  await page.waitForTimeout(450);
  assert((await teacherQuery.inputValue()).includes("Jotika"),"Teacher search query lost on route return");
  assert((await page.locator("main").innerText()).includes("Jotika"),"Teacher search results lost on route return");
  evidence.push("teacher-navigation-preserves-pending-query:pass");

  await page.locator("aside nav button").nth(2).click();
  const collectionQuery = page.locator('main input[name="query"]');
  await collectionQuery.fill("Dhamma Disc");
  await page.waitForTimeout(400);
  assert((await page.locator("main").innerText()).includes("Dhamma Disc"),
    "Collection name filter failed");
  evidence.push("collection-debounced-query:pass");
  await collectionQuery.fill("Dhamma Disc");
  await page.locator("aside nav button").nth(0).click();
  await page.locator("aside nav button").nth(2).click();
  await page.waitForTimeout(400);
  assert((await collectionQuery.inputValue())==="Dhamma Disc","Collection query lost after quick navigation");
  assert((await page.locator("main").innerText()).includes("Dhamma Disc"),"Collection results lost after quick navigation");
  evidence.push("collection-navigation-preserves-pending-query:pass");
  await collectionQuery.fill("zxy-no-matching-collection");
  await page.waitForTimeout(400);
  assert((await page.locator("main").innerText()).includes("No collections match"),
    "Collection empty-query explanation missing");
  evidence.push("collection-empty-state:pass");
  await page.getByRole("button",{name:"Clear collection search"}).click();
  await page.waitForTimeout(350);
  const select = page.locator('main select[name="teacherId"]');
  await select.selectOption("3");
  await page.waitForTimeout(200);
  assert(await select.inputValue() === "3","Collection teacher filter did not apply");
  await select.selectOption("");
  evidence.push("collection-teacher-filter:pass");

  await page.locator("aside nav button").nth(1).click();
  await page.locator("main article button").first().click();
  const footer = page.locator("footer[aria-label]");
  await footer.locator(".player-track button").click();
  const close = footer.locator("section[aria-label] button").first();
  await close.waitFor();
  assert(await page.locator("[data-content-scroller]").evaluate(e=>e.inert===true),
    "Focused listening failed to make background inert");
  assert(await close.evaluate(e=>e===document.activeElement),
    "Focused listening failed to move focus to its close button");
  await page.keyboard.press("Escape");
  assert(await page.locator("[data-content-scroller]").evaluate(e=>e.inert===false),
    "Focused listening failed to restore background interactivity");
  await footer.locator(".player-track button").evaluate(e=>{ if(document.activeElement!==e) throw Error("Focus not restored"); });
  evidence.push("focus-dialog-inert-escape-return:pass");
  return JSON.stringify(evidence);
}`;

await mkdir("docs/redesign", { recursive: true });
const output = execFileSync("playwright-cli", ["-s=dhamma-accept", "run-code", scenario], {
  encoding: "utf8",
  maxBuffer: 4 * 1024 * 1024,
  timeout: 120000
});
await writeFile("docs/redesign/qa-directory-and-focus.log", output);
console.log(output.slice(0, 1700));
