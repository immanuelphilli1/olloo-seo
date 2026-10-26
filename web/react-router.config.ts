import type { Config } from "@react-router/dev/config";
import { articles } from "./app/content/articles";
import { toolPaths } from "./app/content/tools";

export default {
  // Static site: every public page is prerendered to full HTML at build time,
  // so crawlers that don't run JavaScript (like ChatGPT's) see all the content.
  // Report pages (/audit/:id) are rendered in the browser and are noindexed.
  ssr: false,
  async prerender() {
    return ["/", "/tools", ...toolPaths, "/learn", ...articles.map((a) => `/learn/${a.slug}`), "/about", "/privacy", "/bot"];
  },
} satisfies Config;
