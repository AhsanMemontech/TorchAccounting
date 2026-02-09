// /app/api/snapshots/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: Request) {
  const { businessId, periodStart, periodEnd, totalRevenue, totalCOGS, totalExpenses, profit } =
    await req.json();

  const { data, error } = await supabase
    .from('financial_snapshots')
    .insert({
      business_id: businessId,
      period_start: periodStart,
      period_end: periodEnd,
      total_revenue: totalRevenue,
      total_cogs: totalCOGS,
      total_expenses: totalExpenses,
      profit
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}