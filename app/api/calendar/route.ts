import ical, { type VEvent } from "node-ical";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import type { CalendarEvent } from "@/lib/types";

export const runtime = "nodejs";

/**
 * Read-only calendar proxy: fetches an ICS feed server-side (avoids browser
 * CORS limits on Google/iCloud feeds) and returns the events overlapping the
 * [from, to) window sent by the client, recurring events included.
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const url = req.nextUrl.searchParams.get("url");
  const from = new Date(req.nextUrl.searchParams.get("from") ?? "");
  const to = new Date(req.nextUrl.searchParams.get("to") ?? "");
  if (!url || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return NextResponse.json(
      { error: "Paramètres url, from et to requis." },
      { status: 400 }
    );
  }

  let target: URL;
  try {
    target = new URL(url.replace(/^webcal:/i, "https:"));
  } catch {
    return NextResponse.json({ error: "URL ICS invalide." }, { status: 400 });
  }
  if (target.protocol !== "https:" && target.protocol !== "http:") {
    return NextResponse.json({ error: "Seuls http(s) et webcal sont supportés." }, { status: 400 });
  }

  try {
    const res = await fetch(target, {
      signal: AbortSignal.timeout(15000),
      headers: { "User-Agent": "LifeOS-Calendar/1.0" },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Le flux ICS a répondu ${res.status}.` },
        { status: 502 }
      );
    }
    const text = await res.text();
    const parsed = ical.sync.parseICS(text);

    const events: CalendarEvent[] = [];
    for (const [key, entry] of Object.entries(parsed)) {
      if (!entry || entry.type !== "VEVENT") continue;
      const item = entry as VEvent;
      const durationMs =
        item.end && item.start
          ? item.end.getTime() - item.start.getTime()
          : 0;
      const allDay = item.datetype === "date";

      const pushEvent = (start: Date, end: Date, idSuffix = "") => {
        if (end <= from || start >= to) return;
        events.push({
          id: `${item.uid ?? key}${idSuffix}`,
          title: item.summary?.toString() || "(sans titre)",
          start: start.toISOString(),
          end: end.toISOString(),
          allDay,
          location: item.location?.toString() || undefined,
        });
      };

      if (item.rrule) {
        const exdates = new Set(
          Object.values(item.exdate ?? {}).map((d) => (d as Date).getTime())
        );
        // Widen the query window by one day so long events that started
        // earlier still show up.
        const occurrences = item.rrule.between(
          new Date(from.getTime() - 86400000),
          to,
          true
        );
        for (const occ of occurrences) {
          if (exdates.has(occ.getTime())) continue;
          pushEvent(occ, new Date(occ.getTime() + durationMs), `-${occ.getTime()}`);
        }
      } else if (item.start) {
        pushEvent(item.start, item.end ?? item.start);
      }
    }

    events.sort((a, b) => a.start.localeCompare(b.start));
    return NextResponse.json({ events: events.slice(0, 50) });
  } catch {
    return NextResponse.json(
      { error: "Impossible de récupérer le flux ICS." },
      { status: 502 }
    );
  }
}
