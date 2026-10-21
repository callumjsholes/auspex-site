"use client";
import { useState } from "react";

// Download the card, post to X, or copy the text version (Reddit's markdown editor renders it).
export default function RecapShare({ date, share, url, text }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { setCopied(false); }
  };
  const x = `https://x.com/intent/post?text=${encodeURIComponent(share)}&url=${encodeURIComponent(url)}`;
  return (
    <>
      <div className="actions">
        <a className="btn bronze" href={`/recap/${date}/card`} download={`auspex-recap-${date}.png`}>Download image</a>
        <a className="btn line" href={x} target="_blank" rel="noopener">Post on X</a>
        <button className="btn line" onClick={copy}>{copied ? "Copied" : "Copy text"}</button>
      </div>
      <label htmlFor="recap-text" className="muted" style={{ fontSize: 14 }}>Text version, ready for Reddit or the newsletter</label>
      <textarea id="recap-text" readOnly value={text} onFocus={(e) => e.target.select()} />
    </>
  );
}
