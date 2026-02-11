import { NextRequest, NextResponse } from "next/server";
import { generateSignals } from "@/lib/intelligence/signalEngine";

export async function GET(req: NextRequest) {
    const businessId = req.nextUrl.searchParams.get("businessId");
    if (!businessId) {
        return NextResponse.json({ error: "Missing businessId" }, { status: 400 });
    }

    try {
        const signals = await generateSignals(businessId);
        return NextResponse.json(signals);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed to generate signals" }, { status: 500 });
    }
}