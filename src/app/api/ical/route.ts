import { prisma } from "@/lib/prisma";

function icalDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export async function GET() {
  const bookings = await prisma.booking.findMany({ where: { status: "paid" }, orderBy: { checkIn: "asc" } });
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Tourmaline House//Bookings//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  bookings.forEach((booking) => { lines.push("BEGIN:VEVENT", `UID:tourmaline-${booking.id}@tourmaline.house`, `DTSTAMP:${icalDate(booking.createdAt)}`, `DTSTART;VALUE=DATE:${icalDate(booking.checkIn).slice(0, 8)}`, `DTEND;VALUE=DATE:${icalDate(booking.checkOut).slice(0, 8)}`, `SUMMARY:Tourmaline House reservation`, "END:VEVENT"); });
  lines.push("END:VCALENDAR");
  return new Response(lines.join("\r\n"), { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": 'attachment; filename="tourmaline-house.ics"' } });
}
