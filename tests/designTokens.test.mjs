import test from "node:test";
import assert from "node:assert/strict";
import {
  compareTokens,
  filterMetadata,
  formatTailwindTheme,
  loadCssTokens,
  parseDesignFrontmatter,
  valuesEqual
} from "../.test-build/src/designTokens.js";

const SAMPLE_DESIGN = `---
name: Sample
description: A test design system.
colors:
  canvas: "#fcf9f2"
  surface: "#ffffff"
  primary: "#8c3f08"
  primary-strong: "#6d2f00"
  on-primary: "#ffffff"
rounded:
  control: 10px
  card: 14px
---

## Overview
A test.
`;

const SAMPLE_CSS = `@import "tailwindcss";

@theme {
  --font-sans: Inter, sans-serif;
  --color-app-bg: #fcf9f2;
  --color-app-surface: #ffffff;
  --color-app-primary: #8c3f08;
  --color-app-primary-strong: #6d2f00;
  --color-app-primary-ink: #ffffff;
  --shadow-player: 0 -4px 12px rgb(0 0 0 / 0.08);
  --radius-card: 0.875rem;
  --radius-control: 0.625rem;
}
`;

test("parseDesignFrontmatter returns the yaml block as a token map", () => {
  const tokens = parseDesignFrontmatter(SAMPLE_DESIGN);
  assert.equal(tokens.colors.canvas, "#fcf9f2");
  assert.equal(tokens.colors.primary, "#8c3f08");
  assert.equal(tokens.rounded.control, "10px");
  assert.equal(tokens.rounded.card, "14px");
});

test("parseDesignFrontmatter throws when frontmatter is missing", () => {
  assert.throws(
    () => parseDesignFrontmatter("## Overview\nNo frontmatter here.\n"),
    /frontmatter/u
  );
});

test("parseDesignFrontmatter throws when the closing fence is missing", () => {
  assert.throws(
    () => parseDesignFrontmatter("---\nname: Bad\ncolors:\n  primary: red\n\n## Overview\n"),
    /frontmatter/u
  );
});

test("loadCssTokens collects theme custom properties into namespaced maps", () => {
  const css = loadCssTokens(SAMPLE_CSS);
  assert.equal(css.tokens.colors["app-bg"], "#fcf9f2");
  assert.equal(css.tokens.colors["app-primary"], "#8c3f08");
  assert.equal(css.tokens.colors["app-primary-strong"], "#6d2f00");
  assert.equal(css.tokens.colors["app-primary-ink"], "#ffffff");
  assert.equal(css.tokens.rounded.card, "0.875rem");
  assert.equal(css.tokens.rounded.control, "0.625rem");
});

test("loadCssTokens reads dark theme overrides from a [data-theme] block", () => {
  const css = loadCssTokens(
    `${SAMPLE_CSS}\n[data-theme="dark"] {\n  --color-app-bg: #181714;\n  --color-app-primary: #d8894d;\n}\n`
  );
  assert.equal(css.dark.colors["app-bg"], "#181714");
  assert.equal(css.dark.colors["app-primary"], "#d8894d");
});

test("loadCssTokens returns empty maps when the @theme block is missing", () => {
  const css = loadCssTokens("body { color: black; }\n");
  assert.deepEqual(css.tokens, {});
  assert.deepEqual(css.dark, {});
});

test("compareTokens returns no drift when the design and css agree", () => {
  const design = parseDesignFrontmatter(SAMPLE_DESIGN);
  const css = loadCssTokens(SAMPLE_CSS);
  const drift = compareTokens(design, css);
  assert.equal(drift.missingFromCss.length, 0);
  assert.equal(drift.missingFromDesign.length, 0);
  assert.equal(drift.valueMismatches.length, 0);
});

test("compareTokens flags tokens defined in DESIGN.md but missing from css", () => {
  const design = parseDesignFrontmatter(SAMPLE_DESIGN);
  const css = loadCssTokens(`@theme { --color-app-bg: #fcf9f2; }`);
  const drift = compareTokens(design, css);
  assert.ok(
    drift.missingFromCss.includes("colors.surface"),
    `expected colors.surface missing; got ${JSON.stringify(drift.missingFromCss)}`
  );
  assert.ok(
    drift.missingFromCss.includes("colors.primary"),
    `expected colors.primary missing; got ${JSON.stringify(drift.missingFromCss)}`
  );
});

