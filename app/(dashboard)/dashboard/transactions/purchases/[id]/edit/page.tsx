"use client";

import { useParams, notFound } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import {
  TransactionForm,
  type TransactionFormData,
  type FormLineItem,
} from "@/components/transactions/transaction-form";
import { dummyPurchaseInvoices } from "@/lib/data/invoice-details";

export default function EditPurchasePage() {
  const params = useParams<{ id: string }>();
  const invoice = dummyPurchaseInvoices[Number(params.id)];

  if (!invoice) {
    notFound();
  }

  const initialData: TransactionFormData = {
    customer: invoice.entityName,
    mechanicId: null,
    date: invoice.createdAt.split(" ")[0],
    notes: "",
    items: invoice.items.map(
      (item, idx): FormLineItem => ({
        key: idx + 1,
        itemId: null,
        name: item.name,
        qty: item.qty,
        unitPrice: item.unitPrice,
        discountPercent: item.discount > 0
          ? Math.round((item.discount / (item.unitPrice * item.qty)) * 100)
          : 0,
        serviceFee: 0,
        subtotal: item.subtotal,
      })
    ),
  };

  return (
    <>
      <Navbar
        title="Edit Pembelian"
        subtitle={`Edit invoice ${invoice.invoiceNumber}`}
      />
      <TransactionForm
        type="purchase"
        initialData={initialData}
        transactionId={invoice.invoiceNumber}
      />
    </>
  );
}
