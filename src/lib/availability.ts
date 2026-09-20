import { addDays, subMinutes } from "date-fns";
import { prisma } from "./prisma";
import { isHospitableConfigured } from "./hospitable/client";
import { lazySync as lazySyncHospitable } from "./hospitable/sync";

export function parseDate(value: string): Date {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date: ${value}`);
  return date;
}

export async function isRangeAvailable(checkIn: Date, checkOut: Date): Promise<boolean> {
  await lazySync();
  const now = new Date();
  const [bookings, blocked, calendarDays] = await Promise.all([
    prisma.booking.findMany({
      where: {
        checkIn: { lt: checkOut },
        checkOut: { gt: checkIn },
        OR: [{ status: "paid" }, { status: "pending", createdAt: { gt: subMinutes(now, 30) } }],
      },
    }),
    prisma.blockedDate.findMany({
      where: { start: { lt: checkOut }, end: { gt: checkIn } },
    }),
    prisma.calendarDay.findMany({
      where: {
        date: {
          gte: checkIn.toISOString().slice(0, 10),
          lt: checkOut.toISOString().slice(0, 10),
        },
      },
    }),
  ]);
  const calendarBlocked = calendarDays.some((day) => !day.available);
  return bookings.length === 0 && blocked.length === 0 && !calendarBlocked;
}

export async function getBlockedRanges(from: Date, to: Date) {
  await lazySync();
  const [bookings, blocked, calendarDays] = await Promise.all([
    prisma.booking.findMany({
      where: {
        checkIn: { lt: to },
        checkOut: { gt: from },
        OR: [{ status: "paid" }, { status: "pending", createdAt: { gt: subMinutes(new Date(), 30) } }],
      },
      select: { checkIn: true, checkOut: true },
    }),
    prisma.blockedDate.findMany({
      where: { start: { lt: to }, end: { gt: from } },
      select: { start: true, end: true, source: true, summary: true },
    }),
    prisma.calendarDay.findMany({
      where: {
        date: {
          gte: from.toISOString().slice(0, 10),
          lt: to.toISOString().slice(0, 10),
        },
        available: false,
      },
      orderBy: { date: "asc" },
    }),
  ]);
  return [
    ...bookings.map((item) => ({ start: item.checkIn.toISOString().slice(0, 10), end: item.checkOut.toISOString().slice(0, 10), source: "booking" })),
    ...blocked.map((item) => ({ start: item.start.toISOString().slice(0, 10), end: item.end.toISOString().slice(0, 10), source: item.source, summary: item.summary })),
    ...calendarDays.map((item) => ({ start: item.date, end: addDays(parseDate(item.date), 1).toISOString().slice(0, 10), source: "hospitable", summary: item.reason || undefined })),
  ];
}

async function lazySync() {
  if (isHospitableConfigured()) {
    await lazySyncHospitable();
    return;
  }
  if (!process.env.AIRBNB_ICAL_URL) return;
  const setting = await prisma.setting.findUnique({ where: { key: "airbnb:lastSyncAt" } });
  if (setting?.value && Date.now() - Date.parse(setting.value) < 60 * 60 * 1000) return;
  try {
    const { syncAirbnbCalendar } = await import("./airbnbSync");
    await syncAirbnbCalendar();
  } catch (error) {
    console.error("Airbnb calendar sync skipped:", error);
  }
}
