import { notFound } from "next/navigation";
import { recapDays, recordText, shareText } from "@/lib/recap";
import { dayLong, dayShort, signed } from "@/lib/format";

export const dynamicParams = false;

export function generateStaticParams() {
  return recapDays().map((d) => ({ date: d.date }));
}

export async function generateMetadata({ params }) {
  const { date } = await params;
  const d = recapDays().find((x) => x.date === date);
  if (!d) return {};
  const title = `${dayShort(d.date)} recap: ${recordText(d)}`;
  const description = shareText(d);
  const image = { url: `/recap/${d.date}/card`, width: 1080, height: 1350, alt: `Auspex Sports picks for ${dayLong(d.date)}` };
  return { title, description, openGraph: { title, description, images: [image] }, twitter: { card: "summary_large_image", title, description, images: [image.url] } };
}

export default async function RecapDay({ params }) {
  const { date } = await params;
  const days = recapDays();
  const d = days.find((x) => x.date === date);
  if (!d) notFound();
  return (
    <div className="page wrap">
      <div className="intro">
        <h1>{dayLong(d.date)}</h1>
        <p className="lede">{recordText(d)}, {signed(d.units, 2)} units at the posted prices{d.open ? `. ${d.open} pick${d.open === 1 ? "" : "s"} from this slate still open` : ""}.</p>
      </div>
      <div className="recap">
        <img className="recap-card" src={`/recap/${d.date}/card`} width="1080" height="1350" alt={`Recap card: ${shareText(d)}`} />
        <div>
          <h2 style={{ fontSize: 18, margin: 0 }}>Other days</h2>
          <nav className="days" aria-label="Recap days">
            {days.slice(0, 30).map((x) => (
              <a key={x.date} href={`/recap/${x.date}`} aria-current={x.date === d.date ? "page" : undefined}>{dayShort(x.date)} · {recordText(x)}</a>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
