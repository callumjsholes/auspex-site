"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/start", label: "Start here", match: "/start" },
  { href: "/#today", label: "Today's picks", match: null },
  { href: "/record", label: "Record", match: "/record" },
  { href: "/recap", label: "Recap", match: "/recap" },
  { href: "/method", label: "Method", match: "/method" },
  { href: "/faq", label: "FAQ", match: "/faq" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  return (
    <header className="top">
      <a className="skip" href="#main">Skip to content</a>
      <div className="wrap bar">
        <a className="brand" href="/" aria-label="Auspex Sports home">
          <img src="/mark.webp" alt="" width="40" height="40" />
          <span>Auspex Sports</span>
        </a>
        <button className="menu" aria-expanded={open} aria-controls="site-nav" onClick={() => setOpen(!open)}>
          {open ? "Close" : "Menu"}
        </button>
        <nav id="site-nav" className={"nav" + (open ? " open" : "")} aria-label="Site" onClick={() => setOpen(false)}>
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} aria-current={l.match && (path === l.match || path.startsWith(l.match + "/")) ? "page" : undefined}>{l.label}</a>
          ))}
          <a className="cta" href="/#join">Get picks by email</a>
        </nav>
      </div>
    </header>
  );
}
