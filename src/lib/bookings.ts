import { pricing } from "@/data/pricing";
import { HospitableError, HospitableEnvelope, HospitableReservation, hospitableFetch, isHospitableConfigured } from "./hospitable/client";
import { getHospitablePropertyId } from "./hospitable/sync";
import { prisma } from "./prisma";

type BookingInput = {
  id: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  name: string;
  email: string;
  phone: string;
  message: string | null;
  totalCents: number;
  hospitableReservationId?: string | null;
};

function splitName(name: string) {
  const [firstName, ...rest] = name.trim().split(/\s+/);
  return { firstName: firstName || "Guest", lastName: rest.join(" ") || "Guest" };
}

export async function createHospitableReservation(booking: BookingInput) {
  const propertyId = await getHospitablePropertyId();
  const { firstName, lastName } = splitName(booking.name);
  const cleaningFeeCents = Math.max(0, Math.round(pricing.cleaningFee * 100));
  const financials: { currency: string; accommodation: number; cleaning_fee?: number } = {
    currency: "AUD",
    accommodation: Math.max(0, booking.totalCents - cleaningFeeCents),
  };
  if (cleaningFeeCents > 0) financials.cleaning_fee = cleaningFeeCents;
  const body: Record<string, unknown> = {
    property_id: propertyId,
    check_in: booking.checkIn.toISOString().slice(0, 10),
    check_out: booking.checkOut.toISOString().slice(0, 10),
    guests: { adults: booking.guests },
    guest: { first_name: firstName, last_name: lastName, email: booking.email, ...(booking.phone ? { phone: booking.phone } : {}) },
    language: "en",
    financials,
    notes: [booking.message?.trim(), "Booked via tourmalinehouse direct site"].filter(Boolean).join("\n\n"),
    reservation_code: booking.id,
  };
  if (process.env.HOSPITABLE_CHANNEL?.trim()) body.channel = process.env.HOSPITABLE_CHANNEL.trim();
  const response = await hospitableFetch<HospitableEnvelope<HospitableReservation>>("/reservations", { method: "POST", body: JSON.stringify(body) });
  const reservationId = response.data?.id || response.data?.uuid;
  if (!reservationId) throw new Error("Hospitable reservation response did not include an id.");
  return reservationId;
}

export async function markBookingPaid(bookingId: string) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new Error("Booking not found.");
  const paidBooking = booking.status === "paid" ? booking : await prisma.booking.update({ where: { id: bookingId }, data: { status: "paid" } });
  if (!isHospitableConfigured() || paidBooking.hospitableReservationId) return paidBooking;
  try {
    const reservationId = await createHospitableReservation(paidBooking);
    return await prisma.booking.update({ where: { id: bookingId }, data: { hospitableReservationId: reservationId, hospitableSyncError: null } });
  } catch (error) {
    const message = error instanceof HospitableError
      ? `Hospitable reservation sync failed (HTTP ${error.status}).`
      : "Hospitable reservation sync failed.";
    return await prisma.booking.update({ where: { id: bookingId }, data: { hospitableSyncError: message } });
  }
}
