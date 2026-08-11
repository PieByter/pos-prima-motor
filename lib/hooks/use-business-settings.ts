"use client";

import { useEffect, useState } from "react";
import type { BusinessSettings } from "@/lib/services/business-settings.service";

const DEFAULTS: BusinessSettings = {
    id: 0,
    shop_name: "Prima Motor",
    shop_address: null,
    shop_phone: null,
    whatsapp_number: null,
    tax_percent: 11,
    low_stock_threshold: 5,
    receipt_footer: null,
    updated_by: null,
    updated_at: new Date().toISOString(),
};

let cache: BusinessSettings | null = null;
let inFlight: Promise<BusinessSettings> | null = null;

/** Ambil pengaturan bisnis (client-side, dengan cache sederhana). */
function loadSettings(): Promise<BusinessSettings> {
    if (cache) return Promise.resolve(cache);
    if (!inFlight) {
        inFlight = fetch("/api/business-settings", { cache: "no-store" })
            .then((r) => (r.ok ? r.json() : DEFAULTS))
            .then((data) => {
                cache = data as BusinessSettings;
                return cache;
            })
            .catch(() => DEFAULTS);
    }
    return inFlight;
}

/** Hook: pengaturan bisnis (PPN, nama toko, dll). */
export function useBusinessSettings() {
    const [settings, setSettings] = useState<BusinessSettings>(DEFAULTS);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        loadSettings().then((data) => {
            if (!cancelled) {
                setSettings(data);
                setLoading(false);
            }
        });
        return () => {
            cancelled = true;
        };
    }, []);

    return { settings, loading, refresh: () => { cache = null; inFlight = null; } };
}

/** Untuk server components — fetch sekali via admin client. */
export { getBusinessSettings } from "@/lib/services/business-settings.service";
