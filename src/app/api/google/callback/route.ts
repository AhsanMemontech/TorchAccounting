import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "No code" }, { status: 400 });

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: "authorization_code"
    })
  });

  const tokens = await tokenRes.json();

  const res = await fetch(
    `https://analyticsadmin.googleapis.com/v1beta/properties?filter=parent:accounts/382245694`,
    {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    }
  );
  const properties = await res.json();
  const propertyId = properties[0]?.name.split("/")[1]; // first property  

  // TODO: get businessId from session or auth
  const businessId = "d7d02229-e428-4221-9610-9c04274d4563";
  const source = "google_analytics";

  // Check if row exists
  const { data: existing, error: selectError } = await supabase
    .from("connected_data_sources")
    .select("id")
    .eq("business_id", businessId)
    .eq("source", source)
    .maybeSingle();

  if (selectError && selectError.code !== "PGRST116") {
    // Unexpected error
    console.error(selectError);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  if (existing) {
    // Update existing row
    const { error: updateError } = await supabase
      .from("connected_data_sources")
      .update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000),
        property_id: propertyId
      })
      .eq("id", existing.id);

    if (updateError) {
      console.error(updateError);
      return NextResponse.json({ error: "Failed to update tokens" }, { status: 500 });
    }
  } else {
    // Insert new row
    const { error: insertError } = await supabase.from("connected_data_sources").insert({
      business_id: businessId,
      source,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000),
      property_id: propertyId
    });

    if (insertError) {
      console.error(insertError);
      return NextResponse.json({ error: "Failed to insert tokens" }, { status: 500 });
    }
  }

  // Redirect to portal
  return NextResponse.redirect(new URL("/portal", process.env.NEXT_PUBLIC_APP_URL));
}