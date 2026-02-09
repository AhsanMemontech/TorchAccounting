import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/google-ads/callback` // make sure this matches your callback route
    );

    const scopes = [
      "https://www.googleapis.com/auth/adwords" // Google Ads scope
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: "offline", // get refresh token
      prompt: "consent",
      scope: scopes,
      state: "d7d02229-e428-4221-9610-9c04274d4563", // pass your businessId dynamically
    });

    return NextResponse.redirect(url);
  } catch (err) {
    console.error("Google Ads authorize error:", err);
    return NextResponse.json({ error: "Failed to generate OAuth URL" }, { status: 500 });
  }
}