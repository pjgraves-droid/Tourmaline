import { prisma } from "@/lib/prisma";
import photos from "@/data/photos.json";
import { amenityGroups, bedrooms, flatAmenities, fullDescription, highlights, introDescription } from "@/data/content";
import { isHospitableConfigured } from "./hospitable/client";
import { mapProperty } from "./hospitable/sync";

export type ListingPhoto = { src: string; alt: string };
export type Listing = {
  title: string;
  subtitle: string;
  location: string;
  capacity: { guests: number; bedrooms: number; beds: number; bathrooms: number };
  checkIn: string;
  checkOut: string;
  description: string;
  summary: string;
  amenities: string[];
  amenityGroups: { name: string; items: string[] }[];
  houseRules: { petsAllowed: boolean; smokingAllowed: boolean; eventsAllowed: boolean };
  coordinates: { latitude: number; longitude: number };
  photos: ListingPhoto[];
  bedrooms: typeof bedrooms;
  highlights: typeof highlights;
};

const staticListing: Listing = {
  title: "Nordic-Style Beachside Wellness Retreat",
  subtitle: "Tourmaline House · Pearl Beach, NSW",
  location: "Pearl Beach, New South Wales, Australia",
  capacity: { guests: 10, bedrooms: 5, beds: 8, bathrooms: 3 },
  checkIn: "15:00",
  checkOut: "11:00",
  description: fullDescription,
  summary: introDescription,
  amenities: flatAmenities,
  amenityGroups,
  houseRules: { petsAllowed: true, smokingAllowed: false, eventsAllowed: false },
  coordinates: { latitude: -33.545, longitude: 151.305 },
  photos: photos.map((photo) => ({ src: photo.src, alt: photo.alt || "Tourmaline House" })),
  bedrooms,
  highlights,
};

export async function getListing(): Promise<Listing> {
  if (!isHospitableConfigured()) return staticListing;
  const selectedProperty = process.env.HOSPITABLE_PROPERTY_ID?.trim() || (await prisma.setting.findUnique({ where: { key: "hospitable:propertyId" } }))?.value;
  const cache = selectedProperty
    ? await prisma.hospitablePropertyCache.findUnique({ where: { id: selectedProperty } })
    : await prisma.hospitablePropertyCache.findFirst({ orderBy: { syncedAt: "desc" } });
  if (!cache) return staticListing;
  try {
    const property = mapProperty(JSON.parse(cache.json));
    const images = await prisma.hospitableImage.findMany({ orderBy: { order: "asc" } });
    const address = property.address as { display?: string; city?: string; state?: string; country?: string; coordinates?: { latitude?: string | number; longitude?: string | number } };
    const coordinates = address.coordinates || {};
    const remotePhotos = images.map((image) => ({ src: image.url, alt: image.caption || property.title }));
    const hospitableAmenities = property.amenities.length ? property.amenities : flatAmenities;
    return {
      ...staticListing,
      title: property.title,
      subtitle: `${property.name} · ${address.city || "Pearl Beach"}, ${address.state || "NSW"}`,
      location: address.display || [address.city, address.state, address.country].filter(Boolean).join(", ") || staticListing.location,
      capacity: { guests: property.capacity.max || staticListing.capacity.guests, bedrooms: property.capacity.bedrooms || staticListing.capacity.bedrooms, beds: property.capacity.beds || staticListing.capacity.beds, bathrooms: property.capacity.bathrooms || staticListing.capacity.bathrooms },
      checkIn: property.checkIn || staticListing.checkIn,
      checkOut: property.checkOut || staticListing.checkOut,
      description: property.description || staticListing.description,
      summary: property.summary || staticListing.summary,
      amenities: hospitableAmenities,
      amenityGroups: [{ name: "Hospitable amenities", items: hospitableAmenities }],
      houseRules: { petsAllowed: property.houseRules.pets_allowed ?? staticListing.houseRules.petsAllowed, smokingAllowed: property.houseRules.smoking_allowed ?? staticListing.houseRules.smokingAllowed, eventsAllowed: property.houseRules.events_allowed ?? staticListing.houseRules.eventsAllowed },
      coordinates: { latitude: Number(coordinates.latitude ?? staticListing.coordinates.latitude), longitude: Number(coordinates.longitude ?? staticListing.coordinates.longitude) },
      photos: remotePhotos.length ? remotePhotos : staticListing.photos,
    };
  } catch (error) {
    console.error("Using static listing fallback:", error instanceof Error ? error.message : "invalid Hospitable listing cache");
    return staticListing;
  }
}
