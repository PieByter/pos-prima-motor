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
        if (response.status === 500) {
          setData(null);
          setError(null);
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error(`useFetch error (${url}):`, err);
      setError("Gagal memuat data. Coba lagi.");
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
