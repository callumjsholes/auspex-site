import { redirect } from "next/navigation";
import { recapDays } from "@/lib/recap";

export const metadata = { title: "Daily recap", description: "Each slate's graded picks on one shareable card." };

export default function RecapIndex() {
  const days = recapDays();
  if (days.length) redirect(`/recap/${days[0].date}`);
  return (
    <div className="page wrap">
      <div className="intro"><h1>Daily recap</h1><p className="lede">The first recap appears once a slate's picks are graded.</p></div>
    </div>
  );
}
