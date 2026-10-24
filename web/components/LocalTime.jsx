"use client";
import { useEffect, useState } from "react";
import { timeET } from "@/lib/format";

// First paint is Eastern Time, which the server and the browser both compute the
// same way. After mount, the clock switches to the visitor's own time zone.
export default function LocalTime({ iso }) {
  const [local, setLocal] = useState(null);
  useEffect(() => {
    if (!iso) return;
    setLocal(new Intl.DateTimeFormat("en-US", {
      hour: "numeric", minute: "2-digit", timeZoneName: "short",
    }).format(new Date(iso)));
  }, [iso]);
  if (!iso) return null;
  return <time dateTime={iso}>{local || timeET(iso)}</time>;
}
