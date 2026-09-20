import { NextRequest, NextResponse } from "next/server";
import { addDays, parseISO } from "date-fns";
import { getBlockedRanges } from "@/lib/availability";

export async function GET(request: NextRequest) {
  const fromValue = request.nextUrl.searchParams.get("from");
  const toValue = request.nextUrl.searchParams.get("to");
  if (!fromValue || !toValue) return NextResponse.json({ error: "from and to are required." }, { status: 400 });
  try {
    const from = parseISO(fromValue);
    const to = addDays(parseISO(toValue), 1);
    return NextResponse.json({ blocked: await getBlockedRanges(from, to) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to fetch availability." }, { status: 400 });
  }
}
