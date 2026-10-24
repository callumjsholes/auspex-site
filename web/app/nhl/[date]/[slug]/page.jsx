import GameScreen, { gameMetadata, gameStaticParams } from "@/components/GameScreen";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return gameStaticParams("NHL");
}

export function generateMetadata({ params }) {
  return gameMetadata("NHL", params);
}

export default function Page({ params }) {
  return <GameScreen league="NHL" params={params} />;
}
