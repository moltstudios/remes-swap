"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return; // skip in dev to avoid stale caches
    navigator.serviceWorker
      .register("/sw.js")
      .catch((err) => console.warn("[SW] registration failed:", err));
  }, []);
  return null;
}