import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { markBookingPaid } from "@/lib/bookings";

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) return NextResponse.json({ error: "Stripe webhooks are not configured." }, { status: 503 });
  const signature = (await headers()).get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  try {
    const event = stripe.webhooks.constructEvent(await request.text(), signature, process.env.STRIPE_WEBHOOK_SECRET);
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.bookingId) await markBookingPaid(session.metadata.bookingId);
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid webhook." }, { status: 400 });
  }
}
