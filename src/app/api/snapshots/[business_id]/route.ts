// /app/api/snapshots/[businessId]/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(req: Request, { params }: { params: { businessId: string } }) {
  const { data, error } = await supabase
    .from('financial_snapshots')
    .select('*')
    .eq('business_id', params.businessId)
    .order('period_start', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}