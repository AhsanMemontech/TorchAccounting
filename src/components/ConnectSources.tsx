import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ExternalLink } from "lucide-react";

export default function ConnectSources(){
    const [gaConnected, setGaConnected] = useState(false);
    const [adsConnected, setAdsConnected] = useState(false);
    const [digitsConnected, setDigitsConnected] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const checkConnections = async () => {
          setLoading(true);
      
          const businessId = "d7d02229-e428-4221-9610-9c04274d4563";
      
          // ✅ Check Google Analytics
          const { data: gaData, error: gaError } = await supabase
            .from("connected_data_sources")
            .select("access_token, expires_at")
            .eq("business_id", businessId)
            .eq("source", "google_analytics")
            .single();
      
          if (!gaError && gaData) {
            const now = new Date();
            const expiresAt = new Date(gaData.expires_at);
            setGaConnected(expiresAt > now);
          } else {
            setGaConnected(false);
          }
      
          // ✅ Check Google Ads
          const { data: adsData, error: adsError } = await supabase
            .from("connected_data_sources")
            .select("access_token, expires_at")
            .eq("business_id", businessId)
            .eq("source", "google_ads")
            .single();
      
          if (!adsError && adsData) {
            const now = new Date();
            const expiresAt = new Date(adsData.expires_at);
            setAdsConnected(expiresAt > now);
          } else {
            setAdsConnected(false);
          }

          // ✅ Check Digits
          const { data: digitsData, error: digitsError } = await supabase
            .from("digits")
            .select("access_token, expires_at")
            .single();
      
          if (!digitsError && digitsData) {
            const now = new Date();
            const expiresAt = new Date(digitsData.expires_at);
            setDigitsConnected(expiresAt > now);
          } else {
            setDigitsConnected(false);
          }
      
          setLoading(false);
        };
      
        checkConnections();
      }, []);

    const handleDigitsConnect = () => {
      const clientId = process.env.NEXT_PUBLIC_DIGITS_CLIENT_ID;
      const redirectUri = process.env.NEXT_PUBLIC_DIGITS_REDIRECT_URI;

      if (!clientId || !redirectUri) {
        alert("Digits client ID or redirect URI is not set!");
        return;
      }

      const scope = "source:sync ledger:read documents:write";
      const authUrl = `https://connect.digits.com/v1/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
      window.location.href = authUrl;
    };

    if (loading) return <p>Loading data sources...</p>;

    return (
      <div className="mt-4 space-y-6">
        <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Data Sources Connection
        </h3>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          Connect Digits, Google Analytics, and Google Ads to enrich AI CFO insights.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Digits Integration Card */}
          <div className="rounded-xl border p-6 backdrop-blur-md shadow-lg" 
            style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-card)' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Accounting Integration
            </h2>
            
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-5 mb-6">
              <div className="flex justify-center mb-4">
                <img 
                  src="https://ram.digitscpu.com/_astro-assets/digits-logo.DSsydOMk_ZLWrDw.png" 
                  alt="Digits Logo" 
                  className="h-10"
                />
              </div>
              <p className="text-center text-sm text-gray-700 mb-4">
                Connect your account to Digits for seamless accounting integration and financial insights
              </p>
              {digitsConnected ? (
                <div className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-green-600 text-white rounded-md">
                  <span>Connected ✅</span>
                </div>
              ) : (
                <button
                  onClick={handleDigitsConnect}
                  className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Connect to Digits</span>
                </button>
              )}
            </div>
            
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              <p className="mb-2">Benefits of connecting:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Automated bookkeeping</li>
                <li>Real-time financial insights</li>
                <li>Expense tracking</li>
                <li>Tax preparation assistance</li>
              </ul>
            </div>
          </div>

          {/* Google Analytics Card */}
          <div className="rounded-xl border p-6 backdrop-blur-md shadow-lg" 
            style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-card)' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Google Analytics
            </h2>
            
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-5 mb-6">
              <div className="flex justify-center mb-4">
                <svg className="h-10 w-10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </div>
              <p className="text-center text-sm text-gray-700 mb-4">
                Connect Google Analytics to track website performance and user behavior
              </p>
              {gaConnected ? (
                <div className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-green-600 text-white rounded-md">
                  <span>Connected ✅</span>
                </div>
              ) : (
                <button
                  onClick={() => (window.location.href = "/api/google/authorize")}
                  className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Connect Google Analytics</span>
                </button>
              )}
            </div>
            
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              <p className="mb-2">Benefits of connecting:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Website traffic insights</li>
                <li>User behavior analysis</li>
                <li>Conversion tracking</li>
                <li>Performance metrics</li>
              </ul>
            </div>
          </div>

          {/* Google Ads Card */}
          <div className="rounded-xl border p-6 backdrop-blur-md shadow-lg" 
            style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-card)' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Google Ads
            </h2>
            
            <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-lg p-5 mb-6">
              <div className="flex justify-center mb-4">
                <svg className="h-10 w-10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z" fill="#4285F4"/>
                </svg>
              </div>
              <p className="text-center text-sm text-gray-700 mb-4">
                Connect Google Ads to analyze campaign performance and ad spend
              </p>
              {adsConnected ? (
                <div className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-green-600 text-white rounded-md">
                  <span>Connected ✅</span>
                </div>
              ) : (
                <button
                  onClick={() => (window.location.href = "/api/google-ads/authorize")}
                  className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Connect Google Ads</span>
                </button>
              )}
            </div>
            
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              <p className="mb-2">Benefits of connecting:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Campaign performance data</li>
                <li>Ad spend tracking</li>
                <li>ROI analysis</li>
                <li>Keyword insights</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
}