import { supabase } from "./supabaseClient";
import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { OAuth2Client } from "google-auth-library";

export type GAReport = {
  sessions: number;
  users: number;
  conversions: number;
  revenue: number;
  startDate: string;
  endDate: string;
};

export type GADeltaReport = {
  current: GAReport;
  previous: GAReport;
  delta: {
    sessions: number;
    sessionsPct: number;
    users: number;
    usersPct: number;
    conversions: number;
    conversionsPct: number;
    revenue: number;
    revenuePct: number;
  };
};

export async function fetchGADataWithDelta(businessId: string): Promise<GADeltaReport | null> {
  if (!businessId) throw new Error("businessId is required");

  // 1️⃣ Get GA connection for this business
  const { data: connection, error } = await supabase
    .from("connected_data_sources")
    .select("*")
    .eq("business_id", businessId)
    .eq("source", "google_analytics")
    .single();

  if (error || !connection) {
    console.error("GA connection not found:", error);
    return null;
  }

  // 2️⃣ OAuth2 client
  const oauthClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauthClient.setCredentials({
    access_token: connection.access_token,
    refresh_token: connection.refresh_token,
    expiry_date: new Date(connection.expires_at).getTime(),
  });

  // 3️⃣ GA client
  const analyticsClient = new BetaAnalyticsDataClient({
    authClient: oauthClient,
  });

  // 4️⃣ Define date ranges
  const now = new Date();
  const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentEnd = now;

  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0); // last day previous month

  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  const currentStartDate = formatDate(currentStart);
  const currentEndDate = formatDate(currentEnd);
  const prevStartDate = formatDate(prevMonth);
  const prevEndDate = formatDate(prevEnd);

  // Helper to fetch GA metrics
  async function fetchMetrics(startDate: string, endDate: string): Promise<GAReport> {
    const [response] = await analyticsClient.runReport({
      property: `properties/${connection.property_id}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "conversions" },
        { name: "purchaseRevenue" }, // revenue metric in GA4
      ],
    });

    const rows = response.rows?.[0]?.metricValues;

    return {
      sessions: Number(rows?.[0]?.value || 0),
      users: Number(rows?.[1]?.value || 0),
      conversions: Number(rows?.[2]?.value || 0),
      revenue: Number(rows?.[3]?.value || 0),
      startDate,
      endDate,
    };
  }

  try {
    const currentData = await fetchMetrics(currentStartDate, currentEndDate);
    const previousData = await fetchMetrics(prevStartDate, prevEndDate);

    console.log("==================");
    console.log("CurrentData:", currentData);
    console.log("PreviousData:", previousData);
    console.log("==================");
    
    // const currentData: GAReport = {
    //   sessions: 1500,
    //   users: 1200,
    //   conversions: 75,
    //   revenue: 25000,
    //   startDate: "2026-01-01",
    //   endDate: "2026-01-28",
    // };
  
    // const previousData: GAReport = {
    //   sessions: 3000,
    //   users: 2500,
    //   conversions: 150,
    //   revenue: 50000,
    //   startDate: "2025-12-01",
    //   endDate: "2025-12-30",
    // };

    // 5️⃣ Calculate delta
    const delta = {
      sessions: currentData.sessions - previousData.sessions,
      sessionsPct: previousData.sessions ? ((currentData.sessions - previousData.sessions) / previousData.sessions) * 100 : 0,
      users: currentData.users - previousData.users,
      usersPct: previousData.users ? ((currentData.users - previousData.users) / previousData.users) * 100 : 0,
      conversions: currentData.conversions - previousData.conversions,
      conversionsPct: previousData.conversions ? ((currentData.conversions - previousData.conversions) / previousData.conversions) * 100 : 0,
      revenue: currentData.revenue - previousData.revenue,
      revenuePct: previousData.revenue ? ((currentData.revenue - previousData.revenue) / previousData.revenue) * 100 : 0,
    };

    return { current: currentData, previous: previousData, delta };
  } catch (err) {
    console.error("Failed to fetch GA data:", err);
    return null;
  }
}