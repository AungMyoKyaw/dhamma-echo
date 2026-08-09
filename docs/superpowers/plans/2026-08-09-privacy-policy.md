# Privacy Policy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish an accurate Dhamma Echo privacy policy at the repository's GitHub Pages `/privacy/` route.

**Architecture:** Add one semantic, dependency-free HTML policy page under the existing `docs/` Pages artifact, reusing the site's local CSS and logo. Link it from the landing-page footer and protect the required disclosures with Node tests and the existing static-site smoke checks.

**Tech Stack:** Static HTML, existing CSS, Node built-in test runner, GitHub Actions Pages

---

### Task 1: Add failing policy contract tests

**Files:**

- Modify: `tests/site.test.mjs`

- [ ] **Step 1: Write the failing test**

Add `privacyPath`, load `docs/privacy/index.html`, and assert the dedicated page includes one `h1`, the August 9, 2026 effective date, `builtbyamk@duck.com`, local-device storage, both Dhamma Download hosts, ordinary connection information including IP address, no sale or advertising sharing, deletion via clearing app data or uninstalling, children's privacy, and a landing-page footer link to `privacy/`.

```js
const privacyPath = new URL("../docs/privacy/index.html", import.meta.url);

test("privacy policy publishes the required user-data disclosures", async () => {
  const [privacy, landing] = await Promise.all([
    readFile(privacyPath, "utf8"),
    readFile(htmlPath, "utf8")
  ]);

  assert.match(privacy, /<title>Privacy Policy — Dhamma Echo<\/title>/);
  assert.equal((privacy.match(/<h1\b/g) ?? []).length, 1);
  assert.match(privacy, /Effective date:\s*August 9, 2026/i);
  assert.match(privacy, /builtbyamk@duck\.com/);
  assert.match(privacy, /stored locally on your device/i);
  assert.match(privacy, /dhammadownload\.com/);
  assert.match(privacy, /www\.dhammadownload\.com/);
  assert.match(privacy, /IP address/i);
  assert.match(privacy, /do not sell/i);
  assert.match(privacy, /clearing the app's data or uninstalling/i);
  assert.match(privacy, /children/i);
  assert.match(landing, /href="privacy\/"/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/site.test.mjs`

Expected: FAIL because `docs/privacy/index.html` does not exist.

- [ ] **Step 3: Commit the failing test**

```bash
git add tests/site.test.mjs
git commit -m "test: define privacy policy contract"
```

### Task 2: Implement the static privacy page

**Files:**

- Create: `docs/privacy/index.html`
- Modify: `docs/assets/site.css`
- Modify: `docs/index.html`

- [ ] **Step 1: Create the policy page**

Create a complete semantic HTML document with the existing CSP, `../assets/site.css`, `../assets/logo.svg`, a skip link, product-page navigation, one `h1`, effective date, and sections titled Overview, Information stored on your device, Information Dhamma Echo does not collect, Audio streaming and third parties, Data sharing and sale, Data retention and deletion, Children's privacy, Changes to this policy, and Contact.

The page must distinguish local app state from the standard connection data necessarily exposed to the independent Dhamma Download servers when streaming. It must not claim control over those servers or imply that remote audio is locally bundled.

- [ ] **Step 2: Add focused policy layout styles**

Extend `docs/assets/site.css` with `.policy-main`, `.policy-hero`, `.policy-card`, `.policy-section`, `.policy-meta`, and `.policy-contact` rules. Reuse existing color tokens, constrain prose to a readable width, preserve visible link focus, and add only responsive spacing changes.

- [ ] **Step 3: Link the policy from the landing page**

Add `<a href="privacy/">Privacy policy</a>` to the existing footer so the policy is publicly discoverable without JavaScript.

- [ ] **Step 4: Run policy and site tests**

Run: `node --test tests/site.test.mjs tests/site-links.test.mjs`

Expected: all tests PASS.

- [ ] **Step 5: Run the complete site verification**

Run: `npm run site:verify`

Expected: tests, 100% JavaScript coverage, and static-site smoke checks PASS.

- [ ] **Step 6: Commit the implementation**

```bash
git add docs/privacy/index.html docs/assets/site.css docs/index.html
git commit -m "feat: add privacy policy page"
```

### Task 3: Publish and verify GitHub Pages

**Files:**

- No additional files

- [ ] **Step 1: Confirm publish scope and authentication**

Run `git status -sb`, `git diff origin/master...HEAD --stat`, `gh --version`, and `gh auth status`.

Expected: only the privacy-policy design, plan, test, page, stylesheet, and footer changes are ahead of `origin/master`; GitHub CLI is installed and authenticated.

- [ ] **Step 2: Commit the implementation plan**

```bash
git add docs/superpowers/plans/2026-08-09-privacy-policy.md
git commit -m "docs: plan privacy policy implementation"
```

- [ ] **Step 3: Push the Pages source branch**

Run: `git push origin master`

Expected: the new commits push successfully and trigger `.github/workflows/pages.yml`.

- [ ] **Step 4: Monitor deployment**

Use GitHub CLI to identify the Pages workflow run for the pushed commit and watch it to completion.

Expected: build and deploy jobs complete successfully.

- [ ] **Step 5: Verify the public policy**

Request `https://aungmyokyaw.github.io/dhamma-echo/privacy/` and verify HTTP success plus the title, effective date, contact email, local-storage disclosure, and Dhamma Download disclosure.

Expected: the public page returns the newly deployed policy and is ready to paste into the store listing.
