import { NextRequest, NextResponse } from "next/server";
import { syncAirbnbCalendar } from "@/lib/airbnbSync";
import { isHospitableConfigured } from "@/lib/hospitable/client";
import { syncHospitable } from "@/lib/hospitable/sync";

function authorized(request: NextRequest) {
  return request.cookies.get("tourmaline_admin")?.value === process.env.ADMIN_PASSWORD;
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    return NextResponse.json(isHospitableConfigured() ? await syncHospitable() : await syncAirbnbCalendar());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Sync failed." }, { status: 500 });
  }
}
