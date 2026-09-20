import { NextRequest, NextResponse } from "next/server";
import { saveHospitablePropertyId } from "@/lib/hospitable/sync";

function authorized(request: NextRequest) {
  return request.cookies.get("tourmaline_admin")?.value === process.env.ADMIN_PASSWORD;
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { propertyId } = await request.json() as { propertyId?: string };
  if (!propertyId?.trim()) return NextResponse.json({ error: "propertyId is required." }, { status: 400 });
  await saveHospitablePropertyId(propertyId.trim());
  return NextResponse.json({ ok: true });
}
