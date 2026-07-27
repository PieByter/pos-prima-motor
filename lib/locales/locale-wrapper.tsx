"use client";

import type { ReactNode } from "react";
import { I18nProvider, type LocaleCode } from "./index";
import idDict from "./id_ID";
import enDict from "./en_US";

const dictionaries: Record<LocaleCode, typeof idDict> = {
  id: idDict,
  en: enDict,
};

export function LocaleWrapper({ children }: { children: ReactNode }) {
  return (
    <I18nProvider dictionaries={dictionaries} defaultLocale="id">
      {children}
    </I18nProvider>
  );
}
