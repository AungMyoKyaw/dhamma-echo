/**
 * Token parsing and comparison for the project's DESIGN.md frontmatter and
 * matching CSS custom properties in `src/index.css`. Keeps the design system
 * source of truth in DESIGN.md while letting `scripts/design-check.mjs`
 * surface drift at PR time.
 *
 * The YAML subset we accept is deliberately narrow: two levels of mapping,
 * scalar values, optional double-quoting, and `{path.to.token}` references.
 * Anything richer (anchors, multi-line scalars, complex keys) should fail
 * loudly so we can either extend the parser or simplify the source.
 */

export interface TokenMap {
  [group: string]: { [name: string]: string };
}

export interface LoadedCssTokens {
  tokens: TokenMap;
  dark: TokenMap;
}

export interface DriftReport {
  missingFromCss: string[];
  missingFromDesign: string[];
  valueMismatches: Array<{ path: string; design: string; css: string }>;
}

/**
 * Maps semantic token names used in DESIGN.md to the prefixed names used in
 * `src/index.css`. The CSS layer adds an `app-` prefix for color tokens and
 * keeps raw `--color-error` for error roles; this map keeps the design
 * readable without renaming every reference.
 */
const COLOR_ALIASES: Record<string, string> = {
  canvas: "app-bg",
  surface: "app-surface",
  soft: "app-soft",
  ink: "app",
  "ink-muted": "app-muted",
  border: "app-border",
  primary: "app-primary",
  "primary-strong": "app-primary-strong",
  "on-primary": "app-primary-ink",
  secondary: "app-secondary",
  tertiary: "app-tertiary"
};

function aliasColor(name: string): string {
  const stripped = name.endsWith("-dark") ? name.slice(0, -"-dark".length) : name;
  const aliased = COLOR_ALIASES[stripped] ?? stripped;
  return aliased;
}

const FRONT_MATTER = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/u;

type YamlValue = string | YamlGroup;
interface YamlGroup {
  [key: string]: YamlValue;
}

export function parseDesignFrontmatter(markdown: string): TokenMap {
  const match = FRONT_MATTER.exec(markdown);
  if (match === null) {
    throw new Error("DESIGN.md frontmatter not found (expected `---` fences).");
  }
  return filterMetadata(collapseYaml(parseYamlMap(match[1] as string)));
}

