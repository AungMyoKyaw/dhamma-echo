#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { writeFile } from "node:fs/promises";

// Single persistent browser: all assertions exercise the real Svelte components.
const source = `async page => {
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  const observations = [];
  await page.setViewportSize({width:860,height:620});
  await page.goto("http://127.0.0.1:51729/");
  await page.keyboard.press("Control+,");
  await page.getByRole("button",{name:"English",exact:true}).click();
  await page.getByRole("button",{name:"Light",exact:true}).click();
  await page.locator("aside nav button").nth(1).click();
  const input=page.locator('input[name="query"]');
  await input.fill("Praise");
  await page.waitForTimeout(450);
  let articles=page.locator("main article");
  assert(await articles.count()===1,"Debounced title query should yield exactly one row");
  assert((await articles.first().innerText()).includes("Praise and Blame"),"Title query returned wrong talk");
  observations.push("debounced-search:pass");
  await input.fill("absent-never-matches");
  await page.waitForTimeout(450);
  assert(await page.locator("main article").count()===0,"No-result query must not display stale rows");
  observations.push("empty-search:pass");
  await page.getByRole("button",{name:"Clear talk search"}).click();
  await page.waitForTimeout(250);
  assert(await page.locator("main article").count()>0,"Clear search must restore rows");
  observations.push("clear-search:pass");
  await page.locator('select[name="format"]').selectOption("wma");
  await page.waitForTimeout(300);
  const unsupported=page.locator("main article").first();
  assert(await unsupported.count()>0,"WMA entry must remain searchable");
  assert(await unsupported.locator("button").first().isDisabled(),"WMA Play should be disabled");
  observations.push("unsupported-wma:pass");
  await page.locator('select[name="format"]').selectOption("all");
  await page.waitForTimeout(250);
  const first=page.locator("main article").first();
  const more=first.locator('button[aria-haspopup="menu"]');
  await more.click();
  assert(await page.getByRole("menuitem").count()>=2,"Track action menu missing items");
  assert(await page.getByRole("menuitem").first().evaluate(n=>document.activeElement===n),"Menu entry focus missing");
  await page.keyboard.press("Escape");
  assert(await more.evaluate(n=>document.activeElement===n),"Menu did not return focus");
  observations.push("menu-focus-escape:pass");
  await first.locator("button").first().click();
  await page.waitForTimeout(250);
  await more.click();
  await page.getByRole("menuitem").last().click();
  const footer=page.locator("footer[aria-label]");
  assert(await footer.count()===1,"Audio footer must mount after track activation");
  const trigger=footer.locator('button[aria-expanded]').last();
  await trigger.click();
  const queue=page.getByRole("dialog",{name:"Playback queue"});
  assert(await queue.count()===1,"Queue dialog failed to open");
  assert(await queue.getByRole("button",{name:"Close queue"}).evaluate(n=>document.activeElement===n),"Queue close focus missing");
  assert((await queue.innerText()).includes("Praise and Blame"),"Queue is empty before clearing: "+await queue.innerText());
  await queue.getByRole("button",{name:"Clear",exact:true}).click();
  await queue.getByRole("button",{name:"Undo",exact:true}).waitFor({state:"visible",timeout:2000});
  await queue.getByRole("button",{name:"Undo",exact:true}).click();
  assert((await queue.innerText()).includes("Praise and Blame"),"Undo failed to restore queue");
  await page.keyboard.press("Escape");
  assert(await queue.count()===0,"Escape did not close queue");
  assert(await trigger.evaluate(n=>document.activeElement===n),"Queue failed to return focus");
  observations.push("queue-clear-undo-focus:pass");
  await footer.locator(".player-track button").first().click();
  await page.getByRole("button",{name:"Return to library"}).first().waitFor({state:"visible",timeout:2000});
  assert(await footer.evaluate(element=>Math.abs(element.getBoundingClientRect().left)<1),
    "Focused Listening does not cover the distracting sidebar");
  await page.locator('footer section[aria-label="Focus on listening"] button').click();
  observations.push("focused-listening-exit:pass");
  const teacherNavigation=page.locator("aside nav button").nth(3);
  await teacherNavigation.focus();
  await page.keyboard.press("Space");
  assert(await teacherNavigation.getAttribute("aria-current")==="page",
    "Space did not activate the focused navigation button");
  observations.push("space-activates-focused-button:pass");
  await page.keyboard.press("Control+f");
  assert(await page.locator('input[name="query"]').evaluate(input=>document.activeElement===input),
    "Global search shortcut stopped working after keyboard activation");
  observations.push("global-search-from-keyboard:pass");
  await page.locator('input[name="query"]').fill("Guided walkthrough");
  await page.locator('select[name="format"]').selectOption("mp4");
  await page.waitForTimeout(450);
  assert(await page.locator("main article").count()===1,"Expected one MP4 search result");
  await page.locator("main article button").first().click();
  assert(await page.locator("video").isVisible(),"MP4 did not open the dedicated video player");
  assert(await page.locator("footer[aria-label]").count()===0,
    "The audio footer must not coexist with the video player");
  await page.keyboard.press("Escape");
  assert(!(await page.locator("video").isVisible()),"Escape did not close the video player");
  observations.push("video-lifecycle-exit:pass");
  return JSON.stringify(observations);
}`;
const result = execFileSync("playwright-cli", ["-s=dhamma-accept", "run-code", source], {
  encoding: "utf8",
  maxBuffer: 4 * 1024 * 1024,
  timeout: 120000
});
await writeFile("docs/redesign/qa-interactions.log", result);
console.log(result.slice(0, 2200));
