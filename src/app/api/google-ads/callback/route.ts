import { google } from "googleapis";
import { supabase } from "@/lib/supabaseClient";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get("code");
    const businessId = "d7d02229-e428-4221-9610-9c04274d4563";

    if (!code) {
      return NextResponse.json({ error: "Missing code" }, { status: 400 });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/google-ads/callback`
    );

    // Exchange code for tokens
    console.log("Code", code);
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    //console.log("tokens", tokens);
    // 1️⃣ Check if record already exists
    const { data: existing, error: selectError } = await supabase
      .from("connected_data_sources")
      .select("*")
      .eq("business_id", businessId)
      .eq("source", "google_ads")
      .maybeSingle();

      //console.log("data", existing);
    if (selectError && selectError.code !== "PGRST116") { // PGRST116 = no rows found
      console.error("Supabase select error:", selectError);
      return NextResponse.json({ error: "Failed to check existing connection" }, { status: 500 });
    }

    if (existing) {
        // Update existing row
        const { error: updateError } = await supabase
        .from("connected_data_sources")
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: tokens.expiry_date ? new Date(tokens.expiry_date) : null
        })
        .eq("id", existing.id);

      if (updateError) {
        console.error(updateError);
        return NextResponse.json({ error: "Failed to update tokens" }, { status: 500 });
      }
    } else {
      // 2️⃣ Insert new record
      const { data, error: insertError } = await supabase.from("connected_data_sources").insert({
        business_id: businessId,
        source: "google_ads",
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expiry_date ? new Date(tokens.expiry_date) : null
      });
  
      if (insertError) {
        console.error("Supabase insert error:", insertError);
        return NextResponse.json({ error: "Failed to save Google Ads data" }, { status: 500 });
      }
    }


    //return NextResponse.json({ message: "Google Ads connected successfully!", data });

    return NextResponse.redirect(new URL("/portal", process.env.NEXT_PUBLIC_APP_URL));
  } catch (err) {
    console.error("Google Ads OAuth callback error:", err);
    return NextResponse.json({ error: "Failed to connect Google Ads" }, { status: 500 });
  }
}