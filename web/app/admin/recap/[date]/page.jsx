import { notFound } from "next/navigation";
import { recapDays, recapText, recordText, shareText } from "@/lib/recap";
import { dayLong, dayShort, signed } from "@/lib/format";
import { SITE } from "@/lib/site";
import RecapShare from "@/components/RecapShare";

// Owner-only share tools. Locked by web/middleware.js.
export const dynamicParams = false;
export const metadata = { title: "Recap tools", robots: { index: false, follow: false } };

export function generateStaticParams() {
  return recapDays().map((d) => ({ date: d.date }));
}

export default async function AdminRecapDay({ params }) {
  const { date } = await params;
  const days = recapDays();
  const d = days.find((x) => x.date === date);
  if (!d) notFound();
  const url = `${SITE.url}/recap/${d.date}`;
  return (
    <div className="page wrap">
      <div className="intro">
        <h1>{dayLong(d.date)}</h1>
        <p className="lede">{recordText(d)}, {signed(d.units, 2)} units. Share tools, only visible to you. <a href={`/recap/${d.date}`}>Public page</a></p>
      </div>
      <div className="recap">
        <img className="recap-card" src={`/recap/${d.date}/card`} width="1080" height="1350" alt={`Recap card: ${shareText(d)}`} />
        <div>
          <RecapShare date={d.date} share={shareText(d)} url={url} text={recapText(d)} />
          <h2 style={{ fontSize: 18, margin: "26px 0 0" }}>Other days</h2>
          <nav className="days" aria-label="Recap days">
            {days.slice(0, 30).map((x) => (
              <a key={x.date} href={`/admin/recap/${x.date}`} aria-current={x.date === d.date ? "page" : undefined}>{dayShort(x.date)} · {recordText(x)}</a>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
