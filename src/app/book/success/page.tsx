import Link from "next/link";
import Stripe from "stripe";
import { markBookingPaid } from "@/lib/bookings";

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id: sessionId } = await searchParams;
  let bookingId = "";
  if (sessionId && process.env.STRIPE_SECRET_KEY) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    bookingId = session.metadata?.bookingId ?? "";
    if (session.payment_status === "paid" && bookingId) await markBookingPaid(bookingId);
  }
  return <main className="flex min-h-[80vh] items-center justify-center px-5 py-16"><div className="max-w-xl rounded-3xl bg-white p-8 text-center shadow-[0_18px_60px_rgba(32,61,49,0.1)] sm:p-12"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sage text-3xl text-forest">✓</div><p className="eyebrow mt-6">Reservation received</p><h1 className="mt-2 font-display text-5xl text-forest">Your stay is confirmed</h1><p className="mt-5 leading-7 text-ink/65">Thank you for choosing Tourmaline House. Sam will be in touch shortly with everything you need for a restorative Pearl Beach escape.</p>{bookingId && <p className="mt-5 text-xs uppercase tracking-wider text-ink/45">Booking reference · {bookingId.slice(-8).toUpperCase()}</p>}<Link href="/" className="mt-8 inline-flex rounded-full bg-forest px-6 py-3 font-semibold text-white">Back to the house</Link></div></main>;
}
