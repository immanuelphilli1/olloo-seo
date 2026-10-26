import http from "node:http";
import zlib from "node:zlib";

// Two tiny websites for testing the audit engine end to end:
//  - "broken" has planted SEO problems (each one should be reported)
//  - "good" follows best practices (should score close to 100)

type Route = { status?: number; headers?: Record<string, string>; body?: string; redirect?: string };
type Site = (path: string, base: string) => Route;

const para = (topic: string) =>
  `<p>${topic} matters because it helps people find what they need quickly. Start with the main answer, then add detail.</p>
   <p>Most small businesses can improve ${topic.toLowerCase()} in an afternoon. Pick one page, fix it, and measure the result in Search Console.</p>
   <p>Keep sentences short. Use plain words. Name the tools and numbers you used so readers can repeat your steps.</p>
   <p>Our team has tested this on more than 40 client sites since 2019. The biggest gains came from clear titles and fast pages.</p>
   <p>If you only do one thing this week, update your most visited page and link to it from three related pages.</p>`;

const goodPage = (base: string, path: string, title: string, description: string, h1: string, extra = "") => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${base}${path}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${base}/social.webp">
<meta property="og:site_name" content="Good Coffee Co">
<meta name="author" content="Jane Roaster">
<meta property="article:modified_time" content="${new Date().toISOString()}">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"Good Coffee Co","url":"${base}/","logo":"${base}/logo.webp","sameAs":["https://www.linkedin.com/company/good-coffee-co"]}</script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite","name":"Good Coffee Co","url":"${base}/"}</script>
</head>
<body>
<header><nav><a href="/">Home</a> <a href="/beans">Coffee beans</a> <a href="/brewing-guide">Brewing guide</a> <a href="/about">About us</a> <a href="/contact">Contact us</a></nav></header>
<main>
<h1>${h1}</h1>
<img src="/images/ethiopian-coffee-beans.webp" alt="Bag of Ethiopian coffee beans on a wooden table">
<h2>Why it matters</h2>
${para(h1)}
<h2>How to get started</h2>
${para("Fresh coffee")}
${extra}
<p>Read our <a href="/brewing-guide">pour-over brewing guide</a>, browse <a href="/beans">single-origin coffee beans</a>, or <a href="/about">meet the roasting team</a>.</p>
</main>
<footer><a href="/contact">Contact us</a> · <a href="/about">About Good Coffee Co</a></footer>
</body>
</html>`;

export const goodSite: Site = (path, base) => {
  const pages: Record<string, [string, string, string]> = {
    "/": ["Fresh Roasted Coffee Beans | Good Coffee Co", "Small-batch coffee roasted every Monday and shipped within 48 hours. Single-origin beans, brewing guides and free UK delivery over £25.", "Fresh roasted coffee, delivered weekly"],
    "/beans": ["Single-Origin Coffee Beans | Good Coffee Co", "Shop single-origin coffee beans from Ethiopia, Colombia and Kenya, roasted to order and delivered fresh to your door within two days.", "Single-origin coffee beans"],
    "/brewing-guide": ["Pour-Over Coffee Brewing Guide | Good Coffee Co", "Learn to brew pour-over coffee at home in five simple steps, with the exact grind size, water temperature and ratios our baristas use.", "How to brew pour-over coffee"],
    "/about": ["About Our Coffee Roasters | Good Coffee Co", "Meet the team behind Good Coffee Co: three roasters in Bristol who have sourced direct-trade coffee from small farms since 2019.", "About Good Coffee Co"],
    "/contact": ["Contact Good Coffee Co | Orders and Wholesale", "Questions about an order, a subscription or wholesale coffee? Email or call the Good Coffee Co team in Bristol, Monday to Friday.", "Contact our team"],
  };
  if (path === "/robots.txt") return { headers: { "content-type": "text/plain" }, body: `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n` };
  if (path === "/sitemap.xml") {
    const urls = Object.keys(pages).map((p) => `<url><loc>${base}${p}</loc></url>`).join("");
    return { headers: { "content-type": "application/xml" }, body: `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>` };
  }
  if (path === "/llms.txt") return { headers: { "content-type": "text/plain" }, body: "# Good Coffee Co\n\n> Fresh roasted coffee.\n" };
  if (path.startsWith("/images/") || path === "/social.webp") return { headers: { "content-type": "image/webp" }, body: "x".repeat(2000) };
  const page = pages[path];
  if (!page) return { status: 404, headers: { "content-type": "text/html" }, body: "<!doctype html><html lang=en><title>Page not found</title><h1>Page not found</h1><a href=/>Home</a></html>" };
  return { headers: { "content-type": "text/html; charset=utf-8" }, body: goodPage(base, path, ...page) };
};

const brokenNav = `<a href="/?share=tumblr" rel="nofollow">Share</a> <a href="/services?replytocom=5" rel="nofollow">Reply</a> <nav><a href="/services">Services</a> <a href="/about">About</a> <a href="/team">Team</a> <a href="/blog/post-1">Blog</a> <a href="/old-page">Old page</a> <a href="/broken-link">Pricing</a> <a href="/js-page">App</a> <a href="/blog/post-1">click here</a></nav>`;

export const brokenSite: Site = (path, base) => {
  switch (path) {
    case "/robots.txt":
      return {
        headers: { "content-type": "text/plain" },
        body: "User-agent: GPTBot\nDisallow: /\n\nUser-agent: OAI-SearchBot\nDisallow: /\n\nUser-agent: PerplexityBot\nDisallow: /\n\nUser-agent: *\nDisallow: /private/\n",
      };
    case "/sitemap.xml":
      return {
        headers: { "content-type": "application/xml" },
        body: `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${["/", "/about", "/orphan", "/old-page", "/gone", "/private/secret"].map((p) => `<url><loc>${base}${p}</loc></url>`).join("")}</urlset>`,
      };
    case "/":
      return {
        headers: { "content-type": "text/html" },
        body: `<html><head><title>Welcome to the homepage of our wonderful company where we sell many great things to everyone</title></head>
