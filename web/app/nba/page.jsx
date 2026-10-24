import { LeagueIndex, leagueMetadata } from "@/components/GameLists";

export const dynamic = "force-static";

export function generateMetadata() {
  return leagueMetadata("NBA");
}

export default function Page() {
  return <LeagueIndex league="NBA" />;
}
