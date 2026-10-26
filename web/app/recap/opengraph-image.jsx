import { recapDays } from "@/lib/recap";
import { dayLong } from "@/lib/format";
import { dayCard, liveCard, ogContentType, ogSize } from "@/lib/og";

export const runtime = "nodejs";
export const alt = "One day of Auspex Sports picks, graded at the posted price";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  const d = recapDays()[0];
  if (!d) return liveCard();
  return dayCard(d, { dayLong });
}
