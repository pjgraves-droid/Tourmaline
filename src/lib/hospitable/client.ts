const BASE_URL = "https://public.api.hospitable.com/v2";

export class HospitableError extends Error {
  constructor(public readonly status: number, public readonly body: unknown) {
    super(`Hospitable API request failed (${status})`);
    this.name = "HospitableError";
  }
}

export type HospitableEnvelope<T> = { data: T };

export type HospitableProperty = {
  id: string;
  name?: string;
  public_name?: string;
  picture?: string | null;
  address?: {
    city?: string;
    state?: string;
    country?: string;
    coordinates?: { latitude?: string | number; longitude?: string | number };
    display?: string;
  };
  timezone?: string;
  currency?: string;
  summary?: string | null;
  description?: string | null;
  "check-in"?: string;
  "check-out"?: string;
  amenities?: string[];
  capacity?: { max?: number; bedrooms?: number; beds?: number; bathrooms?: number };
  room_details?: Array<{ type?: string; quantity?: number; beds?: Array<{ type?: string; quantity?: number }> }>;
  house_rules?: { pets_allowed?: boolean; smoking_allowed?: boolean; events_allowed?: boolean };
  property_type?: string;
  room_type?: string;
};

export type HospitableImage = {
  url: string;
  thumbnail_url?: string;
  caption?: string | null;
  order?: number;
};

export type HospitableCalendarDay = {
  date: string;
  day?: string;
  min_stay?: number;
  closed_for_checkin?: boolean;
  closed_for_checkout?: boolean;
  status?: { available?: boolean; reason?: string | null; source?: string; source_type?: string };
  price?: { amount?: number; currency?: string; formatted?: string };
};

export type HospitableCalendarResponse = { days?: HospitableCalendarDay[] };

export type HospitableReservation = {
  id?: string;
  uuid?: string;
  reservation_code?: string;
  check_in?: string;
  check_out?: string;
};

export function isHospitableConfigured() {
  return Boolean(process.env.HOSPITABLE_API_TOKEN?.trim());
}

/**
 * Fetch a typed raw response from the Hospitable Public API v2.
 * Endpoint paths are relative to https://public.api.hospitable.com/v2.
 */
export async function hospitableFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = process.env.HOSPITABLE_API_TOKEN?.trim();
  if (!token) throw new HospitableError(0, { error: "Hospitable is not configured." });
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(`${BASE_URL}${path}`, { ...init, headers, cache: "no-store" });
  const text = await response.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!response.ok) throw new HospitableError(response.status, body);
  return body as T;
}

export async function listHospitableProperties() {
  return hospitableFetch<HospitableEnvelope<HospitableProperty[]>>("/properties?per_page=50");
}
