"use server";

import { redirect } from "next/navigation";
import { getBookingStore } from "@/lib/booking-store";
import { type CustomerErrors, validateCustomer } from "@/lib/customer";
import { parseSelection, reserve } from "@/lib/reserve";

export type ConfirmState = {
  status: "idle" | "invalid" | "full";
  errors: CustomerErrors;
  values: { name: string; phone: string; email: string };
};

function text(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

export async function confirmReservation(_prev: ConfirmState, formData: FormData): Promise<ConfirmState> {
  const values = { name: text(formData, "name"), phone: text(formData, "phone"), email: text(formData, "email") };
  const sel = parseSelection({
    menu: text(formData, "menu"),
    staff: text(formData, "staff"),
    date: text(formData, "date"),
    time: text(formData, "time"),
  });
  // 選んだ内容が読めない（URLを作り替えた等）。選び直しの案内を出す
  if (!sel) return { status: "full", errors: {}, values };

  const checked = validateCustomer(values);
  if (!checked.ok) return { status: "invalid", errors: checked.errors, values };

  const result = await reserve(getBookingStore(), sel, checked.customer);
  if (result.status === "full") return { status: "full", errors: {}, values };
  redirect(`/reserve/done?id=${encodeURIComponent(result.booking.id)}`);
}
