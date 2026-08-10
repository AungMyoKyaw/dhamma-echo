const DHAMMA_DOWNLOAD_HOSTS = ["www.dhammadownload.com", "dhammadownload.com"] as const;
const DHAMMA_DOWNLOAD_HOST_SET = new Set<string>(DHAMMA_DOWNLOAD_HOSTS);

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

export function mediaUrlCandidates(value: string, format: string): string[] {
  if (format.trim().toLowerCase() !== "mp3") return [];
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
