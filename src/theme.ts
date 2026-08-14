type Theme = "light" | "dark" | "system";

export type ResolvedTheme = "light" | "dark";

const THEME_ATTR = "data-theme";
const MEDIA_QUERY = "(prefers-color-scheme: dark)";

function readSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "light";
  return window.matchMedia(MEDIA_QUERY).matches ? "dark" : "light";
}

function resolve(theme: Theme): ResolvedTheme {
  return theme === "system" ? readSystemTheme() : theme;
}

function applyToRoot(resolved: ResolvedTheme): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute(THEME_ATTR, resolved);
}

export function applyTheme(theme: Theme): ResolvedTheme {
  const resolved = resolve(theme);
  applyToRoot(resolved);
  return resolved;
}

export function watchSystemTheme(
  theme: Theme,
  onChange: (resolved: ResolvedTheme) => void
): () => void {
  if (
    theme !== "system" ||
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return () => {};
  }
  const media = window.matchMedia(MEDIA_QUERY);
  const handler = (): void => {
    const next: ResolvedTheme = media.matches ? "dark" : "light";
    applyToRoot(next);
    onChange(next);
  };
  media.addEventListener("change", handler);
  return () => media.removeEventListener("change", handler);
}