test("compareTokens flags css tokens missing from the design (canonical naming)", () => {
  const design = parseDesignFrontmatter(SAMPLE_DESIGN);
  const css = loadCssTokens(SAMPLE_CSS.replace("--color-app-primary-ink: #ffffff;", "--color-app-primary-ink: #ffffff;\n  --color-app-warning: #ff0000;"));
  const drift = compareTokens(design, css);
  assert.ok(
    drift.missingFromDesign.includes("colors.app-warning"),
    `expected colors.app-warning extra; got ${JSON.stringify(drift.missingFromDesign)}`
  );
});

test("compareTokens reports mismatched values between design and css", () => {
  const design = parseDesignFrontmatter(SAMPLE_DESIGN);
  const css = loadCssTokens(
    `${SAMPLE_CSS.replace("#8c3f08", "#000000")}`
  );
  const drift = compareTokens(design, css);
  const primaryMismatch = drift.valueMismatches.find(
    (m) => m.path === "colors.primary"
  );
  assert.ok(primaryMismatch !== undefined, "expected colors.primary mismatch");
  assert.equal(primaryMismatch.design, "#8c3f08");
  assert.equal(primaryMismatch.css, "#000000");
});

test("compareTokens treats equivalent colors as equal (case insensitive)", () => {
  const design = parseDesignFrontmatter(SAMPLE_DESIGN);
  const css = loadCssTokens(
    SAMPLE_CSS.replace("#fcf9f2", "#FCF9F2").replace("#8c3f08", "#8C3F08")
  );
  const drift = compareTokens(design, css);
  assert.equal(drift.valueMismatches.length, 0);
});

test("compareTokens treats px and rem as equivalent for color and round values", () => {
  const design = parseDesignFrontmatter(SAMPLE_DESIGN);
  const css = loadCssTokens(SAMPLE_CSS.replace("#8c3f08", "#8c3f08"));
  const drift = compareTokens(design, css);
  assert.equal(drift.missingFromCss.length, 0);
  assert.equal(drift.missingFromDesign.length, 0);
});

test("compareTokens validates dark-mode color overrides", () => {
  const design = {
    colors: {
      "canvas-dark": "#181714",
      "surface-dark": "#23211d",
      "primary-dark": "#d8894d"
    }
  };
  const css = loadCssTokens(
    '[data-theme="dark"] {\n  --color-app-bg: #181714;\n  --color-app-surface: #23211d;\n  --color-app-primary: #d8894d;\n}\n'
  );
  const drift = compareTokens(design, css);
  assert.equal(drift.missingFromCss.length, 0);
});

test("compareTokens flags dark tokens missing from css", () => {
  const design = { colors: { "canvas-dark": "#181714", "surface-dark": "#000000" } };
  const css = loadCssTokens('[data-theme="dark"] {\n  --color-app-bg: #181714;\n}\n');
  const drift = compareTokens(design, css);
  assert.ok(drift.missingFromCss.includes("colors.surface-dark"));
});

test("compareTokens reports dark value mismatches", () => {
  const design = { colors: { "primary-dark": "#d8894d" } };
  const css = loadCssTokens('[data-theme="dark"] {\n  --color-app-primary: #000000;\n}\n');
  const drift = compareTokens(design, css);
  assert.equal(drift.valueMismatches.length, 1);
  assert.equal(drift.valueMismatches[0].path, "colors.primary-dark");
});

test("valuesEqual treats 10px and 0.625rem as equal", () => {
  assert.equal(valuesEqual("10px", "0.625rem"), true);
  assert.equal(valuesEqual("0.625rem", "10px"), true);
});

test("valuesEqual returns false for clearly different pixel values", () => {
  assert.equal(valuesEqual("10px", "12px"), false);
});

test("valuesEqual treats arbitrary strings that are not length units as exact matches", () => {
  assert.equal(valuesEqual("Inter", "Inter"), true);
  assert.equal(valuesEqual("Inter", "Roboto"), false);
});

test("valuesEqual handles fractional rem values", () => {
  assert.equal(valuesEqual("1rem", "16px"), true);
  assert.equal(valuesEqual("0.5rem", "8px"), true);
});

test("compareTokens works when design declares only dark colors", () => {
  const design = { colors: { "canvas-dark": "#181714" } };
  const css = loadCssTokens('[data-theme="dark"] {\n  --color-app-bg: #181714;\n}\n');
  const drift = compareTokens(design, css);
  assert.equal(drift.missingFromCss.length, 0);
  assert.equal(drift.missingFromDesign.length, 0);
});

test("compareTokens works when design has no colors group at all", () => {
  const design = { rounded: { control: "10px" } };
  const css = loadCssTokens("@theme { --radius-control: 0.625rem; --color-app-bg: #fff; }\n");
  const drift = compareTokens(design, css);
  assert.equal(drift.missingFromCss.length, 0);
});

