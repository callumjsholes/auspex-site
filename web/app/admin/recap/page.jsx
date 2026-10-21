import { redirect } from "next/navigation";
import { recapDays } from "@/lib/recap";

export const metadata = { title: "Recap tools", robots: { index: false, follow: false } };

export default function AdminRecapIndex() {
  const days = recapDays();
  if (days.length) redirect(`/admin/recap/${days[0].date}`);
  return (
    <div className="page wrap">
      <div className="intro"><h1>Recap tools</h1><p className="lede">No graded slates yet.</p></div>
    </div>
  );
}
