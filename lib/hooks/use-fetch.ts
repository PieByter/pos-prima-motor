"use client";

import { useEffect, useState, useCallback } from "react";

interface UseFetchResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Lightweight data-fetching hook that eliminates repetitive
 * useEffect + useState + try/catch boilerplate across dashboard components.
 */
export function useFetch<T>(url: string | null): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!url) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        let errMsg: string;
        try {
          const parsed = JSON.parse(errText);
          errMsg = parsed?.error ?? `HTTP ${response.status}`;
        } catch {
          errMsg = errText || `HTTP ${response.status}`;
        }
        throw new Error(errMsg);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error(`useFetch error (${url}):`, err);
      setError(err instanceof Error ? err.message : "Gagal memuat data. Coba lagi.");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}
