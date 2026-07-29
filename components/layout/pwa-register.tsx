"use client";

import { useEffect } from "react";

/**
 * Registers the PWA service worker on the client side.
 * Must be called once in the root layout.
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

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
