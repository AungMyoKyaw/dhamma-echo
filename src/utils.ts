const DHAMMA_DOWNLOAD_HOSTS = ["www.dhammadownload.com", "dhammadownload.com"] as const;
const DHAMMA_DOWNLOAD_HOST_SET = new Set<string>(DHAMMA_DOWNLOAD_HOSTS);

const BURMESE_DIGITS: Record<number, string> = {
  0: "၀",
  1: "၁",
  2: "၂",
  3: "၃",
  4: "၄",
  5: "၅",
  6: "၆",
  7: "၇",
  8: "၈",
  9: "၉"
};

function toBurmeseDigits(input: string): string {
  return input.replace(/\d/gu, (digit) => BURMESE_DIGITS[Number(digit)] as string);
}

function isBurmeseLocale(locale: string): boolean {
  return locale.toLowerCase().startsWith("my");
}

export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/gu, " ").trim();
}

export function clamp(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) return minimum;
  return Math.min(maximum, Math.max(minimum, value));
}

export function formatDuration(value: number): string {
  const total = Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function formatLocaleDuration(value: number, locale: string): string {
  const formatted = formatDuration(value);
  return isBurmeseLocale(locale) ? toBurmeseDigits(formatted) : formatted;
}

export function formatLocaleNumber(value: number, locale: string): string {
  const safe = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  let formatted: string;
  try {
    formatted = new Intl.NumberFormat(locale).format(safe);
  } catch {
    formatted = String(safe);
  }
  return isBurmeseLocale(locale) ? toBurmeseDigits(formatted) : formatted;
}

export function pluralize(
  count: number,
  singular: string,
  plural?: string,
  locale: string = "en-US"
): string {
  const safe = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  const noun = safe === 1 ? singular : (plural ?? `${singular}s`);
  const effectiveLocale = locale === "en-US" && /[\u1000-\u109F]/u.test(noun) ? "my-MM" : locale;
  return `${formatLocaleNumber(safe, effectiveLocale)} ${noun}`;
}

export function mediaUrlCandidates(value: string, format: string): string[] {
  const normalized = format.trim().toLowerCase();
  if (normalized !== "mp3" && normalized !== "mp4") return [];
  try {
    const url = new URL(value);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      !DHAMMA_DOWNLOAD_HOST_SET.has(url.hostname.toLowerCase()) ||
      url.port !== "" ||
      url.username !== "" ||
      url.password !== ""
    ) {
      return [];
    }
    url.protocol = "https:";
    url.hash = "";
    return DHAMMA_DOWNLOAD_HOSTS.map((hostname) => {
      const candidate = new URL(url.href);
      candidate.hostname = hostname;
      return candidate.href;
    });
  } catch {
    return [];
  }
}
