import { NextRequest, NextResponse } from "next/server";
import { fetchGADataWithDelta } from "@/lib/googleAnalytics";

export async function GET(req: NextRequest) {
  const businessId = req.nextUrl.searchParams.get("businessId");
  if (!businessId) return NextResponse.json({ error: "Missing businessId" }, { status: 400 });

  const gaData = await fetchGADataWithDelta(businessId);
  return NextResponse.json(gaData);
}