<body>${brokenNav}<div><img src="/IMG_1234.jpg"><img src="/DSC_0042.png">
<p>We sell things.</p></div></body></html>`,
      };
    case "/about":
      return {
        headers: { "content-type": "text/html" },
        body: `<html lang="en"><head><meta name="viewport" content="width=device-width"><title>Our Company</title><meta name="robots" content="noindex"></head><body>${brokenNav}<h1>About</h1><p>About us text.</p></body></html>`,
      };
    case "/team":
      return {
        headers: { "content-type": "text/html" },
        body: `<html lang="en"><head><meta name="viewport" content="width=device-width"><title>Our Company</title></head><body>${brokenNav}<h1>Our team</h1><h1>Our values</h1><h2>People</h2><h4>Skipped a level</h4><p>Team text.</p></body></html>`,
      };
    case "/services":
      return {
        headers: { "content-type": "text/html" },
        body: `<html lang="en"><head><meta name="viewport" content="width=device-width"><title>Our Company</title><meta name="description" content="Short."></head><body>${brokenNav}<h1>Services</h1><p>We do services.</p></body></html>`,
      };
    case "/share-target":
      return { status: 302, redirect: "https://www.tumblr.com/share" };
    case "/old-page":
      return { status: 301, redirect: "/older-page" };
    case "/older-page":
      return { status: 301, redirect: "/services" };
    case "/broken-link":
    case "/gone":
      return { status: 404, headers: { "content-type": "text/html" }, body: "Not found" };
    case "/orphan":
      return { headers: { "content-type": "text/html" }, body: `<html lang="en"><head><title>Orphan page nobody links to</title></head><body><h1>Orphan</h1></body></html>` };
    case "/js-page":
      return {
        headers: { "content-type": "text/html" },
        body: `<html lang="en"><head><title>App</title></head><body><div id="root"></div><script>document.getElementById('root').innerHTML = '<h1>Our app</h1>' + '<p>' + 'This content only exists after JavaScript runs. '.repeat(40) + '</p>';</script></body></html>`,
      };
    case "/blog/post-1": {
      const wall = "This sentence keeps going and going without any break because the writer never added subheadings or paragraph breaks to help the reader. ".repeat(14);
      return {
        headers: { "content-type": "text/html" },
        body: `<html lang="en"><head><meta name="viewport" content="width=device-width"><title>Blog post</title><meta property="og:type" content="article"><script type="application/ld+json">{"@context": "https://schema.org", "@type": "Article",}</script></head><body>${brokenNav}<h1>Blog post</h1><p>${wall}</p></body></html>`,
      };
    }
    default:
      if (/\.(jpg|png)$/.test(path)) return { headers: { "content-type": "image/jpeg" }, body: "x".repeat(300 * 1024) };
      // Soft 404: unknown URLs return 200.
      return { headers: { "content-type": "text/html" }, body: "<html><body>Oops</body></html>" };
  }
};

export function startSite(site: Site, port: number, compress = false): Promise<http.Server> {
  const server = http.createServer((req, res) => {
    const base = `http://localhost:${port}`;
    const path = new URL(req.url ?? "/", base).pathname;
    const route = site(path, base);
    if (route.redirect) {
      res.writeHead(route.status ?? 301, { location: route.redirect });
      return res.end();
    }
    const headers = { ...route.headers };
    let body: Buffer | string = route.body ?? "";
    if (compress && /gzip/.test(req.headers["accept-encoding"] ?? "") && /html|xml|text/.test(headers["content-type"] ?? "")) {
      body = zlib.gzipSync(body);
      headers["content-encoding"] = "gzip";
    }
    headers["content-length"] = String(Buffer.byteLength(body));
    res.writeHead(route.status ?? 200, headers);
    res.end(req.method === "HEAD" ? undefined : body);
  });
  return new Promise((resolve) => server.listen(port, () => resolve(server)));
}
