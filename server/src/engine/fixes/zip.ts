import JSZip from "jszip";
import type { ActionPlan, Finding } from "../types.ts";

/** Bundles every generated file (robots.txt, sitemap.xml, schema, …) into one ZIP. */
export async function buildFixZip(host: string, findings: Finding[], plan: ActionPlan | null): Promise<Buffer> {
  const zip = new JSZip();
  const added = new Set<string>();
  for (const finding of findings) {
    for (const file of finding.fix?.files ?? []) {
      if (added.has(file.filename)) continue;
      added.add(file.filename);
      zip.file(file.filename, file.content);
    }
  }
  if (plan?.faqSchema) zip.file("faq-schema.html", plan.faqSchema);

  const readme = [
    `SEO fixes for ${host}`,
    "",
    "Files in this bundle:",
    ...[...added, ...(plan?.faqSchema ? ["faq-schema.html"] : [])].map((f) => `- ${f}`),
    "",
    "robots.txt, sitemap.xml and llms.txt go in the root folder of your website (so they load at yourdomain.com/robots.txt etc.).",
    "The .html files contain <script type=\"application/ld+json\"> blocks, paste them into the <head> of the matching pages.",
    "See your online report for step-by-step instructions for your platform.",
  ].join("\n");
  zip.file("README.txt", readme);
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}
