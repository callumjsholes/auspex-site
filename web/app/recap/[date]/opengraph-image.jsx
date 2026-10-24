import { recapDays } from "@/lib/recap";
import { dayLong } from "@/lib/format";
import { dayCard, liveCard, ogContentType, ogSize } from "@/lib/og";

export const runtime = "nodejs";
export const dynamic = "force-static";
export const alt = "One day of Auspex Sports picks, graded at the posted price";
export const size = ogSize;
export const contentType = ogContentType;

export function generateStaticParams() {
  return recapDays().map((d) => ({ date: d.date }));
}

export default async function Image({ params }) {
  const { date } = await params;
  const d = recapDays().find((x) => x.date === date);
  if (!d) return liveCard();
  return dayCard(d, { dayLong });
}
