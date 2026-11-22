import { upgradeGitHubLinks, wireCopyButtons } from "./site.js";

upgradeGitHubLinks(document, window.location.href);
wireCopyButtons(document);
