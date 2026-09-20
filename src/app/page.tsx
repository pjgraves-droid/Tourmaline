import Image from "next/image";
import Link from "next/link";
import BookingWidget from "@/components/BookingWidget";
import AmenitiesModal from "@/components/AmenitiesModal";
import { getListing } from "@/lib/listing";

export const dynamic = "force-dynamic";

export default async function Home() {
  const listing = await getListing();
  return (
    <main className="pb-28 md:pb-16">
      <div className="mx-auto max-w-7xl px-5 pt-7 sm:px-8 lg:px-10">
        <div className="mb-7 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-[0.18em] text-forest uppercase"><span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-forest text-sand">T</span>Tourmaline House</Link>
          <Link href="/photos" className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold transition hover:border-forest hover:text-forest">Explore the gallery</Link>
        </div>
        <div className="mb-5">
          <p className="mb-3 text-sm font-semibold tracking-[0.2em] text-terracotta uppercase">{listing.location}</p>
          <h1 className="max-w-4xl font-display text-4xl leading-[1.04] text-forest sm:text-5xl lg:text-6xl">{listing.title}</h1>
          <p className="mt-4 text-base text-ink/65">{listing.subtitle} · Entire home · <strong className="font-semibold text-ink">{listing.capacity.guests} guests · {listing.capacity.bedrooms} bedrooms · {listing.capacity.beds} beds · {listing.capacity.bathrooms} bathrooms</strong></p>
        </div>
        <div className="relative grid h-[min(64vw,600px)] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-[1.5rem] sm:gap-3 lg:h-[570px]">
          {listing.photos.slice(0, 5).map((photo, index) => <div key={photo.src} className={`relative ${index === 0 ? "col-span-2 row-span-2" : "col-span-1 row-span-1"}`}><Image src={photo.src} alt={photo.alt || "Tourmaline House"} fill priority={index === 0} sizes={index === 0 ? "(max-width: 768px) 66vw, 50vw" : "25vw"} className="object-cover transition duration-700 hover:scale-105" /></div>)}
          <Link href="/photos" className="absolute right-4 bottom-4 rounded-full bg-cream/95 px-4 py-2 text-sm font-semibold text-forest shadow-lg backdrop-blur transition hover:bg-white">Show all photos ↗</Link>
        </div>

        <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_365px] lg:gap-20">
          <div>
            <div className="flex items-start justify-between border-b border-ink/10 pb-8"><div><h2 className="font-display text-3xl text-forest">A private wellness estate by the sea</h2><p className="mt-2 text-ink/60">Designed for long lunches, cold plunges and slow mornings.</p></div><div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-full bg-sage text-2xl text-forest sm:flex">✦</div></div>
            <section className="border-b border-ink/10 py-8"><div className="grid grid-cols-2 gap-y-7 sm:grid-cols-3">{listing.highlights.map(([label, text]) => <div key={label} className="flex gap-3"><span className="text-xl text-terracotta">✦</span><div><p className="font-semibold text-forest">{label}</p><p className="mt-1 text-sm leading-5 text-ink/60">{text}</p></div></div>)}</div></section>
            <section className="border-b border-ink/10 py-10"><p className="whitespace-pre-line text-[1.05rem] leading-8 text-ink/80">{listing.summary}</p><details className="group mt-5"><summary className="cursor-pointer list-none font-semibold text-forest underline decoration-terracotta decoration-2 underline-offset-4">Read the full story <span className="ml-2 transition group-open:inline-block group-open:rotate-180">↓</span></summary><p className="mt-6 whitespace-pre-line leading-8 text-ink/70">{listing.description}</p></details></section>
            <section className="border-b border-ink/10 py-10"><div className="mb-6 flex items-end justify-between"><div><p className="eyebrow">Rest easy</p><h2 className="section-title">Where you&apos;ll sleep</h2></div><span className="text-sm text-ink/50">{listing.capacity.bedrooms} bedrooms · {listing.capacity.beds} beds</span></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{listing.bedrooms.map((room) => <article key={room.name} className="overflow-hidden rounded-2xl border border-ink/10 bg-white"><div className="relative h-40"><Image src={room.image} alt={room.name} fill className="object-cover" sizes="300px" /></div><div className="p-4"><h3 className="font-semibold text-forest">{room.name}</h3><p className="mt-1 text-xs uppercase tracking-wider text-terracotta">{room.location}</p><p className="mt-3 text-sm font-medium text-ink/80">{room.bed}</p><p className="mt-1 text-sm leading-5 text-ink/55">{room.detail}</p></div></article>)}</div></section>
            <section className="border-b border-ink/10 py-10"><div className="mb-6 flex items-end justify-between"><div><p className="eyebrow">Thoughtful details</p><h2 className="section-title">What this place offers</h2></div><AmenitiesModal groups={listing.amenityGroups} total={listing.amenities.length} /></div><div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">{listing.amenities.slice(0, 12).map((item) => <div key={item} className="flex gap-3 text-sm text-ink/75"><span className="text-terracotta">✓</span>{item}</div>)}</div></section>
            <section className="border-b border-ink/10 py-10"><p className="eyebrow">The details</p><h2 className="section-title">House rules &amp; safety</h2><div className="mt-6 grid gap-6 sm:grid-cols-2"><div className="rounded-2xl bg-sage/45 p-5"><h3 className="font-semibold text-forest">Before you arrive</h3><ul className="mt-4 space-y-3 text-sm leading-6 text-ink/70"><li>Check-in after {listing.checkIn || "3:00pm"} · checkout before {listing.checkOut || "11:00am"}</li><li>Self check-in via keypad · {listing.houseRules.petsAllowed ? "pets welcome" : "no pets"}</li><li>Maximum {listing.capacity.guests} guests · STRA PID-STRA-96164</li><li>Please observe council quiet hours from 10:00pm–8:00am</li></ul></div><div className="rounded-2xl bg-sand/55 p-5"><h3 className="font-semibold text-forest">For peace of mind</h3><ul className="mt-4 space-y-3 text-sm leading-6 text-ink/70"><li>Exterior security cameras with a guest privacy off-switch</li><li>Smoke and carbon monoxide alarms</li><li>Fire extinguisher on site</li><li>Gym access on request, with waiver for guests 16+</li></ul></div></div></section>
            <section className="border-b border-ink/10 py-10"><p className="eyebrow">A quiet pocket of the Central Coast</p><h2 className="section-title">Find us in Pearl Beach</h2><p className="mt-4 text-ink/70">{listing.location}</p><div className="mt-6 overflow-hidden rounded-2xl border border-ink/10"><iframe title="Map showing Pearl Beach, New South Wales" src={`https://www.openstreetmap.org/export/embed.html?bbox=${listing.coordinates.longitude - 0.02}%2C${listing.coordinates.latitude - 0.015}%2C${listing.coordinates.longitude + 0.02}%2C${listing.coordinates.latitude + 0.015}&amp;layer=mapnik&amp;marker=${listing.coordinates.latitude}%2C${listing.coordinates.longitude}`} className="h-80 w-full border-0" loading="lazy" /></div></section>
            <section className="flex items-center gap-5 py-10"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-forest font-display text-3xl text-sand">S</div><div><p className="eyebrow">Your host</p><h2 className="section-title text-2xl">Hosted by Sam</h2><p className="mt-2 max-w-xl leading-6 text-ink/65">New host · 100% response rate · responds within an hour. Sam created Tourmaline House as a generous, restorative base for friends and family to reconnect with the coast.</p></div></section>
          </div>
          <aside className="hidden lg:block"><BookingWidget /></aside>
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-ink/10 bg-cream/95 p-3 shadow-2xl backdrop-blur lg:hidden"><BookingWidget compact /></div>
    </main>
  );
}
