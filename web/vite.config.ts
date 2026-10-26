import mdx from "@mdx-js/rollup";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv, type Plugin } from "vite";
import { generateSeoFiles } from "./seo/generate";
import { mdxHeadings } from "./seo/mdx-headings";

/** Serves robots.txt, sitemap.xml, llms.txt etc. in dev (the build writes them as files). */
function seoFilesInDev(siteUrl: string): Plugin {
  return {
    name: "seo-files-dev",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const file = generateSeoFiles(siteUrl).find((f) => f.path === req.url?.split("?")[0]);
        if (!file) return next();
        res.setHeader("Content-Type", file.type);
        res.end(file.content);
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // One .env at the repo root configures both the API server and the website.
  const env = loadEnv(mode, "..", "");
  const siteUrl = env.SITE_URL || "http://localhost:5180";
  return {
    envDir: "..",
    define: {
      "import.meta.env.VITE_SITE_URL": JSON.stringify(siteUrl),
    },
    plugins: [
      tailwindcss(),
      mdxHeadings(),
      { enforce: "pre", ...mdx({ remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug] }) },
      seoFilesInDev(siteUrl),
      reactRouter(),
    ],
    resolve: {
      tsconfigPaths: true,
      // Explicit alias so `~/…` imports also resolve inside MDX articles.
      alias: { "~": fileURLToPath(new URL("./app", import.meta.url)) },
    },
    server: {
      // Fixed port so this project doesn't collide with other local Vite apps on 5173.
      port: 5180,
      proxy: { "/api": `http://localhost:${env.PORT || 8787}` },
    },
  };
});
