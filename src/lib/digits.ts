// lib/digits.ts
import { supabase } from '@/lib/supabaseClient';
import axios from 'axios';

interface DigitsToken {
  access_token: string;
  refresh_token: string;
  expires_at: string; // timestamptz from Supabase
  token_type: string;
  scope: string;
}

// Digits OAuth config
const DIGITS_CLIENT_ID = process.env.NEXT_PUBLIC_DIGITS_CLIENT_ID!;
const DIGITS_CLIENT_SECRET = process.env.DIGITS_CLIENT_SECRET!;
const DIGITS_TOKEN_URL = 'https://api.digits.com/oauth/token'; // replace with actual URL

/**
 * Refreshes the access token using refresh_token
 */
async function refreshToken(refreshToken: string): Promise<DigitsToken> {
  const response = await axios.post(DIGITS_TOKEN_URL, {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: DIGITS_CLIENT_ID,
    client_secret: DIGITS_CLIENT_SECRET,
  });

  const data = response.data;

  const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();

  const token: DigitsToken = {
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? refreshToken, // fallback if not returned
    expires_at: expiresAt,
    token_type: data.token_type,
    scope: data.scope,
  };

  // Save updated token to Supabase
  await supabase.from('digits').upsert(token);

  return token;
}

/**
 * Returns a valid access token, refreshing if necessary
 */
export async function getDigitsToken(): Promise<string> {
  const { data, error } = await supabase
    .from('digits')
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to fetch Digits token: ${error.message}`);
  }

  if (!data) {
    throw new Error('No Digits token found in database.');
  }

  const now = new Date();
  const expiresAt = new Date(data.expires_at);

  if (now >= expiresAt) {
    // Token expired → refresh
    const refreshed = await refreshToken(data.refresh_token);
    return refreshed.access_token;
  }

  // Token still valid
  return data.access_token;
}