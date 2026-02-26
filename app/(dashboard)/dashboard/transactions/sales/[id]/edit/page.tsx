"use client";

import { useParams, notFound } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import {
  TransactionForm,
  type TransactionFormData,
  type FormLineItem,
} from "@/components/transactions/transaction-form";
import { dummySaleInvoices } from "@/lib/data/invoice-details";
import { dummyUsers } from "@/lib/data/users";

export default function EditSalePage() {
  const params = useParams<{ id: string }>();
  const invoice = dummySaleInvoices[Number(params.id)];

  if (!invoice) {
    notFound();
  }

  // Map mechanic name to mechanic user id
  const mechanic = dummyUsers.find(
    (u) => u.role === "Mekanik" && u.name === invoice.mechanicName
  );

  const initialData: TransactionFormData = {
    customer: invoice.entityName,
    mechanicId: mechanic?.id ?? null,
    date: invoice.createdAt.split(" ")[0], // extract date part
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
        serviceFee: item.type === "Service" ? item.unitPrice : 0,
        subtotal: item.subtotal,
      })
    ),
  };

  return (
    <>
      <Navbar
        title="Edit Penjualan"
        subtitle={`Edit invoice ${invoice.invoiceNumber}`}
      />
      <TransactionForm
        type="sale"
        initialData={initialData}
        transactionId={invoice.invoiceNumber}
      />
    </>
  );
}
