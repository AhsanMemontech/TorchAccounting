import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { supabase } from "@/lib/supabaseClient";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code } = req.body;

  if (!code) return res.status(400).json({ error: "Code missing" });

  try {
    const response = await axios.post(
      "https://connect.digits.com/v1/oauth/token",
      {
        grant_type: "authorization_code",
        code,
        client_id: process.env.DIGITS_CLIENT_ID,
        client_secret: process.env.DIGITS_CLIENT_SECRET,
        redirect_uri: process.env.DIGITS_REDIRECT_URI,
      }
    );
  
    const { access_token, refresh_token, expires_in, token_type, scope } =
      response.data;
  
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    const { error } = await supabase
      .from("digits")
      .upsert({
        id: 1,
        access_token,
        refresh_token,
        expires_in: expiresAt, // convert to timestampz
        token_type,
        scope,
      });
  
    if (error) throw error;
  
    res.status(200).json({ success: true });
  } catch (err: any) {
    console.error("Exchange token error:", err.response?.data || err.message || err);
    res.status(500).json({ error: "Failed to exchange code", details: err.response?.data });
  }  
}