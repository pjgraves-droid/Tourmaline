import Image from "next/image";
import Link from "next/link";
import { getListing } from "@/lib/listing";

export const dynamic = "force-dynamic";

export default async function PhotosPage() {
  const listing = await getListing();
  return <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10"><div className="mb-10 flex items-center justify-between"><Link href="/" className="text-sm font-semibold text-forest">← Back to Tourmaline House</Link><p className="eyebrow">The complete gallery</p></div><h1 className="font-display text-5xl text-forest">A house made for lingering</h1><p className="mt-3 max-w-xl leading-7 text-ink/65">Explore every corner of the home, from the pool and sauna to the garden studio and sun-filled bedrooms.</p><div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{listing.photos.map((photo, index) => <div key={photo.src} className={`relative overflow-hidden rounded-2xl ${index % 7 === 0 ? "aspect-[4/5]" : "aspect-square"}`}><Image src={photo.src} alt={photo.alt || "Tourmaline House"} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-cover transition duration-500 hover:scale-105" /></div>)}</div></main>;
}
