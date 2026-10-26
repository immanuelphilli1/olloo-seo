import type { FixKind, Platform } from "../types.ts";

// Where to apply each kind of fix on each platform. Kept short and concrete:
// the user should be able to follow these without knowing SEO jargon.
type StepTable = Partial<Record<FixKind, Partial<Record<Platform, string[]>>>>;

const STEPS: StepTable = {
  title: {
    wordpress: [
      "Install Yoast SEO or Rank Math (free) if you don't have an SEO plugin yet.",
      "Open the page in the editor and scroll to the Yoast/Rank Math box below the content.",
      "Paste the suggested title into the \"SEO title\" field and click Update.",
    ],
    shopify: [
      "In Shopify admin, open the product, collection or page.",
      "Scroll to \"Search engine listing\" and click Edit.",
      "Paste the suggested title into \"Page title\" and Save. For the homepage use Online Store → Preferences.",
    ],
    wix: ["Open the page in the Wix Editor → Pages menu → ⋯ → SEO basics.", "Paste the suggested title into \"Title tag\" and publish."],
    squarespace: ["Open Pages → hover the page → gear icon → SEO tab.", "Paste the suggested title into \"SEO title\" and Save."],
    webflow: ["In the Designer open Pages → gear icon next to the page → SEO Settings.", "Paste the suggested title into \"Title Tag\" and publish."],
    custom: ["Edit the page's HTML <head> and replace the <title> tag with the suggested one.", "Deploy the change."],
  },
  metaDescription: {
    wordpress: ["Open the page in the editor → Yoast/Rank Math box.", "Paste the suggestion into \"Meta description\" and click Update."],
    shopify: ["Open the item → \"Search engine listing\" → Edit.", "Paste the suggestion into \"Meta description\" and Save."],
    wix: ["Pages menu → ⋯ → SEO basics.", "Paste the suggestion into \"Meta description\" and publish."],
    squarespace: ["Pages → gear icon → SEO tab.", "Paste the suggestion into \"SEO description\" and Save."],
    webflow: ["Pages → gear icon → SEO Settings.", "Paste the suggestion into \"Meta Description\" and publish."],
    custom: ["Add or edit <meta name=\"description\" content=\"…\"> inside the page's <head>."],
  },
  robotsTxt: {
    wordpress: [
      "Yoast: Yoast SEO → Tools → File editor. Rank Math: Rank Math → General Settings → Edit robots.txt.",
      "Replace the contents with the corrected robots.txt below and save.",
    ],
    shopify: [
      "Online Store → Themes → ⋯ → Edit code.",
      "Add a new template \"robots.txt.liquid\" (if missing) and add the AI crawler rules below as custom rules.",
    ],
    wix: ["Marketing & SEO → SEO → Robots.txt Editor (under Tools and settings).", "Paste the corrected rules and save."],
    squarespace: [
      "Squarespace manages robots.txt for you. Go to Settings → Crawlers and make sure \"Block AI crawlers\" is turned OFF.",
    ],
    webflow: ["Site settings → SEO tab → robots.txt.", "Paste the corrected robots.txt and publish."],
    custom: ["Upload the corrected file as /robots.txt at the root of your domain (e.g. in your public/ or web root folder)."],
  },
  sitemap: {
    wordpress: [
      "Yoast and Rank Math create a sitemap automatically (Yoast: /sitemap_index.xml).",
      "Make sure the plugin's sitemap feature is ON, then add the Sitemap line to robots.txt and submit it in Google Search Console and Bing Webmaster Tools.",
    ],
    shopify: ["Shopify generates /sitemap.xml automatically.", "Submit it in Google Search Console and Bing Webmaster Tools."],
    wix: ["Wix generates /sitemap.xml automatically once your site is published and connected to a domain.", "Submit it in Google Search Console."],
    squarespace: ["Squarespace generates /sitemap.xml automatically.", "Submit it in Google Search Console."],
    webflow: ["Site settings → SEO → turn on \"Auto-generate Sitemap\" and publish."],
    custom: [
      "Upload the generated sitemap.xml to the root of your site.",
      "Add \"Sitemap: https://yourdomain/sitemap.xml\" to robots.txt and submit it in Google Search Console and Bing Webmaster Tools.",
    ],
  },
  noindex: {
    wordpress: [
      "Settings → Reading → untick \"Discourage search engines from indexing this site\".",
      "For single pages: open the page → Yoast/Rank Math → Advanced → set \"Allow search engines to show this page\" to Yes.",
    ],
    shopify: ["Online Store → Preferences → make sure password protection is off.", "Remove any theme code that outputs <meta name=\"robots\" content=\"noindex\">."],
    wix: ["Open the page → SEO basics → turn ON \"Let search engines index this page\"."],
    squarespace: ["Pages → gear icon → SEO → turn OFF \"Hide page from search results\"."],
    webflow: ["Site settings → SEO → turn OFF \"Disable Webflow subdomain indexing\" only for your real domain, and remove any noindex custom code."],
    custom: ["Remove <meta name=\"robots\" content=\"noindex\"> from the page (and any X-Robots-Tag: noindex header in your server config)."],
  },
  canonical: {
    wordpress: ["Yoast/Rank Math add canonical tags automatically. If one points to the wrong URL, open the page → Advanced → \"Canonical URL\" and fix it."],
    shopify: ["Shopify themes output {{ canonical_url }} in theme.liquid, make sure the line is present in <head>."],
    wix: ["Pages → SEO basics → Advanced SEO → check the canonical tag points to the page's own URL."],
    squarespace: ["Squarespace sets canonicals automatically; remove any custom canonical tags in code injection."],
    webflow: ["Site settings → SEO → set \"Global canonical tag URL\" to your main domain (https://yourdomain.com)."],
    custom: ["Add <link rel=\"canonical\" href=\"…\"> in each page's <head>, pointing to the page's own preferred URL."],
  },
  altText: {
    wordpress: ["Media → Library → click the image → paste the suggestion into \"Alternative Text\"."],
    shopify: ["Open the product → click the image → \"Add alt text\"."],
    wix: ["Click the image in the editor → Settings → \"What's in the image? Tell Google\"."],
    squarespace: ["Edit the image block → Content → \"Image alt text\" (or the image caption field)."],
    webflow: ["Select the image → Settings panel → \"Alt Text\"."],
    custom: ["Add alt=\"…\" to each <img> tag, describing what the image shows."],
  },
  schema: {
    wordpress: [
      "Rank Math/Yoast already add basic schema. For the extra blocks below, use the free \"WPCode\" plugin → Add Snippet → HTML → paste the <script> into the site header.",
    ],
    shopify: ["Online Store → Themes → Edit code → theme.liquid.", "Paste the <script type=\"application/ld+json\"> block just before </head>."],
    wix: ["Pages → SEO basics → Advanced SEO → Structured data markup → Add new markup → paste the JSON."],
    squarespace: ["Settings → Advanced → Code Injection → Header.", "Paste the <script> block and save."],
    webflow: ["Page settings → Custom Code → Inside <head> tag.", "Paste the <script> block and publish."],
    custom: ["Paste the <script type=\"application/ld+json\"> block into the <head> of the relevant pages."],
  },
  socialTags: {
    wordpress: ["Yoast/Rank Math → open the page → Social tab → set the title, description and image."],
    shopify: ["Online Store → Preferences → Social sharing image; most themes output og: tags automatically."],
    wix: ["Pages → SEO basics → Social share → upload an image and set the title/description."],
    squarespace: ["Pages → gear icon → Social Image; Squarespace outputs og: tags automatically."],
    webflow: ["Page settings → Open Graph Settings → set title, description and image."],
    custom: ["Add the Open Graph and Twitter meta tags below inside each page's <head>."],
  },
  redirects: {
    wordpress: ["Install the free \"Redirection\" plugin → Tools → Redirection → add each source and target URL as a 301."],
    shopify: ["Online Store → Navigation → View URL redirects → Create URL redirect."],
    wix: ["Marketing & SEO → SEO → URL Redirect Manager → New Redirect."],
    squarespace: ["Settings → Advanced → URL Mappings → add lines like /old-page -> /new-page 301."],
    webflow: ["Site settings → Publishing → 301 Redirects → add the old and new paths."],
    custom: ["Add the redirect rules below to your server config (Apache .htaccess, nginx, Netlify or Vercel)."],
  },
  https: {
    wordpress: ["Ask your host to install a free Let's Encrypt SSL certificate, then install \"Really Simple SSL\" to force HTTPS."],
    shopify: ["Shopify provides SSL automatically, make sure your domain is connected under Settings → Domains."],
    wix: ["Wix provides SSL automatically once your domain is connected."],
    squarespace: ["Settings → Advanced → SSL → choose \"Secure\" and enable HSTS."],
    webflow: ["Site settings → Publishing → Advanced → turn on \"Enable SSL\"."],
    custom: ["Install a TLS certificate (Let's Encrypt is free) and add a permanent 301 redirect from http:// to https://."],
  },
  llmsTxt: {
    wordpress: ["Upload llms.txt to your site root with your host's file manager or SFTP (same folder as wp-config.php)."],
    shopify: ["Shopify can't serve files at the root skip this one; it's optional."],
    wix: ["Wix can't serve custom root files,skip this one; it's optional."],
    squarespace: ["Squarespace can't serve custom root files skip this one; it's optional."],
    webflow: ["Webflow can't serve custom root files,skip this one; it's optional."],
    custom: ["Upload the generated llms.txt to the root of your site so it loads at /llms.txt."],
  },
  compression: {
    wordpress: ["Install a caching plugin (e.g. WP Super Cache or LiteSpeed Cache) and turn on GZIP/Brotli compression, or enable it in your host's control panel."],
    custom: ["Enable gzip or Brotli compression on your server or CDN (Cloudflare does this for free)."],
  },
  caching: {
    wordpress: ["Install a caching plugin (LiteSpeed Cache, WP Super Cache or W3 Total Cache) and enable browser caching."],
    custom: ["Send Cache-Control headers for static files (e.g. max-age=31536000 for versioned CSS/JS/images) or put the site behind a CDN like Cloudflare."],
  },
  images: {
    wordpress: ["Install ShortPixel or Imagify (free tiers) to compress images and serve WebP/AVIF automatically."],
    shopify: ["Shopify serves WebP automatically from its CDN, re-upload very large images at a sensible size (≤ 2000px wide)."],
    custom: ["Compress images (e.g. with Squoosh or ShortPixel), convert them to WebP/AVIF, and give files descriptive names like blue-running-shoes.webp."],
  },
  viewport: {
    custom: ["Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"> inside <head>."],
  },
  lang: {
    wordpress: ["Settings → General → Site Language. WordPress then sets <html lang> automatically."],
    custom: ["Add a lang attribute to the opening <html> tag, e.g. <html lang=\"en\">."],
  },
  notFound: {
    wordpress: ["Use your theme's 404.php (or a 404 page plugin) so missing URLs return status 404 with links to your main pages."],
    custom: ["Make missing URLs return HTTP status 404 (not 200) and show a helpful page with search and links to your key pages."],
  },
};

export function platformSteps(kind: FixKind, platform: Platform): string[] | undefined {
  const table = STEPS[kind];
  if (!table) return undefined;
  return table[platform] ?? table.custom;
}
