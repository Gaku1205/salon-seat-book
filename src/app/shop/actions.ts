"use server";

import { redirect } from "next/navigation";
import { getBookingStore } from "@/lib/booking-store";
import { closeSlotIfFree, getClosureStore, setHolidayIfFree } from "@/lib/closures";
import { bookingsOn, inOrder } from "@/lib/reserve";
import { gridTimes } from "@/lib/salon";
import { addOneMonth, isDateString, jstParts, parseTime } from "@/lib/time";
import { isShopOpen } from "./session";

function text(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

/** 操作できる日（今日から1か月先まで）。違えば undefined */
function editableDate(formData: FormData, now: Date): string | undefined {
  const date = text(formData, "date");
  const today = jstParts(now).date;
  return isDateString(date) && date >= today && date <= addOneMonth(today) ? date : undefined;
}

function slotOf(formData: FormData): number | undefined {
  const t = parseTime(text(formData, "time"));
  return t !== undefined && gridTimes().includes(t) ? t : undefined;
}

/** 開いていなければ何もせずログインへ。開いていれば操作できる日を返す */
async function guard(formData: FormData): Promise<{ date: string; now: Date } | undefined> {
  if (!(await isShopOpen())) redirect("/shop/login");
  const now = new Date();
  const date = editableDate(formData, now);
  return date ? { date, now } : undefined;
}

export async function closeSlotAction(formData: FormData): Promise<void> {
  const g = await guard(formData);
  const slot = slotOf(formData);
  if (!g || slot === undefined) redirect("/shop");
  const result = await inOrder(async () =>
    closeSlotIfFree(getClosureStore(), await bookingsOn(getBookingStore(), g.date, g.now), g.date, slot),
  );
  redirect(result.status === "booked" ? `/shop?date=${g.date}&error=slot` : `/shop?date=${g.date}`);
}

export async function openSlotAction(formData: FormData): Promise<void> {
  const g = await guard(formData);
  const slot = slotOf(formData);
  if (!g || slot === undefined) redirect("/shop");
  await inOrder(() => getClosureStore().openSlot(g.date, slot));
  redirect(`/shop?date=${g.date}`);
}

export async function holidayAction(formData: FormData): Promise<void> {
  const g = await guard(formData);
  if (!g) redirect("/shop");
  if (text(formData, "holiday") === "off") {
    await inOrder(() => getClosureStore().setHoliday(g.date, false));
    redirect(`/shop?date=${g.date}`);
  }
  const result = await inOrder(async () =>
    setHolidayIfFree(getClosureStore(), await bookingsOn(getBookingStore(), g.date, g.now), g.date),
  );
  redirect(result.status === "booked" ? `/shop?date=${g.date}&error=day` : `/shop?date=${g.date}`);
}
