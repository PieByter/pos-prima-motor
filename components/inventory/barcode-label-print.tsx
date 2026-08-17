"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { formatRupiah } from "@/lib/data/items";
import { useLocale } from "@/lib/locales";

export type BarcodeLabelItem = {
  id: number;
  name: string;
  sku?: string | null;
  selling_price?: number;
};

/** Render barcode CODE128 ke SVG via jsbarcode. */
function BarcodeSvg({ value }: { value: string }) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (ref.current && value) {
      try {
        JsBarcode(ref.current, value, {
          format: "CODE128",
          displayValue: false,
          height: 38,
          width: 2,
          margin: 0,
        });
      } catch {
        // SKU kosong / format tidak valid — biarkan area barcode kosong
      }
    }
  }, [value]);

  return <svg ref={ref} className="max-w-full" />;
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: BarcodeLabelItem[];
};

export function BarcodeLabelPrint({ open, onOpenChange, items }: Props) {
  const { t } = useLocale();

  const handlePrint = () => {
    document.body.classList.add("printing-barcode-labels");
    window.print();
    document.body.classList.remove("printing-barcode-labels");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <DialogTitle>{t("inventory.printBarcode")}</DialogTitle>
              <DialogDescription>
                {t("inventory.printBarcodeDesc", { count: items.length })}
              </DialogDescription>
            </div>
            <Button variant="outline" className="gap-2 shrink-0" onClick={handlePrint}>
              <Printer className="h-4 w-4" /> {t("common.print")}
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4">
          {items.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">{t("common.noData")}</p>
          ) : (
            <div className="barcode-labels-print grid grid-cols-2 sm:grid-cols-3 gap-3">
              {items.map((item) => {
                const code = item.sku || `ID-${item.id}`;
                return (
                  <div
                    key={item.id}
                    className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-center"
                  >
                    <p className="text-[10px] font-bold uppercase leading-tight text-slate-800 dark:text-white line-clamp-2">
                      {item.name}
                    </p>
                    <div className="mx-auto flex justify-center my-1">
                      <BarcodeSvg value={code} />
                    </div>
                    <p className="text-[10px] font-mono text-slate-500">{code}</p>
                    {item.selling_price != null && (
                      <p className="mt-0.5 text-[11px] font-bold text-slate-800 dark:text-white">
                        {formatRupiah(item.selling_price)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
