import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { ArrowRight, Menu, X } from "lucide-react";
import { site } from "~/config/site";
import { tools } from "~/content/tools";
import { articles } from "~/content/articles";

/**
 * The olloo mark: the "oo" drawn as two eyes looking up and to the right,
 * for being seen (by Google and AI) and rising rankings.
 * tone="light" for light backgrounds, "dark" for ink backgrounds.
 */
export function LogoMark({ size = 30, tone = "light" }: { size?: number; tone?: "light" | "dark" }) {
  const ring = tone === "light" ? "#0a0a0a" : "#ffffff";
  return (
    <svg width={size * (44 / 26)} height={size} viewBox="0 0 44 26" aria-hidden="true">
      <circle cx="12" cy="13" r="9.5" fill="none" stroke={ring} strokeWidth="3" />
      <circle cx="32" cy="13" r="9.5" fill="none" stroke={ring} strokeWidth="3" />
      <circle cx="14.8" cy="10.2" r="4" fill="#ff5a1f" />
      <circle cx="34.8" cy="10.2" r="4" fill="#ff5a1f" />
    </svg>
  );
}

export function Logo({ className = "", tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  return (
    <Link to="/" className={`flex items-center gap-2.5 ${className}`} aria-label={`${site.name} home`}>
      <LogoMark size={22} tone={tone} />
      <span className={`text-[1.12rem] font-semibold tracking-tight ${tone === "light" ? "text-ink" : "text-white"}`}>
        {site.brand}{" "}
        <span className={`font-medium ${tone === "light" ? "text-neutral-500" : "text-neutral-400"}`}>SEO</span>
      </span>
    </Link>
  );
}

const nav = [
  { to: "/", label: "SEO audit", end: true },
  { to: "/tools", label: "Free tools" },
  { to: "/learn", label: "Guides" },
  { to: "/about", label: "About" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`no-print sticky top-0 z-40 border-b transition-colors duration-300 ${
        scrolled ? "border-neutral-200 bg-paper/85 backdrop-blur-xl" : "border-transparent bg-paper"
      }`}
    >
      <div className="container-page flex h-16 items-center justify-between">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? "text-ink" : "text-neutral-600 hover:text-ink"}`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <Link to="/#audit" className="btn-dark ml-3 rounded-lg px-4 py-2 text-sm">
            Audit my site <ArrowRight size={15} aria-hidden />
          </Link>
        </nav>
        <button
          type="button"
          className="rounded-lg p-2 text-ink md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Main" className="border-t border-neutral-200 bg-paper md:hidden">
          <div className="container-page flex flex-col py-3">
            {nav.map((item) => (
              <Link key={item.to} to={item.to} className="py-3 text-lg font-medium text-ink">
                {item.label}
              </Link>
            ))}
            <Link to="/#audit" className="btn-primary mt-3">
              Audit my site free
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="no-print mt-28 bg-ink text-white">
      <div className="container-page grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo tone="dark" />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-neutral-400">
            {site.name} is a free SEO and AI-search audit. It checks your site for 50+ issues that stop you ranking in Google, ChatGPT and Perplexity, and writes the fixes.
          </p>
          <Link to="/#audit" className="btn-primary mt-6 px-4 py-2 text-sm">
            Run a free audit <ArrowRight size={15} aria-hidden />
          </Link>
        </div>
        <div>
          <h2 className="text-sm font-medium text-neutral-400">Free tools</h2>
          <ul className="mt-5 space-y-2.5 text-sm">
            <li>
              <Link to="/" className="text-neutral-300 transition hover:text-brand-400">
                Free SEO audit
              </Link>
            </li>
            {tools.map((t) => (
              <li key={t.slug}>
                <Link to={`/tools/${t.slug}`} className="text-neutral-300 transition hover:text-brand-400">
                  {t.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-medium text-neutral-400">Learn SEO</h2>
          <ul className="mt-5 space-y-2.5 text-sm">
            {articles.slice(0, 9).map((a) => (
              <li key={a.slug}>
                <Link to={`/learn/${a.slug}`} className="text-neutral-300 transition hover:text-brand-400">
                  {a.h1 ?? a.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-medium text-neutral-400">{site.name}</h2>
          <ul className="mt-5 space-y-2.5 text-sm">
            <li>
              <Link to="/about" className="text-neutral-300 transition hover:text-brand-400">
                About us
              </Link>
            </li>
            <li>
              <Link to="/learn" className="text-neutral-300 transition hover:text-brand-400">
                All guides
              </Link>
            </li>
            <li>
              <Link to="/bot" className="text-neutral-300 transition hover:text-brand-400">
                Our crawler
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="text-neutral-300 transition hover:text-brand-400">
                Privacy policy
              </Link>
            </li>
            <li>
              <a href={`mailto:${site.email}`} className="text-neutral-300 transition hover:text-brand-400">
                Contact
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-6 text-xs text-neutral-400 sm:flex-row">
          <span>
            © {new Date().getFullYear()} {site.name}. Free to use, no signup required.
          </span>
          <span className="font-mono">Built for Google, ChatGPT, Perplexity & Gemini</span>
        </div>
      </div>
    </footer>
  );
}
