import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { quote } from "@/lib/pricing";
import { parseDate } from "@/lib/availability";

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: "Payments not configured yet. Please contact the host to arrange your booking." }, { status: 503 });
  try {
    const body = await request.json() as { checkIn: string; checkOut: string; guests: number; name: string; email: string; phone?: string; message?: string };
    if (!body.name?.trim() || !body.email?.trim()) return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
    const stay = await quote(body.checkIn, body.checkOut, Number(body.guests));
    const booking = await prisma.booking.create({ data: { checkIn: parseDate(body.checkIn), checkOut: parseDate(body.checkOut), guests: Number(body.guests), name: body.name.trim(), email: body.email.trim(), phone: body.phone?.trim() ?? "", message: body.message?.trim() ?? null, totalCents: stay.total * 100, status: "pending" } });
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;
    const session = await stripe.checkout.sessions.create({ mode: "payment", currency: "aud", customer_email: body.email.trim(), line_items: [{ price_data: { currency: "aud", unit_amount: stay.total * 100, product_data: { name: `Tourmaline House — ${stay.nights} nights (${body.checkIn} to ${body.checkOut})` } }, quantity: 1 }], metadata: { bookingId: booking.id }, success_url: `${siteUrl}/book/success?session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${siteUrl}/book/cancelled` });
    await prisma.booking.update({ where: { id: booking.id }, data: { stripeSessionId: session.id } });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to start checkout." }, { status: 400 });
  }
}
