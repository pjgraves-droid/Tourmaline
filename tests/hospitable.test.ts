import { beforeEach, describe, expect, it, vi } from "vitest";
import fixture from "./fixtures/hospitable.json";

const mocks = vi.hoisted(() => ({
  bookingFindMany: vi.fn(),
  blockedFindMany: vi.fn(),
  calendarFindMany: vi.fn(),
  hospitableFetch: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    booking: { findMany: mocks.bookingFindMany },
    blockedDate: { findMany: mocks.blockedFindMany },
    calendarDay: { findMany: mocks.calendarFindMany },
  },
}));

describe("Hospitable calendar pricing", () => {
  beforeEach(() => {
    mocks.bookingFindMany.mockResolvedValue([]);
    mocks.blockedFindMany.mockResolvedValue([]);
    mocks.calendarFindMany.mockResolvedValue([]);
  });

  it("uses calendar prices and cleaning fee", async () => {
    mocks.calendarFindMany.mockResolvedValue([
      { date: "2026-12-01", available: true, priceCents: 180000, currency: "AUD", minStay: 2, closedForCheckin: false, closedForCheckout: false, reason: null },
      { date: "2026-12-02", available: true, priceCents: 200000, currency: "AUD", minStay: 2, closedForCheckin: false, closedForCheckout: false, reason: null },
      { date: "2026-12-03", available: true, priceCents: 200000, currency: "AUD", minStay: 2, closedForCheckin: false, closedForCheckout: false, reason: null },
    ]);
    const { quote } = await import("@/lib/pricing");
    const result = await quote("2026-12-01", "2026-12-04", 8);
    expect(result.source).toBe("hospitable");
    expect(result.subtotal).toBe(5800);
    expect(result.total).toBe(result.subtotal + result.cleaningFee);
  });

  it("honours Hospitable minimum stay", async () => {
    mocks.calendarFindMany.mockResolvedValue([
      { date: "2026-12-01", available: true, priceCents: 180000, currency: "AUD", minStay: 3, closedForCheckin: false, closedForCheckout: false, reason: null },
      { date: "2026-12-02", available: true, priceCents: 200000, currency: "AUD", minStay: 3, closedForCheckin: false, closedForCheckout: false, reason: null },
    ]);
    const { quote } = await import("@/lib/pricing");
    await expect(quote("2026-12-01", "2026-12-03", 2)).rejects.toThrow("minimum stay of 3");
  });

  it("rejects closed check-in dates", async () => {
    mocks.calendarFindMany.mockResolvedValue([
      { date: "2026-12-01", available: true, priceCents: 180000, currency: "AUD", minStay: 2, closedForCheckin: true, closedForCheckout: false, reason: null },
      { date: "2026-12-02", available: true, priceCents: 200000, currency: "AUD", minStay: 2, closedForCheckin: false, closedForCheckout: false, reason: null },
    ]);
    const { quote } = await import("@/lib/pricing");
    await expect(quote("2026-12-01", "2026-12-03", 2)).rejects.toThrow("Check-in is unavailable");
  });

  it("falls back to static pricing when calendar rows are missing", async () => {
    const { quote } = await import("@/lib/pricing");
    const result = await quote("2026-12-01", "2026-12-04", 8);
    expect(result.source).toBe("static");
    expect(result.total).toBe(4500);
  });
});

describe("Hospitable mapping", () => {
  it("maps raw snake_case property and calendar fixtures", async () => {
    const { mapCalendarDays, mapProperty } = await import("@/lib/hospitable/sync");
    expect(mapProperty(fixture.property).title).toBe("Tourmaline House · Pearl Beach");
    expect(mapProperty(fixture.property).houseRules.pets_allowed).toBe(true);
    expect(mapCalendarDays(fixture.calendar).at(0)).toMatchObject({ date: "2026-12-01", priceCents: 180000, minStay: 3, available: true });
  });
});

describe("Hospitable reservation payload", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.hospitableFetch.mockReset();
  });

  it("sends the exact snake_case reservation body", async () => {
    vi.doMock("@/lib/hospitable/client", () => ({
      HospitableError: class extends Error {},
      hospitableFetch: mocks.hospitableFetch,
      isHospitableConfigured: () => true,
    }));
    vi.doMock("@/lib/hospitable/sync", () => ({ getHospitablePropertyId: () => Promise.resolve("property-123") }));
    mocks.hospitableFetch.mockResolvedValue({ data: { id: "reservation-123" } });
    const { createHospitableReservation } = await import("@/lib/bookings");
    const id = await createHospitableReservation({
      id: "booking-123",
      checkIn: new Date("2026-12-01T00:00:00.000Z"),
      checkOut: new Date("2026-12-04T00:00:00.000Z"),
      guests: 8,
      name: "Alex Smith",
      email: "alex@example.com",
      phone: "0400000000",
      message: "Late arrival",
      totalCents: 560000,
    });
    expect(id).toBe("reservation-123");
    expect(mocks.hospitableFetch).toHaveBeenCalledWith("/reservations", {
      method: "POST",
      body: JSON.stringify({
        property_id: "property-123",
        check_in: "2026-12-01",
        check_out: "2026-12-04",
        guests: { adults: 8 },
        guest: { first_name: "Alex", last_name: "Smith", email: "alex@example.com", phone: "0400000000" },
        language: "en",
        financials: { currency: "AUD", accommodation: 560000 },
        notes: "Late arrival\n\nBooked via tourmalinehouse direct site",
        reservation_code: "booking-123",
      }),
    });
  });
});
