import { GoogleAdsApi } from "google-ads-api";
import { supabase } from "@/lib/supabaseClient";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json({ error: "businessId required" }, { status: 400 });
    }

    // 1️⃣ Get OAuth tokens and customer_id from Supabase
    const { data } = await supabase
      .from("connected_data_sources")
      .select("*")
      .eq("business_id", businessId)
      .eq("source", "google_ads")
      .single();

    if (!data) {
      return NextResponse.json({ error: "Google Ads not connected" }, { status: 401 });
    }

    // 2️⃣ Create Google Ads client (MVP)
    const client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      developer_token: process.env.GOOGLE_ADS_API_DEVELOPER_TOKEN! // works for MVP with user OAuth only
    });
    // console.log('-==================')
    // var cust = await client.listAccessibleCustomers(data.refresh_token)
    // var cust_id = cust.resource_names[0].split('/')[1];
    // console.log(cust_id)
    // console.log('-==================')
    const customer = client.Customer({
      customer_id: "4850380525",
      refresh_token: data.refresh_token,
      //login_customer_id: cust_id
    });

    // 3️⃣ Query last 30 days metrics
    const rows = await customer.query(`
      SELECT metrics.cost_micros, metrics.clicks, metrics.impressions
      FROM customer
      WHERE segments.date DURING LAST_30_DAYS
    `);

    // 4️⃣ Aggregate metrics
    const totals = rows.reduce((acc, { metrics }) => {
        acc.spend += metrics?.cost_micros ? metrics.cost_micros / 1_000_000 : 0;
        acc.clicks += metrics?.clicks ?? 0;
        acc.impressions += metrics?.impressions ?? 0;
        return acc;
      }, { spend: 0, clicks: 0, impressions: 0 }
    );

    // 5️⃣ Return structured data
    return NextResponse.json({
      current: totals,
      previous: { spend: 0, clicks: 0, impressions: 0 }, // TODO: implement prev month
      delta: {
        spend: totals.spend,
        spendPct: 0,
        clicks: totals.clicks,
        clicksPct: 0,
        impressions: totals.impressions,
        impressionsPct: 0
      }
    });

  } catch (err) {
    console.error("Google Ads route error:", err);
    return NextResponse.json({ error: "Failed to fetch Google Ads data" }, { status: 500 });
  }
}