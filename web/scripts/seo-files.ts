// Runs after `react-router build`: writes robots.txt, sitemap.xml, llms.txt,
// llms-full.txt, rss.xml and site.webmanifest into build/client.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateSeoFiles } from "../seo/generate";

const out = path.join(path.dirname(path.dirname(fileURLToPath(import.meta.url))), "build/client");
if (!fs.existsSync(out)) throw new Error("build/client not found, run react-router build first.");

const siteUrl = process.env.SITE_URL || "http://localhost:5180";
const files = generateSeoFiles(siteUrl);
for (const file of files) fs.writeFileSync(path.join(out, file.path), file.content);
console.log(`SEO files written for ${siteUrl}: ${files.map((f) => f.path.slice(1)).join(", ")}`);
