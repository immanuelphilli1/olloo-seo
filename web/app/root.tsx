import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import geistLatin from "@fontsource-variable/geist/files/geist-latin-wght-normal.woff2?url";
import geistLatinExt from "@fontsource-variable/geist/files/geist-latin-ext-wght-normal.woff2?url";
import serifItalic from "@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2?url";
import type { Route } from "./+types/root";
import { site } from "./config/site";
import "./app.css";

export const links: Route.LinksFunction = () => [
  // Preload the main text font so headlines render in Geist without a layout shift.
  { rel: "preload", href: geistLatin, as: "font", type: "font/woff2", crossOrigin: "anonymous" },
  { rel: "preload", href: serifItalic, as: "font", type: "font/woff2", crossOrigin: "anonymous" },
  { rel: "icon", href: "/favicon.ico", sizes: "32x32" },
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
  { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
  { rel: "manifest", href: "/site.webmanifest" },
  { rel: "alternate", type: "application/rss+xml", title: `${site.name} guides`, href: "/rss.xml" },
];

/*
 * Geist font rules, inlined in <head> so they apply from the first paint
 * (Latin + Latin Extended only; the site is English).
 * font-display: optional: if the font isn't ready within ~100 ms, the browser
 * keeps the fallback for that page view instead of swapping late. The headline
 * never waits on the font (better LCP) and nothing jumps (no layout shift). The
 * font is preloaded, so most visitors still get Geist at once, and it's cached
 * for every page after the first.
 */
const fontFace = (src: string, range: string) =>
  `@font-face{font-family:"Geist Variable";font-style:normal;font-display:optional;font-weight:100 900;src:url(${src}) format("woff2-variations");unicode-range:${range}}`;
const FONT_CSS =
  fontFace(geistLatin, "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD") +
  fontFace(geistLatinExt, "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF") +
  // Instrument Serif italic: the editorial accent word in headlines.
  `@font-face{font-family:"Instrument Serif";font-style:italic;font-display:optional;font-weight:400;src:url(${serifItalic}) format("woff2")}`;

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: browser extensions (password managers, Grammarly,
    // job-search tools…) add attributes to <html>/<body> before React loads.
    // It only covers these two elements' own attributes, not their content.
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#fafaf7" />
        <style dangerouslySetInnerHTML={{ __html: FONT_CSS }} />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen" suppressHydrationWarning>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

/** Shown while browser-rendered pages (the audit report) load their code. */
export function HydrateFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper" role="status" aria-live="polite">
      <div className="flex items-center gap-3 text-sm text-neutral-500">
        <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500" />
        Loading…
      </div>
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Something went wrong";
  let details = "An unexpected error occurred. Please try again.";
  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "Page not found" : "Error";
    details = error.status === 404 ? "The page you're looking for doesn't exist." : error.statusText || details;
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message;
  }
  return (
    <main className="flex min-h-screen items-center bg-paper">
      <div className="container-page py-24 text-center">
        <title>{message}</title>
        <meta name="robots" content="noindex" />
        <h1 className="text-4xl font-semibold tracking-tight text-ink">{message}</h1>
        <p className="mt-4 text-neutral-600">{details}</p>
        <a href="/" className="btn-dark mt-8">
          Go to the homepage
        </a>
      </div>
    </main>
  );
}
