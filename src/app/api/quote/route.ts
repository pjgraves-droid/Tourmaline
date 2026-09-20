import { NextRequest, NextResponse } from "next/server";
import { quote } from "@/lib/pricing";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  try {
    const result = await quote(params.get("checkIn") ?? "", params.get("checkOut") ?? "", Number(params.get("guests") ?? 0));
    return NextResponse.json({ quote: result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to calculate quote." }, { status: 400 });
  }
}
