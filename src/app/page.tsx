"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from '@/lib/supabaseClient'

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const loginAndRedirect = async () => {
      // Supabase login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: "ahsan@thebeacons.org",
        password: "abcd1234",
      });

      if (error) {
        console.error("Login error:", error.message);
        return;
      }

      console.log("Logged in successfully:", data);

      // Redirect to portal
      router.push("/portal");
    };

    loginAndRedirect();
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <p>Redirecting to Portal...</p>
    </div>
  );
}