export function loadCssTokens(css: string): LoadedCssTokens {
  return {
    tokens: scanThemeBlock(css, /@theme\s*\{/u),
    dark: scanThemeBlock(css, /\[data-theme="dark"\]\s*\{/u)
  };
}

export function compareTokens(design: TokenMap, css: LoadedCssTokens): DriftReport {
  const missingFromCss: string[] = [];
  const valueMismatches: DriftReport["valueMismatches"] = [];
  const knownColorAliases = new Set(Object.values(COLOR_ALIASES));
  const designColors = (design.colors ?? {}) as Record<string, string>;
  const cssColors = css.tokens.colors as Record<string, string> | undefined;
  const cssDarkColors = css.dark.colors as Record<string, string> | undefined;

  for (const name of Object.keys(designColors)) {
    const isDarkVariant = name.endsWith("-dark");
    const alias = aliasColor(name);
    const cssSource = isDarkVariant ? cssDarkColors : cssColors;
    const path = `colors.${name}`;
    const designValue = designColors[name] as string;
    const cssValue = cssSource === undefined ? undefined : cssSource[alias];
    if (cssValue === undefined) {
      missingFromCss.push(path);
      continue;
    }
    if (!valuesEqual(designValue, cssValue)) {
      valueMismatches.push({ path, design: designValue, css: cssValue });
    }
  }

  const missingFromDesign: string[] = [];
  const designColorNames = new Set(Object.keys(designColors));
  for (const name of Object.keys(cssColors ?? {})) {
    if (knownColorAliases.has(name)) continue;
    if (!designColorNames.has(name)) missingFromDesign.push(`colors.${name}`);
  }

  return { missingFromCss, missingFromDesign, valueMismatches };
}

export function formatTailwindTheme(tokens: TokenMap): string {
  const lines: string[] = ["@theme {"];
  for (const group of Object.keys(tokens)) {
    const prefix = groupToPropertyPrefix(group);
    if (prefix === null) continue;
    const groupTokens = tokens[group] as Record<string, string>;
    for (const [name, value] of Object.entries(groupTokens)) {
      lines.push(`  ${prefix}-${kebab(name)}: ${value};`);
    }
  }
  lines.push("}");
  return `${lines.join("\n")}\n`;
}

function groupToPropertyPrefix(group: string): string | null {
  switch (group) {
    case "colors":
      return "--color";
    case "rounded":
      return "--radius";
    case "spacing":
      return "--spacing";
    case "typography":
      return "--font";
    default:
      return null;
  }
}

function kebab(input: string): string {
  const dashed = input.replace(/[_\s]+/gu, "-");
  const camelSplit = dashed.replace(/([a-z0-9])([A-Z])/gu, "$1-$2");
  return camelSplit.toLowerCase();
}

export function valuesEqual(a: string, b: string): boolean {
  return normalizeValue(a) === normalizeValue(b);
}

function normalizeValue(value: string): string {
  const stripped = value.replace(/\s+/gu, "").toLowerCase();
  const pixelMatch = /^(-?[0-9.]+)px$/u.exec(stripped);
  if (pixelMatch !== null) {
    return `${Number(pixelMatch[1])
      .toFixed(4)
      .replace(/\.?0+$/u, "")}px`;
  }
  const remMatch = /^(-?[0-9.]+)rem$/u.exec(stripped);
  if (remMatch !== null) {
    const pixels = Number(remMatch[1]) * 16;
    return `${pixels.toFixed(4).replace(/\.?0+$/u, "")}px`;
  }
  return stripped;
}

function scanThemeBlock(css: string, opener: RegExp): TokenMap {
  const map: TokenMap = {};
  const openerMatch = opener.exec(css);
  if (openerMatch === null) return map;
  const startIndex = openerMatch.index + openerMatch[0].length;
  const closeIndex = findBlockEnd(css, startIndex);
  if (closeIndex === -1) return map;
  const body = css.slice(startIndex, closeIndex);
  const propertyPattern = /--([a-z0-9-]+)\s*:\s*([^;]+);/gu;
  for (const match of body.matchAll(propertyPattern)) {
    const fullName = match[1] as string;
    const rawValue = (match[2] as string).trim();
    const { group, name } = classifyProperty(fullName);
    if (group === null) continue;
    (map[group] ??= {})[name] = rawValue;
  }
  return map;
}

function findBlockEnd(css: string, startIndex: number): number {
  let depth = 1;
  for (let index = startIndex; index < css.length; index += 1) {
    const char = css[index];
    if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function classifyProperty(name: string): { group: string | null; name: string } {
  if (name.startsWith("color-")) return { group: "colors", name: name.slice("color-".length) };
  if (name.startsWith("radius-")) return { group: "rounded", name: name.slice("radius-".length) };
  if (name.startsWith("spacing-")) return { group: "spacing", name: name.slice("spacing-".length) };
  if (name.startsWith("font-")) return { group: "typography", name: name.slice("font-".length) };
  if (name.startsWith("shadow-")) return { group: "shadow", name: name.slice("shadow-".length) };
  return { group: null, name };
}

function parseYamlMap(source: string): YamlGroup {
  const root: YamlGroup = {};
  const lines = source.split(/\r?\n/u);
  const stack: Array<{ indent: number; bucket: YamlGroup }> = [{ indent: -1, bucket: root }];

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+$/u, "");
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue;
    const indent = line.length - line.trimStart().length;
    const colonIndex = findMappingColon(trimmed);
    if (colonIndex === -1) {
      throw new Error(`DESIGN.md frontmatter line is not a mapping: "${line}"`);
    }
    const key = trimmed.slice(0, colonIndex).trim();
    const rawValue = trimmed.slice(colonIndex + 1).trim();

    while (stack.length > 1 && (stack[stack.length - 1] as { indent: number }).indent >= indent) {
      stack.pop();
    }
    const parent = stack[stack.length - 1] as { indent: number; bucket: YamlGroup };

    if (rawValue === "") {
      const bucket: YamlGroup = {};
      parent.bucket[key] = bucket;
      stack.push({ indent, bucket });
      continue;
    }
    parent.bucket[key] = unquote(rawValue);
  }

  return root;
}

function findMappingColon(trimmed: string): number {
  for (let index = 0; index < trimmed.length; index += 1) {
    if (trimmed[index] !== ":") continue;
    const next = trimmed[index + 1];
    if (next === " " || next === "\t" || next === undefined) return index;
  }
  return -1;
}

function unquote(value: string): string {
  if (value.length >= 2) {
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return value.slice(1, -1);
    }
  }
  return value;
}

function collapseYaml(root: YamlGroup): TokenMap {
  const result: TokenMap = {};
  for (const [group, value] of Object.entries(root)) {
    if (typeof value === "string") {
      if (value.trim() === "") continue;
      result[group] = { "": value };
      continue;
    }
    const nested: { [name: string]: string } = {};
    flattenInto(nested, "", value);
    result[group] = nested;
  }
  return result;
}

function flattenInto(target: { [name: string]: string }, prefix: string, value: YamlValue): void {
  if (typeof value === "string") {
    if (value.trim() !== "") target[prefix] = value;
    return;
  }
  for (const [name, child] of Object.entries(value)) {
    const next = prefix === "" ? name : `${prefix}.${name}`;
    flattenInto(target, next, child);
  }
}

const METADATA_KEYS = new Set(["name", "description", "version"]);

export function filterMetadata(tokens: TokenMap): TokenMap {
  const result: TokenMap = {};
  for (const [group, value] of Object.entries(tokens)) {
    if (METADATA_KEYS.has(group)) continue;
    if (Object.keys(value).length === 0) continue;
    result[group] = value;
  }
  return result;
}
