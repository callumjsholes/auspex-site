import { odds, centsBetter } from "@/lib/format";

// One line under the price: how the posted price compares with what a typical book offered.
// NBA picks are graded at the best price across tracked books; NHL picks at the median, with the
// best single-book price at lock shown beside it. Nothing here comes from the model.
export function shopText(p, nhl) {
  if (nhl) {
    if (p.best == null || p.best === p.price) return null;
    const c = centsBetter(p.best, p.price);
    return c > 0 ? { lead: `Best at lock ${odds(p.best)}${p.bestBook ? ` at ${p.bestBook}` : ""}`, tail: `${c}¢ better than the median we grade at` } : null;
  }
  if (p.typical == null) return null;
  const c = centsBetter(p.price, p.typical);
  const books = p.typicalN ? ` across ${p.typicalN} book${p.typicalN === 1 ? "" : "s"}` : "";
  if (c > 0) return { lead: `${c}¢ better than the typical book`, tail: `typical ${odds(p.typical)}${books}` };
  if (c === 0) return { lead: "Same as the typical book", tail: `${odds(p.typical)}${books}` };
  return { lead: `Typical book ${odds(p.typical)}`, tail: books.trim() };
}

export function PriceShop({ p, nhl }) {
  const t = shopText(p, nhl);
  if (!t) return null;
  return <p className="shop"><b>{t.lead}</b>{t.tail ? <span>{t.tail}</span> : null}</p>;
}
