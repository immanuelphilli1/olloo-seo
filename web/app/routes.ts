import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";
import { articles } from "./content/articles";
import { tools } from "./content/tools";

export default [
  layout("routes/site-layout.tsx", [
    index("routes/home.tsx"),
    route("tools", "routes/tools-index.tsx"),
    ...tools.map((t) => route(`tools/${t.slug}`, `routes/tools/${t.slug}.tsx`)),
    route("learn", "routes/learn-index.tsx"),
    // Each article is an MDX route module; the layout adds title, author, schema and links.
    layout("routes/learn-article.tsx", articles.map((a) => route(`learn/${a.slug}`, `content/learn/${a.slug}.mdx`))),
    route("about", "routes/about.tsx"),
    route("privacy", "routes/privacy.tsx"),
    route("bot", "routes/bot.tsx"),
    route("audit/:id", "routes/audit.tsx"),
    route("*", "routes/not-found.tsx"),
  ]),
] satisfies RouteConfig;
