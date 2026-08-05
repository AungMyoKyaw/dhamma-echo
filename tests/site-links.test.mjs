import assert from "node:assert/strict";
import test from "node:test";

import {
  deriveGitHubLinks,
  upgradeGitHubLinks,
} from "../docs/assets/site.js";

test("derives repository links from a GitHub project Pages URL", () => {
  assert.deepEqual(
    deriveGitHubLinks("https://aungmyokyaw.github.io/dhamma-echo/"),
    {
      repository: "https://github.com/aungmyokyaw/dhamma-echo",
      releases: "https://github.com/aungmyokyaw/dhamma-echo/releases/latest",
    },
  );
});

test("uses only the first path segment for nested product routes", () => {
  assert.deepEqual(
    deriveGitHubLinks(
      "https://aungmyokyaw.github.io/dhamma-echo/features/privacy/",
    ),
    {
      repository: "https://github.com/aungmyokyaw/dhamma-echo",
      releases: "https://github.com/aungmyokyaw/dhamma-echo/releases/latest",
    },
  );
});

test("rejects user-site roots, custom domains, and invalid URLs", () => {
  assert.equal(deriveGitHubLinks("https://aungmyokyaw.github.io/"), null);
  assert.equal(deriveGitHubLinks("https://example.com/dhamma-echo/"), null);
  assert.equal(deriveGitHubLinks("not a url"), null);
});

test("upgrades only known GitHub link hooks", () => {
  const anchors = [
    { dataset: { githubLink: "repository" }, href: "#open-source" },
    { dataset: { githubLink: "releases" }, href: "#open-source" },
    { dataset: { githubLink: "unknown" }, href: "#untouched" },
  ];
  const documentLike = {
    querySelectorAll(selector) {
      assert.equal(selector, "[data-github-link]");
      return anchors;
    },
  };

  assert.equal(
    upgradeGitHubLinks(
      documentLike,
      "https://aungmyokyaw.github.io/dhamma-echo/",
    ),
    true,
  );
  assert.equal(
    anchors[0].href,
    "https://github.com/aungmyokyaw/dhamma-echo",
  );
  assert.equal(
    anchors[1].href,
    "https://github.com/aungmyokyaw/dhamma-echo/releases/latest",
  );
  assert.equal(anchors[2].href, "#untouched");
});

test("leaves fallback links unchanged outside GitHub Pages", () => {
  const anchor = {
    dataset: { githubLink: "repository" },
    href: "#open-source",
  };
  const documentLike = {
    querySelectorAll() {
      return [anchor];
    },
  };

  assert.equal(
    upgradeGitHubLinks(documentLike, "http://127.0.0.1:4173/"),
    false,
  );
  assert.equal(anchor.href, "#open-source");
});
