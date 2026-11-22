import { describe, expect, it } from "vitest";
import { createMemoryStore } from "./booking-store";
import {
  closeSlotIfFree,
  createMemoryClosureStore,
  isBlocked,
  isSlotClosed,
  setHolidayIfFree,
  slotHasBooking,
} from "./closures";
import { bookingsOn, findAssignment, reserve, type Selection } from "./reserve";
import { findMenu, type Menu } from "./salon";
import { availableStarts, type Booking } from "./slots";

// 日本の時刻 2026-11-22 08:00
const now = new Date("2026-11-21T23:00:00Z");
const DAY = "2026-11-25"; // 見本の予約が無い日
const customer = { name: "山田 花子", phone: "09012345678", email: "a@example.com" };
const menu = (id: string): Menu => {
  const m = findMenu(id);
  if (!m) throw new Error(id);
  return m;
};
const sel = (over: Partial<Selection> = {}): Selection => ({
  menu: menu("cut"),
  staff: "any",
  date: DAY,
  start: 12 * 60,
  ...over,
});

describe("isBlocked・isSlotClosed", () => {
  it("休みの日は、どの時刻も閉じている", () => {
    const day = { holiday: true, slots: [] };
    expect(isBlocked(day, menu("cut"), 10 * 60)).toBe(true);
    expect(isSlotClosed(day, 18 * 60 + 30)).toBe(true);
  });
  it("閉じた枠と、メニューの全部の時間が重なる開始時刻は閉じている", () => {
    const day = { holiday: false, slots: [12 * 60] };
    // カット60分：11:30・12:00 は重なる。11:00・12:30 は重ならない
    expect(isBlocked(day, menu("cut"), 11 * 60)).toBe(false);
    expect(isBlocked(day, menu("cut"), 11 * 60 + 30)).toBe(true);
    expect(isBlocked(day, menu("cut"), 12 * 60)).toBe(true);
    expect(isBlocked(day, menu("cut"), 12 * 60 + 30)).toBe(false);
    // カラー90分は放置中も席を使うので、11:00 からも入れない
    expect(isBlocked(day, menu("color"), 11 * 60)).toBe(true);
    expect(isBlocked(day, menu("color"), 10 * 60 + 30)).toBe(false);
    expect(isSlotClosed(day, 12 * 60)).toBe(true);
    expect(isSlotClosed(day, 12 * 60 + 30)).toBe(false);
  });
});

describe("availableStarts に閉じた時間を反映する", () => {
  const q = { menuId: "cut" as const, staff: "any" as const, date: DAY, now, bookings: [] };
  it("閉じた枠に重なる開始時刻は空きに出ない", () => {
    const starts = availableStarts({ ...q, closures: { holiday: false, slots: [12 * 60] } });
    expect(starts).not.toContain(11 * 60 + 30);
    expect(starts).not.toContain(12 * 60);
    expect(starts).toContain(11 * 60);
    expect(starts).toContain(12 * 60 + 30);
  });
  it("休みの日は空きが無い", () => {
    expect(availableStarts({ ...q, closures: { holiday: true, slots: [] } })).toEqual([]);
  });
  it("開けると、また空きに出る", async () => {
    const cs = createMemoryClosureStore();
    await cs.closeSlot(DAY, 12 * 60);
    await cs.setHoliday(DAY, true);
    expect(availableStarts({ ...q, closures: await cs.dayOf(DAY) })).toEqual([]);
    await cs.setHoliday(DAY, false);
    expect(availableStarts({ ...q, closures: await cs.dayOf(DAY) })).not.toContain(12 * 60);
    await cs.openSlot(DAY, 12 * 60);
    expect(availableStarts({ ...q, closures: await cs.dayOf(DAY) })).toContain(12 * 60);
    expect(availableStarts({ ...q, closures: await cs.dayOf(DAY) })).toEqual(availableStarts(q));
  });
});

describe("findAssignment・reserve に閉じた時間を反映する", () => {
  it("閉じた枠・休みの日は、確定の直前の確認で入れない", async () => {
    const store = createMemoryStore();
    const cs = createMemoryClosureStore();
    await cs.closeSlot(DAY, 12 * 60);
    expect(await findAssignment(store, sel(), now, cs)).toBeUndefined();
    expect(await findAssignment(store, sel({ start: 11 * 60 + 30 }), now, cs)).toBeUndefined();
    expect(await findAssignment(store, sel({ start: 12 * 60 + 30 }), now, cs)).toBeDefined();
    expect((await reserve(store, sel(), customer, now, cs)).status).toBe("full");
    expect(await store.listByDate(DAY)).toEqual([]);

    await cs.setHoliday(DAY, true);
    expect(await findAssignment(store, sel({ start: 15 * 60 }), now, cs)).toBeUndefined();
  });
  it("開けると、また入れる", async () => {
    const store = createMemoryStore();
    const cs = createMemoryClosureStore();
    await cs.closeSlot(DAY, 12 * 60);
    await cs.openSlot(DAY, 12 * 60);
    await cs.setHoliday(DAY, true);
    await cs.setHoliday(DAY, false);
    expect(await findAssignment(store, sel(), now, cs)).toBeDefined();
    expect((await reserve(store, sel(), customer, now, cs)).status).toBe("ok");
  });
});

describe("予約が入っている枠・日は閉じられない", () => {
  const cut: Booking = { menuId: "cut", staffId: "a", seatId: 1, date: DAY, start: 12 * 60 };
  it("予約の席の時間がかかる枠は、予約がある", () => {
    expect(slotHasBooking([cut], DAY, 12 * 60)).toBe(true);
    expect(slotHasBooking([cut], DAY, 12 * 60 + 30)).toBe(true);
    expect(slotHasBooking([cut], DAY, 11 * 60 + 30)).toBe(false);
    expect(slotHasBooking([cut], DAY, 13 * 60)).toBe(false);
    expect(slotHasBooking([cut], "2026-11-26", 12 * 60)).toBe(false);
  });
  it("予約がある枠は閉じず、無い枠は閉じる", async () => {
    const cs = createMemoryClosureStore();
    expect(await closeSlotIfFree(cs, [cut], DAY, 12 * 60 + 30)).toEqual({ status: "booked" });
    expect((await cs.dayOf(DAY)).slots).toEqual([]);
    expect(await closeSlotIfFree(cs, [cut], DAY, 13 * 60)).toEqual({ status: "ok" });
    expect((await cs.dayOf(DAY)).slots).toEqual([13 * 60]);
  });
  it("予約がある日は休みにせず、無い日は休みにする", async () => {
    const cs = createMemoryClosureStore();
    expect(await setHolidayIfFree(cs, [cut], DAY)).toEqual({ status: "booked" });
    expect((await cs.dayOf(DAY)).holiday).toBe(false);
    expect(await setHolidayIfFree(cs, [], DAY)).toEqual({ status: "ok" });
    expect((await cs.dayOf(DAY)).holiday).toBe(true);
  });
  it("保存した予約も見本の予約も数える", async () => {
    const store = createMemoryStore();
    expect((await reserve(store, sel(), customer, now)).status).toBe("ok");
    const cs = createMemoryClosureStore();
    const bookings = await bookingsOn(store, DAY, now);
    expect(await closeSlotIfFree(cs, bookings, DAY, 12 * 60)).toEqual({ status: "booked" });
    // 見本：明日（11/23）10:00 のカット
    const tomorrow = await bookingsOn(store, "2026-11-23", now);
    expect(await setHolidayIfFree(cs, tomorrow, "2026-11-23")).toEqual({ status: "booked" });
  });
});
