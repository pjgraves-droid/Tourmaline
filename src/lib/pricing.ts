import { addDays, differenceInCalendarDays, format, isBefore, parseISO } from "date-fns";
import { pricing } from "@/data/pricing";
import { isRangeAvailable } from "./availability";
import { prisma } from "./prisma";
import { hospitableFetch } from "./hospitable/client";
import { getHospitablePropertyId } from "./hospitable/sync";

export type Quote = {
  nights: number;
  lineItems: { date: string; rate: number }[];
  subtotal: number;
  weeklyDiscount: number;
  cleaningFee: number;
  total: number;
  source: "hospitable" | "static";
};

function seasonFor(date: Date) {
  const monthDay = format(date, "MM-dd");
  return pricing.seasons.find((season) => {
    if (season.from <= season.to) return monthDay >= season.from && monthDay <= season.to;
    return monthDay >= season.from || monthDay <= season.to;
  });
}

function findQuoteTotal(value: unknown): number | null {
  if (!value || typeof value !== "object") return null;
  for (const [key, entry] of Object.entries(value)) {
    if (["total", "total_amount", "grand_total", "total_price"].includes(key.toLowerCase())) {
      if (typeof entry === "number") return entry > 10000 ? entry / 100 : entry;
      if (entry && typeof entry === "object" && "amount" in entry && typeof entry.amount === "number") return entry.amount / 100;
    }
    const nested = findQuoteTotal(entry);
    if (nested !== null) return nested;
  }
  return null;
}

export async function quote(checkInValue: string, checkOutValue: string, guestsValue: number): Promise<Quote> {
  const checkIn = parseISO(checkInValue);
  const checkOut = parseISO(checkOutValue);
  const guests = Number(guestsValue);
  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime()) || !isBefore(checkIn, checkOut)) throw new Error("Choose valid check-in and check-out dates.");
  const nights = differenceInCalendarDays(checkOut, checkIn);
  if (nights < pricing.minNights) throw new Error(`A minimum stay of ${pricing.minNights} nights is required.`);
  if (guests < 1 || guests > pricing.maxGuests) throw new Error(`Choose between 1 and ${pricing.maxGuests} guests.`);
  if (!(await isRangeAvailable(checkIn, checkOut))) throw new Error("Those dates are no longer available.");

  const checkInDate = format(checkIn, "yyyy-MM-dd");
  const checkOutDate = format(checkOut, "yyyy-MM-dd");
  const calendarDays = await prisma.calendarDay.findMany({
    where: { date: { gte: checkInDate, lte: checkOutDate } },
    orderBy: { date: "asc" },
  });
  const calendarByDate = new Map(calendarDays.map((day) => [day.date, day]));
  const calendarLineItems = [];
  for (let i = 0; i < nights; i += 1) {
    const date = format(addDays(checkIn, i), "yyyy-MM-dd");
    const day = calendarByDate.get(date);
    if (!day) {
      calendarLineItems.length = 0;
      break;
    }
    calendarLineItems.push({ date, rate: day.priceCents / 100 });
  }
  if (calendarLineItems.length === nights) {
    const firstDay = calendarByDate.get(checkInDate);
    const checkoutDay = calendarByDate.get(checkOutDate);
    const minStay = firstDay?.minStay || pricing.minNights;
    if (nights < minStay) throw new Error(`A minimum stay of ${minStay} nights is required.`);
    if (firstDay?.closedForCheckin) throw new Error("Check-in is unavailable on those dates.");
    if (checkoutDay?.closedForCheckout) throw new Error("Check-out is unavailable on those dates.");
    const subtotal = calendarLineItems.reduce((sum, item) => sum + item.rate, 0);
    const cleaningFee = pricing.cleaningFee;
    let total = subtotal + cleaningFee;
    if (process.env.HOSPITABLE_USE_QUOTE === "true") {
      try {
        const propertyId = await getHospitablePropertyId();
        const response = await hospitableFetch<unknown>(`/properties/${encodeURIComponent(propertyId)}/quote`, {
          method: "POST",
          body: JSON.stringify({
            checkin_date: checkInDate,
            checkout_date: checkOutDate,
            guests: { adults: guests },
          }),
        });
        console.log("Hospitable quote response:", JSON.stringify(response));
        const remoteTotal = findQuoteTotal(response);
        if (remoteTotal !== null) total = remoteTotal;
      } catch (error) {
        console.error("Hospitable quote endpoint fallback:", error instanceof Error ? error.message : "unknown error");
      }
    }
    return { nights, lineItems: calendarLineItems, subtotal, weeklyDiscount: 0, cleaningFee, total, source: "hospitable" };
  }

  const lineItems: Quote["lineItems"] = [];
  for (let i = 0; i < nights; i += 1) {
    const date = addDays(checkIn, i);
    const season = seasonFor(date);
    const weekend = [5, 6].includes(date.getDay());
    const rate = season ? (weekend ? season.weekend : season.weekday) : weekend ? pricing.weekend : pricing.weekday;
    lineItems.push({ date: format(date, "yyyy-MM-dd"), rate });
  }
  const subtotal = lineItems.reduce((sum, item) => sum + item.rate, 0);
  const weeklyDiscount = nights >= 7 ? Math.round((subtotal * pricing.weeklyDiscountPct) / 100) : 0;
  const cleaningFee = pricing.cleaningFee;
  return { nights, lineItems, subtotal, weeklyDiscount, cleaningFee, total: subtotal - weeklyDiscount + cleaningFee, source: "static" };
}
