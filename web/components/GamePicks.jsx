"use client";
import { Ticket } from "@/components/Ticket";
import { useLive } from "@/components/Live";

export default function GamePicks({ picks, nhl }) {
  const live = useLive(nhl ? [] : picks, nhl ? picks : []);
  return (
    <div className="cards">
      {picks.map((p) => <Ticket key={p.id} p={p} nhl={nhl} live={live} />)}
    </div>
  );
}
