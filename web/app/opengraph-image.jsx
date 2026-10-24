import { liveCard, ogContentType, ogSize } from "@/lib/og";

export const runtime = "nodejs";
export const alt = "Auspex Sports live record, graded at the posted price";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return liveCard();
}
