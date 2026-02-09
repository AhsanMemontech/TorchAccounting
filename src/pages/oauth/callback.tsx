// // pages/callback.tsx
// import { useRouter } from "next/router";
// import { useEffect } from "react";
// import axios from "axios";

// export default function Callback() {
//   const router = useRouter();

//   useEffect(() => {
//     const code = router.query.code as string | undefined;
//     if (!code) return;

//     axios
//       .post("/api/exchange-token", { code })
//       .then(() => router.push("/"))
//       .catch((err: unknown) => {
//         console.error(err);
//       });
//   }, [router.query]);

//   return <p>Processing OAuth...</p>;
// }

// pages/callback.tsx
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";
import axios from "axios";

export default function Callback() {
  const router = useRouter();
  const hasExchanged = useRef(false);

  useEffect(() => {
    const code = router.query.code as string | undefined;

    if (!code) return;
    if (hasExchanged.current) return;

    hasExchanged.current = true;

    axios
      .post("/api/exchange-token", { code })
      .then(() => {
        router.replace("/"); // replace prevents back-button reuse
      })
      .catch((err) => {
        console.error("OAuth exchange failed:", err);
        router.replace("/"); // fail gracefully
      });
  }, [router.query.code]);

  return <p>Processing OAuth…</p>;
}
