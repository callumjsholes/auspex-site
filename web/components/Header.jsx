"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/#today", label: "Today", match: "/" },
  { href: "/record", label: "Record", match: "/record" },
  { href: "/stats", label: "Stats", match: "/stats" },
  { href: "/recap", label: "Recap", match: "/recap" },
  { href: "/nba", label: "NBA", match: "/nba" },
  { href: "/nhl", label: "NHL", match: "/nhl" },
];

function current(path, match) {
  if (match === "/") return path === "/";
  return path === match || path.startsWith(match + "/");
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const path = usePathname() || "/";
  return (
    <header className="top">
      <a className="skip" href="#main">Skip to content</a>
      <div className="wrap bar">
        <a className="brand" href="/" aria-label="Auspex Sports home">
          <img src="/mark.webp" alt="" width="32" height="32" />
          <span>Auspex Sports</span>
        </a>
        <button className="menu" aria-expanded={open} aria-controls="site-nav" onClick={() => setOpen(!open)}>
          {open ? "Close" : "Menu"}
        </button>
        <nav id="site-nav" className={"nav" + (open ? " open" : "")} aria-label="Site" onClick={() => setOpen(false)}>
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} aria-current={current(path, l.match) ? "page" : undefined}>{l.label}</a>
          ))}
          <a className="cta" href="/#join">Get picks</a>
        </nav>
      </div>
    </header>
  );
}
