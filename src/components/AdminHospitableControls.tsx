"use client";

import { useState } from "react";
import type { ChangeEvent } from "react";

type Property = { id: string; name?: string; public_name?: string };

export default function AdminHospitableControls({ configured, propertyId, properties }: { configured: boolean; propertyId: string | null; properties: Property[] }) {
  const [message, setMessage] = useState("");
  async function sync() {
    setMessage("Syncing…");
    const response = await fetch("/api/sync", { method: "POST" });
    const data = await response.json();
    setMessage(response.ok ? `Synced ${data.days ?? data.synced ?? 0} calendar days.` : data.error || "Sync failed.");
    if (response.ok) window.location.reload();
  }
  async function choose(event: ChangeEvent<HTMLSelectElement>) {
    const response = await fetch("/api/admin/hospitable/property", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ propertyId: event.target.value }) });
    setMessage(response.ok ? "Property saved." : "Unable to save property.");
    if (response.ok) window.location.reload();
  }
  if (!configured) return <section className="mt-8 rounded-3xl border border-ink/10 bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="eyebrow">Hospitable</p><h2 className="font-display text-2xl text-forest">Not configured</h2><p className="mt-1 text-sm text-ink/55">Static listing, pricing and Airbnb iCal fallback are active.</p></div><span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold uppercase tracking-wider text-terracotta">Fallback mode</span></div></section>;
  return <section className="mt-8 rounded-3xl border border-ink/10 bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow">Hospitable</p><h2 className="font-display text-2xl text-forest">Source of truth connected</h2><p className="mt-1 text-sm text-ink/55">Property content, images, availability and live prices sync from Hospitable.</p></div><button type="button" onClick={sync} className="rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-white">Sync from Hospitable now</button></div><label className="mt-5 block max-w-xl text-xs font-semibold uppercase tracking-wider text-ink/50">Selected property<select value={propertyId || ""} onChange={choose} className="mt-2 block w-full rounded-xl border border-ink/15 bg-cream px-3 py-3 text-sm normal-case tracking-normal text-ink"><option value="" disabled>Select a property</option>{properties.map((property) => <option key={property.id} value={property.id}>{property.public_name || property.name || property.id}</option>)}</select></label>{message && <p className="mt-3 text-sm text-ink/60">{message}</p>}</section>;
}
