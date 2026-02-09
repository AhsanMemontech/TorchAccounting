// /api/cfo/answers.route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  const { businessId, insightId, answer } = await req.json();
  if (!businessId || !insightId || !answer) return NextResponse.json({ error: "Missing data" }, { status: 400 });

  const { data, error } = await supabase.from("cfo_insight_answers")
  .upsert({ business_id: businessId, insight_id: insightId, answer });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}