test("compareTokens flags dark tokens when css has no dark block", () => {
  const design = { colors: { "canvas-dark": "#181714", "surface-dark": "#23211d" } };
  const css = loadCssTokens("@theme { --color-app-bg: #fff; }\n");
  const drift = compareTokens(design, css);
  assert.ok(drift.missingFromCss.includes("colors.canvas-dark"));
  assert.ok(drift.missingFromCss.includes("colors.surface-dark"));
});

test("loadCssTokens classifies every CSS custom property prefix", () => {
  const css = loadCssTokens(
    "@theme { --color-x: #fff; --radius-y: 4px; --spacing-z: 8px; --font-w: Inter; --shadow-v: 1px; }\n"
  );
  assert.equal(css.tokens.colors.x, "#fff");
  assert.equal(css.tokens.rounded.y, "4px");
  assert.equal(css.tokens.spacing.z, "8px");
  assert.equal(css.tokens.typography.w, "Inter");
  assert.equal(css.tokens.shadow.v, "1px");
});

test("compareTokens allows the design to omit rounded and spacing silently", () => {
  const design = parseDesignFrontmatter(`---\nname: t\ncolors:\n  primary: "#8c3f08"\n---\n## Overview\n`);
  const css = loadCssTokens(SAMPLE_CSS);
  const drift = compareTokens(design, css);
  assert.equal(drift.missingFromDesign.length, 0);
});

test("compareTokens flags color tokens missing from css", () => {
  const design = { colors: { canvas: "#fcf9f2", surface: "#ffffff" } };
  const css = loadCssTokens("@theme { --color-app-bg: #fcf9f2; }\n");
  const drift = compareTokens(design, css);
  assert.ok(drift.missingFromCss.includes("colors.surface"));
});

