import { odds } from "@/lib/format";
import { describeClose } from "@/lib/clv";

// Locked price against the close. Renders nothing when the publish has no close and no cents CLV.
export function CloseLine({ p }) {
  const items = describeClose(p, odds);
  if (!items) return null;
  return (
    <p className="clv">
      {items.map((it) => (
        <span key={it.k} className={it.k === "beat" ? "beat" : it.tone || undefined}>{it.text}</span>
      ))}
    </p>
  );
}
