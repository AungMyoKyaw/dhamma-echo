export function deriveGitHubLinks(input) {
  try {
    const url = new URL(input);
    const suffix = ".github.io";
    const hostname = url.hostname.toLowerCase();
    if (!hostname.endsWith(suffix)) {
      return null;
    }

    const owner = hostname.slice(0, -suffix.length);
    const segment = url.pathname.split("/").find(Boolean);
    if (!owner || !segment) {
      return null;
    }

    const repository = decodeURIComponent(segment);
    const base = `https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}`;
    return {
      repository: base,
      releases: `${base}/releases/latest`
    };
  } catch {
    return null;
  }
}

export function upgradeGitHubLinks(documentLike, locationHref) {
  const links = deriveGitHubLinks(locationHref);
  if (!links) {
    return false;
  }

  for (const anchor of documentLike.querySelectorAll("[data-github-link]")) {
    const kind = anchor.dataset.githubLink;
    if (kind === "repository" || kind === "releases") {
      anchor.href = links[kind];
    }
  }

  return true;
}

export function wireCopyButtons(documentLike) {
  for (const button of documentLike.querySelectorAll("[data-copy-text]")) {
    let resetTimer = null;
    button.addEventListener("click", async () => {
      const text = button.dataset.copyText;
      if (!text) {
        return;
      }

      try {
        await navigator.clipboard.writeText(text);
        button.textContent = "Copied";
        button.dataset.copied = "true";
        if (resetTimer) {
          clearTimeout(resetTimer);
        }
        resetTimer = setTimeout(() => {
          button.textContent = "Copy";
          delete button.dataset.copied;
          resetTimer = null;
        }, 2000);
      } catch {
        // Clipboard API unavailable (e.g. insecure context); leave command selectable
      }
    });
  }
}
