"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isBefore, parseISO, startOfMonth, startOfWeek, subDays } from "date-fns";

type Props = { compact?: boolean };
type Quote = { nights: number; subtotal: number; weeklyDiscount: number; cleaningFee: number; total: number; source: "hospitable" | "static" };
type BlockedRange = { start: string; end: string };
const aud = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

export default function BookingWidget({ compact = false }: Props) {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [blockedRanges, setBlockedRanges] = useState<BlockedRange[]>([]);
  useEffect(() => {
    const from = new Date();
    const to = addMonths(from, 18);
    fetch(`/api/availability?from=${format(from, "yyyy-MM-dd")}&to=${format(to, "yyyy-MM-dd")}`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Availability unavailable")))
      .then((data) => setBlockedRanges(data.blocked || []))
      .catch(() => setBlockedRanges([]));
  }, []);
  const blockedDates = useMemo(() => {
    const result = new Set<string>();
    blockedRanges.forEach((range) => {
      let cursor = parseISO(range.start);
      const end = parseISO(range.end);
      while (isBefore(cursor, end)) {
        result.add(format(cursor, "yyyy-MM-dd"));
        cursor = addDays(cursor, 1);
      }
    });
    return result;
  }, [blockedRanges]);
  useEffect(() => {
    if (!checkIn || !checkOut || !guests) { setQuote(null); return; }
    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/quote?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`, { signal: controller.signal }).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error); return data; }).then((data) => { setQuote(data.quote); setError(""); }).catch((err) => { if (err.name !== "AbortError") { setQuote(null); setError(err.message); } }).finally(() => setLoading(false));
    return () => controller.abort();
  }, [checkIn, checkOut, guests]);
  const href = useMemo(() => quote ? `/book?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}` : "#", [checkIn, checkOut, guests, quote]);
  if (compact) return <div className="mx-auto flex max-w-2xl items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-ink/50">{quote ? `${quote.nights} nights` : "Ready when you are"}</p><p className="font-display text-xl text-forest">{quote ? aud.format(quote.total) : "Choose dates"}</p></div><a href={href} className={`rounded-full px-6 py-3 text-sm font-semibold text-white ${quote ? "bg-forest" : "pointer-events-none bg-ink/20"}`}>Reserve</a></div>;
  return <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-[0_18px_60px_rgba(32,61,49,0.12)]"><p className="eyebrow">Plan your stay</p><h2 className="mt-2 font-display text-3xl text-forest">Make it yours</h2><div className="mt-6 grid grid-cols-2 gap-2"><CalendarInput label="Check in" value={checkIn} min={tomorrow} blockedDates={blockedDates} onChange={setCheckIn} /><CalendarInput label="Check out" value={checkOut} min={checkIn || tomorrow} blockedDates={blockedDates} onChange={setCheckOut} /></div><label className="mt-2 block rounded-xl border border-ink/15 p-3 text-xs font-semibold uppercase tracking-wider text-ink/50">Guests<select value={guests} onChange={(e) => setGuests(Number(e.target.value))} className="mt-2 block w-full bg-transparent text-sm font-medium normal-case tracking-normal text-ink outline-none">{Array.from({ length: 10 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? "guest" : "guests"}</option>)}</select></label>{error && <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}{quote && <div className="mt-6 space-y-3 border-t border-ink/10 pt-5 text-sm text-ink/70">{quote.source === "hospitable" && <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest">Live pricing</p>}<div className="flex justify-between"><span>{aud.format(quote.subtotal)} · {quote.nights} nights</span><span>{aud.format(quote.subtotal)}</span></div>{quote.weeklyDiscount > 0 && <div className="flex justify-between text-forest"><span>Weekly stay discount</span><span>−{aud.format(quote.weeklyDiscount)}</span></div>}<div className="flex justify-between"><span>Cleaning fee</span><span>{aud.format(quote.cleaningFee)}</span></div><div className="flex justify-between border-t border-ink/10 pt-4 text-lg font-semibold text-forest"><span>Total</span><span>{aud.format(quote.total)}</span></div></div>}<a href={href} className={`mt-6 flex w-full items-center justify-center rounded-full py-3.5 font-semibold text-white transition ${quote && !loading ? "bg-forest hover:bg-forest/90" : "pointer-events-none bg-ink/20"}`}>{loading ? "Checking dates…" : "Reserve"}</a><p className="mt-3 text-center text-xs text-ink/50">Unavailable dates are greyed out in the picker.</p></div>;
}

function CalendarInput({ label, value, min, blockedDates, onChange }: { label: string; value: string; min: string; blockedDates: Set<string>; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => startOfMonth(parseISO(value || min)));
  useEffect(() => {
    if (value) setMonth(startOfMonth(parseISO(value)));
  }, [value]);
  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(month)), end: endOfWeek(endOfMonth(month)) });
  return <div className="relative rounded-xl border border-ink/15 p-3 text-xs font-semibold uppercase tracking-wider text-ink/50"><span>{label}</span><button type="button" onClick={() => setOpen((current) => !current)} className="mt-2 block w-full text-left text-sm font-medium normal-case tracking-normal text-ink">{value || "Choose a date"}</button>{open && <div className="absolute top-full left-0 z-30 mt-2 w-[290px] rounded-2xl border border-ink/10 bg-cream p-4 normal-case tracking-normal shadow-2xl"><div className="flex items-center justify-between"><button type="button" onClick={() => setMonth((current) => subDays(startOfMonth(current), 1))} className="rounded-full px-2 py-1 text-forest">←</button><strong className="text-sm text-forest">{format(month, "MMMM yyyy")}</strong><button type="button" onClick={() => setMonth((current) => addMonths(current, 1))} className="rounded-full px-2 py-1 text-forest">→</button></div><div className="mt-3 grid grid-cols-7 text-center text-[10px] uppercase text-ink/45">{["S", "M", "T", "W", "T", "F", "S"].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div><div className="mt-2 grid grid-cols-7 gap-1">{days.map((day) => { const date = format(day, "yyyy-MM-dd"); const outside = format(day, "MM") !== format(month, "MM"); const disabled = outside || isBefore(day, parseISO(min)) || blockedDates.has(date); return <button key={date} type="button" disabled={disabled} onClick={() => { onChange(date); setOpen(false); }} className={`h-8 rounded-full text-xs ${outside ? "text-transparent" : disabled ? "bg-ink/10 text-ink/25" : value === date ? "bg-forest text-white" : "text-ink hover:bg-sage"}`}>{format(day, "d")}</button>; })}</div></div>}</div>;
}
