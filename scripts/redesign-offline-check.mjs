#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";

const scenario = `async page => {
  const assert=(truth,message)=>{if(!truth)throw Error(message)};
  await page.setViewportSize({width:860,height:620});
  await page.goto("http://127.0.0.1:51729/");
  const previous=await page.evaluate(()=>localStorage.getItem("dhamma-echo:library"));
  const evidence=[];
  try {
    await page.evaluate(()=>localStorage.setItem("dhamma-echo:library",JSON.stringify({
      version:2,favorites:[],history:[],resume:{},
      downloads:{"1":"/tmp/dhamma-echo/removed-file.mp3","2":"mock://downloads/2.mp3"}
    })));
    await page.reload();
    await page.locator("aside nav button").nth(4).click();
    await page.getByRole("button",{name:"English",exact:true}).count();
    const main=page.locator("main");
    await main.getByText("Offline file missing").waitFor();
    assert((await main.innerText()).includes("Offline file missing"),
      "Missing saved file is falsely represented as downloaded");
    assert((await main.innerText()).includes("1 downloaded talk"),
      "Offline available count does not exclude missing file");
    evidence.push("offline-missing-file-reported:pass");
    const missingRow=main.locator("article").filter({hasText:"Praise and Blame"});
    await missingRow.locator('button[aria-haspopup="menu"]').click();
    await page.getByRole("menuitem",{name:"Forget missing download"}).click();
    assert(await page.evaluate(()=>JSON.parse(localStorage.getItem("dhamma-echo:library")).downloads["1"])===undefined,
      "Forgetting missing media failed to persist");
    evidence.push("offline-missing-forget-persisted:pass");

    const savedRow=main.locator("article").filter({hasText:"မေတ္တာပို့"});
    await savedRow.locator('button[aria-haspopup="menu"]').click();
    await page.getByRole("menuitem",{name:"Remove from downloads"}).click();
    assert(await page.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem("dhamma-echo:library")).downloads).length)===0,
      "Removing an available downloaded file failed to persist");
    evidence.push("offline-removal-persisted:pass");
  } finally {
    await page.evaluate(value=>{
      if(value===null)localStorage.removeItem("dhamma-echo:library");
      else localStorage.setItem("dhamma-echo:library",value);
    },previous);
    await page.reload();
  }
  return JSON.stringify(evidence);
}`;

await mkdir("docs/redesign", { recursive: true });
const output = execFileSync("playwright-cli", ["-s=dhamma-accept", "run-code", scenario], {
  encoding: "utf8",
  maxBuffer: 4 * 1024 * 1024,
  timeout: 120000
});
await writeFile("docs/redesign/qa-offline-downloads.log", output);
console.log(output.slice(0, 1800));
