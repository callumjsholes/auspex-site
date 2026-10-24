import GameScreen, { gameMetadata, gameStaticParams } from "@/components/GameScreen";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return gameStaticParams("NBA");
}

export function generateMetadata({ params }) {
  return gameMetadata("NBA", params);
}

export default function Page({ params }) {
  return <GameScreen league="NBA" params={params} />;
}
