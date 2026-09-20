import ical from "node-ical";
import { prisma } from "./prisma";

export async function syncAirbnbCalendar() {
  const url = process.env.AIRBNB_ICAL_URL;
  if (!url) return { synced: 0, skipped: true };
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Airbnb calendar returned ${response.status}`);
  const events = ical.parseICS(await response.text());
  const rows = Object.values(events).flatMap((event) => {
    if (!event || typeof event !== "object" || !("type" in event) || event.type !== "VEVENT") return [];
    const item = event as ical.VEvent;
    if (!item.end) return [];
    return [{ start: new Date(item.start), end: new Date(item.end), source: "airbnb", uid: item.uid ?? null, summary: typeof item.summary === "string" ? item.summary : "Airbnb reservation" }];
  });
  await prisma.$transaction([
    prisma.blockedDate.deleteMany({ where: { source: "airbnb" } }),
    ...rows.map((row) => prisma.blockedDate.create({ data: row })),
  ]);
  await prisma.setting.upsert({ where: { key: "airbnb:lastSyncAt" }, update: { value: new Date().toISOString() }, create: { key: "airbnb:lastSyncAt", value: new Date().toISOString() } });
  return { synced: rows.length, skipped: false };
}
