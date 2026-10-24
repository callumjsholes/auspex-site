import { LeagueIndex, leagueMetadata } from "@/components/GameLists";

export const dynamic = "force-static";

export function generateMetadata() {
  return leagueMetadata("NHL");
}

export default function Page() {
  return <LeagueIndex league="NHL" />;
}
