import { notFound } from "next/navigation";
import { datesFor } from "@/lib/games";
import { DateIndex, dateMetadata, dateStaticParams } from "@/components/GameLists";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return dateStaticParams("NHL");
}

export function generateMetadata({ params }) {
  return dateMetadata("NHL", params);
}

export default async function Page({ params }) {
  const { date } = await params;
  if (!datesFor("NHL").some((d) => d.date === date)) notFound();
  return <DateIndex league="NHL" date={date} />;
}
