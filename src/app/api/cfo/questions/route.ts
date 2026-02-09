// /api/cfo/questions/route.ts
import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"

export async function POST(req: NextRequest) {
  const { businessId, questions } = await req.json()

  const inserts = questions.map((q: any) => ({
    id: q.id,
    business_id: businessId,
    title: q.title,
    message: q.message,
    related_metrics: q.relatedMetrics
  }))

  const { error } = await supabase
    .from("cfo_questions")
    .upsert(inserts, { onConflict: "id" })

  if (error) {
    return NextResponse.json({ error }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function PATCH(req: NextRequest) {
    const { id, answer } = await req.json()
  
    const { error } = await supabase
      .from("cfo_questions")
      .update({
        answer,
        status: "answered",
        answered_at: new Date().toISOString()
      })
      .eq("id", id)
  
    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }
  
    return NextResponse.json({ success: true })
}  