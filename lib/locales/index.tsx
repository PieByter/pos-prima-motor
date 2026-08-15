"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

/* ──────────────────────────────────────────────────────────────── */
/*  Type                                                           */
/* ──────────────────────────────────────────────────────────────── */

export type LocaleDict = {
    app: { name: string; tagline: string };
    common: Record<string, string>;
    auth: Record<string, string>;
    nav: Record<string, string>;
    dashboard: Record<string, string>;
    masterData: Record<string, string>;
    transactions: Record<string, string>;
    inventory: Record<string, string>;
    discounts: Record<string, string>;
    expenses: Record<string, string>;
    activityLog: Record<string, string>;
    reports: Record<string, string>;
    settings: Record<string, string>;
    notifications: Record<string, string>;
    receipt: Record<string, string>;
    scanner: Record<string, string>;
    errors: Record<string, string>;
    mechanic: Record<string, string>;
    purchaseOrders: Record<string, string>;
    appointments: Record<string, string>;
    salary: Record<string, string>;
    stockAdjustments: Record<string, string>;
    warrantyClaims: Record<string, string>;
    vehicleDocuments: Record<string, string>;
    time: Record<string, string>;
    months: Record<string, string>;
    weekdays: Record<string, string>;
};

export type LocaleCode = "id" | "en";

/* ──────────────────────────────────────────────────────────────── */
/*  Context                                                        */
/* ──────────────────────────────────────────────────────────────── */

type I18nContextType = {
    locale: LocaleCode;
    setLocale: (code: LocaleCode) => void;
    t: (path: string, vars?: Record<string, string | number>) => string;
    dir: "ltr" | "rtl";
};

const I18nContext = createContext<I18nContextType>({
    locale: "id",
    setLocale: () => { },
    t: (path: string) => path,
    dir: "ltr",
});

/* ──────────────────────────────────────────────────────────────── */
/*  Provider                                                       */
/* ──────────────────────────────────────────────────────────────── */

interface I18nProviderProps {
    children: ReactNode;
    dictionaries: Record<LocaleCode, LocaleDict>;
    defaultLocale?: LocaleCode;
}

export function I18nProvider({
    children,
    dictionaries,
    defaultLocale = "id",
}: I18nProviderProps) {
    const [locale, setLocaleState] = useState<LocaleCode>(() => {
        if (typeof window === "undefined") return defaultLocale;
        const saved = localStorage.getItem("locale") as LocaleCode | null;
        return saved && dictionaries[saved] ? saved : defaultLocale;
    });
    const [mounted, setMounted] = useState(false);
    const dict = dictionaries[locale] ?? dictionaries[defaultLocale];

    // Load saved preference after mount
    useEffect(() => {
        const t = window.setTimeout(() => {
            setMounted(true);
        }, 0);
        return () => window.clearTimeout(t);
    }, []);

    const setLocale = useCallback(
        (code: LocaleCode) => {
            if (!dictionaries[code]) return;
            setLocaleState(code);
            localStorage.setItem("locale", code);
            document.documentElement.lang = code === "id" ? "id" : "en";
        },
        [dictionaries],
    );

    /**
     * Translate a dot-notation key path, e.g. `t("common.save")` → "Simpan"
     * Supports simple variable interpolation: `t("common.confirmBulkDelete", { count: 5 })`
     */
    const t = useCallback(
        (path: string, vars?: Record<string, string | number>): string => {
            const keys = path.split(".");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let value: any = dict;
            for (const key of keys) {
                if (value == null) return path;
                value = value[key as keyof typeof value];
            }
            if (typeof value !== "string") return path;
            if (!vars) return value;

            let result = value;
            for (const [k, v] of Object.entries(vars)) {
                result = result.replace(`{${k}}`, String(v));
            }
            return result;
        },
        [dict],
    );

    // Prevent hydration mismatch
    if (!mounted) {
        return (
            <I18nContext.Provider value= {{ locale: defaultLocale, setLocale, t, dir: "ltr" }
    }>
        { children }
        </I18nContext.Provider>
    );
}

return (
    <I18nContext.Provider value= {{ locale, setLocale, t, dir: "ltr" }}>
        { children }
        </I18nContext.Provider>
  );
}

/* ──────────────────────────────────────────────────────────────── */
/*  Hook                                                           */
/* ──────────────────────────────────────────────────────────────── */

export function useLocale() {
    return useContext(I18nContext);
}
