import type { MetaDescriptor } from "react-router";
import { absoluteUrl, site } from "~/config/site";

interface SeoOptions {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  image?: string;
  noindex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
}

/** Title, description, canonical, Open Graph and Twitter tags for a page. */
export function seo({ title, description, path, type = "website", image = site.ogImage, noindex, publishedTime, modifiedTime }: SeoOptions): MetaDescriptor[] {
  const url = absoluteUrl(path);
  const imageUrl = image.startsWith("http") ? image : absoluteUrl(image);
  const tags: MetaDescriptor[] = [
    { title },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: url },
    { property: "og:type", content: type },
    { property: "og:site_name", content: site.name },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:image", content: imageUrl },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: `${site.name} — free SEO audit for Google and AI search` },
    { property: "og:locale", content: site.locale },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: imageUrl },
    { name: "twitter:image:alt", content: `${site.name} — free SEO audit for Google and AI search` },
  ];
  if (noindex) tags.push({ name: "robots", content: "noindex, follow" });
  if (publishedTime) tags.push({ property: "article:published_time", content: publishedTime });
  if (modifiedTime) tags.push({ property: "article:modified_time", content: modifiedTime });
  return tags;
}
