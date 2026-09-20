import { addDays, addMonths, format, isAfter, parseISO } from "date-fns";
import { prisma } from "@/lib/prisma";
import {
  HospitableCalendarDay,
  HospitableEnvelope,
  HospitableImage,
  HospitableProperty,
  hospitableFetch,
  isHospitableConfigured,
  listHospitableProperties,
} from "./client";

const PROPERTY_SETTING = "hospitable:propertyId";
const LAST_SYNC_SETTING = "hospitable:lastSyncAt";

export function mapProperty(property: HospitableProperty) {
  return {
    id: property.id,
    title: property.public_name || property.name || "Tourmaline House",
    name: property.name || property.public_name || "Tourmaline House",
    picture: property.picture || null,
    address: property.address || {},
    timezone: property.timezone || "Australia/Sydney",
    currency: property.currency || "AUD",
    summary: property.summary || "",
    description: property.description || "",
    checkIn: property["check-in"] || "",
    checkOut: property["check-out"] || "",
    amenities: property.amenities || [],
    capacity: property.capacity || {},
    roomDetails: property.room_details || [],
    houseRules: property.house_rules || {},
    propertyType: property.property_type || "",
    roomType: property.room_type || "",
  };
}

export function mapCalendarDays(raw: HospitableCalendarDay[] | { days?: HospitableCalendarDay[] }) {
  const days = Array.isArray(raw) ? raw : raw.days || [];
  return days
    .filter((day) => Boolean(day.date))
    .map((day) => ({
      date: day.date,
      available: day.status?.available !== false,
      priceCents: Math.max(0, Math.round(Number(day.price?.amount || 0))),
      currency: day.price?.currency || "AUD",
      minStay: Math.max(0, Number(day.min_stay || 0)),
      closedForCheckin: Boolean(day.closed_for_checkin),
      closedForCheckout: Boolean(day.closed_for_checkout),
      reason: day.status?.reason || null,
    }));
}

export async function getHospitablePropertyId() {
  const envId = process.env.HOSPITABLE_PROPERTY_ID?.trim();
  if (envId) return envId;
  const saved = await prisma.setting.findUnique({ where: { key: PROPERTY_SETTING } });
  if (saved?.value) return saved.value;
  const response = await listHospitableProperties();
  const first = response.data?.[0];
  if (!first?.id) throw new Error("Hospitable returned no properties.");
  await prisma.setting.upsert({ where: { key: PROPERTY_SETTING }, update: { value: first.id }, create: { key: PROPERTY_SETTING, value: first.id } });
  return first.id;
}

async function fetchCalendar(propertyId: string, start: Date, end: Date) {
  const days: ReturnType<typeof mapCalendarDays> = [];
  let chunkStart = start;
  while (!isAfter(chunkStart, end)) {
    const chunkEnd = isAfter(addDays(chunkStart, 89), end) ? end : addDays(chunkStart, 89);
    const response = await hospitableFetch<HospitableEnvelope<{ days?: HospitableCalendarDay[] }>>(
      `/properties/${encodeURIComponent(propertyId)}/calendar?start_date=${format(chunkStart, "yyyy-MM-dd")}&end_date=${format(chunkEnd, "yyyy-MM-dd")}`,
    );
    days.push(...mapCalendarDays(response.data || {}));
    chunkStart = addDays(chunkEnd, 1);
  }
  return days;
}

/**
 * Synchronize the selected Hospitable property, images and an 18-month calendar.
 */
export async function syncHospitable() {
  if (!isHospitableConfigured()) return { skipped: true, propertyId: null, days: 0 };
  const propertyId = await getHospitablePropertyId();
  const [propertyResponse, imageResponse] = await Promise.all([
    hospitableFetch<HospitableEnvelope<HospitableProperty>>(`/properties/${encodeURIComponent(propertyId)}`),
    hospitableFetch<HospitableEnvelope<HospitableImage[]>>(`/properties/${encodeURIComponent(propertyId)}/images`),
  ]);
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const end = addMonths(start, 18);
  const calendarDays = await fetchCalendar(propertyId, start, end);
  const mappedImages = (imageResponse.data || []).map((image, index) => ({
    url: image.url,
    thumbnailUrl: image.thumbnail_url || image.url,
    caption: image.caption || null,
    order: image.order ?? index,
  }));
  await prisma.$transaction(async (tx) => {
    await tx.hospitablePropertyCache.upsert({
      where: { id: propertyId },
      update: { json: JSON.stringify(propertyResponse.data), syncedAt: new Date() },
      create: { id: propertyId, json: JSON.stringify(propertyResponse.data), syncedAt: new Date() },
    });
    await tx.hospitableImage.deleteMany();
    if (mappedImages.length) await tx.hospitableImage.createMany({ data: mappedImages });
    await tx.calendarDay.deleteMany({ where: { date: { gte: format(start, "yyyy-MM-dd"), lte: format(end, "yyyy-MM-dd") } } });
    if (calendarDays.length) await tx.calendarDay.createMany({ data: calendarDays });
    await tx.setting.upsert({ where: { key: LAST_SYNC_SETTING }, update: { value: new Date().toISOString() }, create: { key: LAST_SYNC_SETTING, value: new Date().toISOString() } });
  });
  return { skipped: false, propertyId, days: calendarDays.length, images: mappedImages.length };
}

export async function lazySync() {
  if (!isHospitableConfigured()) return false;
  const setting = await prisma.setting.findUnique({ where: { key: LAST_SYNC_SETTING } });
  const lastSync = setting?.value ? Date.parse(setting.value) : 0;
  if (lastSync && Date.now() - lastSync < 60 * 60 * 1000) return false;
  try {
    await syncHospitable();
    return true;
  } catch (error) {
    console.error("Hospitable calendar sync skipped:", error instanceof Error ? error.message : "unknown error");
    return false;
  }
}

export async function getHospitableStatus() {
  const configured = isHospitableConfigured();
  const propertyId = process.env.HOSPITABLE_PROPERTY_ID?.trim() || (await prisma.setting.findUnique({ where: { key: PROPERTY_SETTING } }))?.value || null;
  const [cache, lastSync, daysCached] = await Promise.all([
    propertyId ? prisma.hospitablePropertyCache.findUnique({ where: { id: propertyId } }) : null,
    prisma.setting.findUnique({ where: { key: LAST_SYNC_SETTING } }),
    configured ? prisma.calendarDay.count() : Promise.resolve(0),
  ]);
  let propertyName = "";
  if (cache) {
    try {
      const raw = JSON.parse(cache.json) as HospitableProperty;
      propertyName = raw.public_name || raw.name || "";
    } catch {
      propertyName = "";
    }
  }
  return { configured, propertyId, propertyName, lastSyncAt: lastSync?.value || null, daysCached };
}

export async function saveHospitablePropertyId(propertyId: string) {
  await prisma.setting.upsert({ where: { key: PROPERTY_SETTING }, update: { value: propertyId }, create: { key: PROPERTY_SETTING, value: propertyId } });
}

export { PROPERTY_SETTING, LAST_SYNC_SETTING };
