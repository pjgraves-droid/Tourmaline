import { NextRequest, NextResponse } from "next/server";
import { markBookingPaid } from "@/lib/bookings";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (request.cookies.get("tourmaline_admin")?.value !== process.env.ADMIN_PASSWORD) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const { id } = await params;
    const booking = await markBookingPaid(id);
    return NextResponse.json({ ok: true, booking });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to push booking." }, { status: 400 });
  }
}
