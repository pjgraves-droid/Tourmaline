"use client";

import { useState } from "react";

type Props = { groups: { name: string; items: string[] }[]; total: number };

export default function AmenitiesModal({ groups, total }: Props) {
  const [open, setOpen] = useState(false);
  return <>
    <button onClick={() => setOpen(true)} className="text-sm font-semibold text-forest underline decoration-terracotta decoration-2 underline-offset-4">Show all {total} amenities</button>
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest/45 p-4" role="dialog" aria-modal="true" aria-label="All amenities"><div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-cream p-6 shadow-2xl sm:p-10"><div className="flex items-center justify-between"><div><p className="eyebrow">Everything included</p><h2 className="font-display text-3xl text-forest">All amenities</h2></div><button onClick={() => setOpen(false)} className="rounded-full border border-ink/15 px-3 py-1 text-xl text-forest" aria-label="Close amenities">×</button></div><div className="mt-8 grid gap-8 sm:grid-cols-2">{groups.map((group) => <div key={group.name}><h3 className="font-semibold text-forest">{group.name}</h3><ul className="mt-3 space-y-2 text-sm text-ink/65">{group.items.map((item) => <li key={item}>✓ {item}</li>)}</ul></div>)}</div></div></div>}
  </>;
}