test("formatTailwindTheme emits a complete @theme block from the design tokens", () => {
  const design = parseDesignFrontmatter(SAMPLE_DESIGN);
  const css = formatTailwindTheme(design);
  assert.match(css, /@theme\s*\{/u);
  assert.match(css, /--color-canvas:\s*#fcf9f2/u);
  assert.match(css, /--color-primary:\s*#8c3f08/u);
  assert.match(css, /--radius-control:\s*10px/u);
  assert.match(css, /--radius-card:\s*14px/u);
});

test("formatTailwindTheme preserves reference values verbatim", () => {
  const design = { colors: { primary: "{colors.primary}" } };
  const css = formatTailwindTheme(design);
  assert.match(css, /--color-primary:\s*\{colors\.primary\}/u);
});

test("formatTailwindTheme iterates over multiple token groups", () => {
  const design = {
    colors: { primary: "#fff", secondary: "#000" },
    rounded: { sm: "4px" },
    spacing: { md: "16px" }
  };
  const css = formatTailwindTheme(design);
  assert.match(css, /--color-primary/u);
  assert.match(css, /--color-secondary/u);
  assert.match(css, /--radius-sm/u);
  assert.match(css, /--spacing-md/u);
});

test("formatTailwindTheme skips groups with no mapped CSS prefix", () => {
  const design = { components: { button: "{colors.primary}" } };
  const css = formatTailwindTheme(design);
  assert.equal(css, "@theme {\n}\n");
});

test("formatTailwindTheme emits spacing and typography entries with the right prefix", () => {
  const design = {
    spacing: { sm: "8px", md: "16px" },
    typography: { h1: "Inter" }
  };
  const css = formatTailwindTheme(design);
  assert.match(css, /--spacing-sm:\s*8px/u);
  assert.match(css, /--spacing-md:\s*16px/u);
  assert.match(css, /--font-h1:\s*Inter/u);
});

test("loadCssTokens ignores unknown property prefixes", () => {
  const css = loadCssTokens("@theme { --weird-x: 1px; --color-app-foo: #000; }\n");
  assert.equal(css.tokens.colors["app-foo"], "#000");
  assert.equal(css.tokens.weird, undefined);
});

test("loadCssTokens returns empty when no block matches the opener", () => {
  const css = loadCssTokens("@media (min-width: 800px) { body { color: red; } }\n");
  assert.deepEqual(css.tokens, {});
  assert.deepEqual(css.dark, {});
});

test("loadCssTokens returns empty when the opener block is never closed", () => {
  const css = loadCssTokens("@theme { --color-app-bg: #fcf9f2;");
  assert.deepEqual(css.tokens, {});
});

test("loadCssTokens handles nested blocks inside the opener scope", () => {
  const css = loadCssTokens(
    "@theme { --color-canvas: red; @media (min-width: 800px) { --color-canvas: blue; } }"
  );
  assert.equal(css.tokens.colors?.canvas, "red");
});

test("parseDesignFrontmatter throws when a line is not a mapping", () => {
  assert.throws(
    () => parseDesignFrontmatter("---\nname: bad\n[unrelated]\n---\nbody\n"),
    /not a mapping/u
  );
});

test("parseDesignFrontmatter throws when a colon is not followed by whitespace", () => {
  assert.throws(
    () => parseDesignFrontmatter("---\nname:bad\n---\nbody\n"),
    /not a mapping/u
  );
});

test("parseDesignFrontmatter ignores comment lines and blank lines", () => {
  const tokens = parseDesignFrontmatter(
    "---\n# top comment\n\nname: t\ncolors:\n  # nested comment\n  primary: red\n---\nbody\n"
  );
  assert.equal(tokens.colors.primary, "red");
});

test("parseDesignFrontmatter tolerates CR/LF line endings", () => {
  const tokens = parseDesignFrontmatter("---\r\nname: t\r\ncolors:\r\n  primary: \"#abcdef\"\r\n---\r\nbody\r\n");
  assert.equal(tokens.colors.primary, "#abcdef");
});

test("parseDesignFrontmatter accepts unquoted scalar values", () => {
  const tokens = parseDesignFrontmatter("---\nname: t\ncolors:\n  primary: red\n---\nbody\n");
  assert.equal(tokens.colors.primary, "red");
});

test("parseDesignFrontmatter strips surrounding quotes from quoted values", () => {
  const tokens = parseDesignFrontmatter(
    '---\nname: t\ncolors:\n  primary: "red"\n  accent: \'blue\'\n---\nbody\n'
  );
  assert.equal(tokens.colors.primary, "red");
  assert.equal(tokens.colors.accent, "blue");
});

test("parseDesignFrontmatter flattens deeply nested indentation into dotted paths", () => {
  const tokens = parseDesignFrontmatter("---\ncolors:\n  primary:\n    nested: deep\n---\n");
  assert.equal(tokens.colors["primary.nested"], "deep");
});

test("filterMetadata drops name, description, version, and empty groups", () => {
  const filtered = filterMetadata({
    name: { "": "Test" },
    description: { "": "hi" },
    version: { "": "1" },
    empty: {},
    colors: { canvas: "#fff" }
  });
  assert.deepEqual(filtered, { colors: { canvas: "#fff" } });
});

test("parseDesignFrontmatter handles colon-followed-by-tab as a separator", () => {
  const tokens = parseDesignFrontmatter("---\ncolors:\n\tprimary:\tred\n---\n");
  assert.equal(tokens.colors.primary, "red");
});

test("parseDesignFrontmatter filters out groups whose leaves were all empty", () => {
  const tokens = parseDesignFrontmatter("---\ncolors:\n  primary:\n---\n");
  assert.equal(tokens.colors, undefined);
});

test("parseDesignFrontmatter keeps single quotes inside double-quoted values intact", () => {
  const tokens = parseDesignFrontmatter(
    '---\ncolors:\n  primary: "abc:def\'ghi"\n---\n'
  );
  assert.equal(tokens.colors.primary, "abc:def'ghi");
});

test("parseDesignFrontmatter keeps double quotes inside single-quoted values intact", () => {
  const tokens = parseDesignFrontmatter(
    "---\ncolors:\n  primary: 'abc:def\"ghi'\n---\n"
  );
  assert.equal(tokens.colors.primary, 'abc:def"ghi');
});

test("parseDesignFrontmatter handles unquoted values containing colons", () => {
  const tokens = parseDesignFrontmatter(
    "---\ncolors:\n  url: https://example.com:8080/x\n---\n"
  );
  assert.equal(tokens.colors.url, "https://example.com:8080/x");
});

test("parseDesignFrontmatter pops back to shallower indentation", () => {
  const tokens = parseDesignFrontmatter(
    "---\ncolors:\n  primary:\n    nested: deep\n  other: also\n---\n"
  );
  assert.equal(tokens.colors["primary.nested"], "deep");
  assert.equal(tokens.colors.other, "also");
});

test("parseDesignFrontmatter keeps single-character scalar values", () => {
  const tokens = parseDesignFrontmatter("---\ncolors:\n  primary: a\n---\n");
  assert.equal(tokens.colors.primary, "a");
});

test("parseDesignFrontmatter keeps mismatched quotes as part of the value", () => {
  const tokens = parseDesignFrontmatter("---\ncolors:\n  primary: \"a'\n---\n");
  assert.equal(tokens.colors.primary, "\"a'");
});

test("parseDesignFrontmatter discards empty scalar top-level values", () => {
  const tokens = parseDesignFrontmatter('---\nname: ""\ncolors:\n  primary: "#fff"\n---\n');
  assert.equal(tokens.colors.primary, "#fff");
});

test("parseDesignFrontmatter discards empty scalar nested values", () => {
  const tokens = parseDesignFrontmatter(
    '---\ncolors:\n  primary:\n    nested: ""\n    kept: "value"\n---\n'
  );
  assert.equal(tokens.colors["primary.kept"], "value");
  assert.equal(tokens.colors["primary.nested"], undefined);
});

test("parseDesignFrontmatter accepts a key containing only letters", () => {
  const tokens = parseDesignFrontmatter("---\nx: y\n---\n");
  assert.equal(tokens.x[""], "y");
});

test("loadCssTokens ignores properties inside @media blocks", () => {
  const css = loadCssTokens("@media (min-width: 800px) { --color-app-bg: #fff; }\n");
  assert.deepEqual(css.tokens, {});
});

test("compareTokens treats empty css.tokens as missing all color tokens", () => {
  const design = parseDesignFrontmatter(SAMPLE_DESIGN);
  const css = { tokens: {}, dark: {} };
  const drift = compareTokens(design, css);
  assert.equal(drift.missingFromCss.length, 5);
});

test("formatTailwindTheme kebabs both underscores and whitespace", () => {
  const design = { colors: { "primary strong": "#000" } };
  const css = formatTailwindTheme(design);
  assert.match(css, /--color-primary-strong/u);
});

test("unquote leaves values without matching quotes untouched", () => {
  const tokens = parseDesignFrontmatter(
    "---\ncolors:\n  primary: \"red\"\n  secondary: 'blue'\n  tertiary: bare\n---\n"
  );
  assert.equal(tokens.colors.primary, "red");
  assert.equal(tokens.colors.secondary, "blue");
  assert.equal(tokens.colors.tertiary, "bare");
});

test("compareTokens treats the aliased name on the design side as the source of truth", () => {
  const design = { colors: { terracotta: "#aa3322" } };
  const css = loadCssTokens("@theme { --color-app-terracotta: #aa3322; }\n");
  const drift = compareTokens(design, css);
  assert.equal(drift.missingFromCss.length, 1);
  assert.equal(drift.missingFromCss[0], "colors.terracotta");
});

test("compareTokens flags colors missing from css when css has no color tokens", () => {
  const design = { colors: { canvas: "#fff", surface: "#000", primary: "#888" } };
  const css = loadCssTokens("@theme { --radius-card: 14px; }\n");
  const drift = compareTokens(design, css);
  assert.equal(drift.missingFromCss.length, 3);
});

test("loadCssTokens returns nested braces via the findBlockEnd depth counter", () => {
  const css = loadCssTokens(
    "@theme { --color-app-bg: #fcf9f2; --shadow-card: 0 0 0 1px rgba(0,0,0,0.1); }\n"
  );
  assert.equal(css.tokens.colors["app-bg"], "#fcf9f2");
});

test("formatTailwindTheme kebabs mixed-case token names", () => {
  const design = { colors: { primaryStrong: "#000" } };
  const css = formatTailwindTheme(design);
  assert.match(css, /--color-primary-strong:\s*#000/u);
});

test("formatTailwindTheme normalizes underscores in token names", () => {
  const design = { rounded: { pill_lg: "20px" } };
  const css = formatTailwindTheme(design);
  assert.match(css, /--radius-pill-lg:\s*20px/u);
});

test("compareTokens handles tokens defined only in css but the design declares the group", () => {
  const design = { colors: { canvas: "#fcf9f2" } };
  const css = loadCssTokens(
    "@theme { --color-app-bg: #fcf9f2; --color-app-extra: #abcdef; }\n"
  );
  const drift = compareTokens(design, css);
  assert.ok(drift.missingFromDesign.includes("colors.app-extra"));
});

test("compareTokens with empty css group returns all design tokens missing", () => {
  const design = { colors: { canvas: "#fff", surface: "#000" } };
  const css = loadCssTokens("body { color: red; }\n");
  const drift = compareTokens(design, css);
  assert.equal(drift.missingFromCss.length, 2);
});

test("compareTokens treats value mismatch as a mismatch even when the alias resolves", () => {
  const design = { colors: { primary: "#8c3f08" } };
  const css = loadCssTokens("@theme { --color-app-primary: #000000; }\n");
  const drift = compareTokens(design, css);
  assert.equal(drift.valueMismatches.length, 1);
  assert.equal(drift.valueMismatches[0].path, "colors.primary");
});