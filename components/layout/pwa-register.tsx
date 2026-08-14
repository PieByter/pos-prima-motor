"use client";

import { useEffect } from "react";

/**
 * Registers the PWA service worker on the client side.
 * Must be called once in the root layout.
 *
 * NOTE: Hanya didaftarkan di production. Di development service worker
 * cache-first bikin halaman dev tampil stale/broken (mis. localhost:3000
 * gagal padahal 192.168.x.x jalan) karena HTML lama tersaji dari cache.
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // Jangan daftarkan SW di development (NODE_ENV !== 'production')
    if (process.env.NODE_ENV !== "production") return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        console.log("PWA Service Worker registered:", registration.scope);
      })
      .catch((err) => {
        console.warn("PWA Service Worker registration failed:", err);
      });
  }, []);

  return null;
}
