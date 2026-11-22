// 休み・閉じた時間（docs/spec.md「予約の決まり」「お店の予約帳」）。
// 休みは日付ごと（終日）、閉じた時間は日付＋30分の枠ごと（席は問わず店全体）。
// 保存先は今はメモリ上だけ。サーバーが入れ替わる・再起動すると消える。
import { findMenu, type Menu, SLOT_MINUTES } from "./salon";
import type { Booking } from "./slots";

export type DayClosures = {
  holiday: boolean;
  /** 閉じた枠の開始（0時からの分）。小さい順 */
  slots: number[];
};

export const NO_CLOSURES: DayClosures = { holiday: false, slots: [] };

export interface ClosureStore {
  /** その日（YYYY-MM-DD）の休み・閉じた枠 */
  dayOf(date: string): Promise<DayClosures>;
  setHoliday(date: string, holiday: boolean): Promise<void>;
  closeSlot(date: string, start: number): Promise<void>;
  openSlot(date: string, start: number): Promise<void>;
}

export function createMemoryClosureStore(): ClosureStore {
  const holidays = new Set<string>();
  const slots = new Map<string, Set<number>>();
  return {
    async dayOf(date) {
      return { holiday: holidays.has(date), slots: [...(slots.get(date) ?? [])].sort((a, b) => a - b) };
    },
    async setHoliday(date, holiday) {
      if (holiday) holidays.add(date);
      else holidays.delete(date);
    },
    async closeSlot(date, start) {
      const set = slots.get(date) ?? new Set<number>();
      set.add(start);
      slots.set(date, set);
    },
    async openSlot(date, start) {
      slots.get(date)?.delete(start);
    },
  };
}

const globalForStore = globalThis as unknown as { __closureStore?: ClosureStore };

/** サーバー全体で1つのメモリ上の保存先 */
export function getClosureStore(): ClosureStore {
  globalForStore.__closureStore ??= createMemoryClosureStore();
  return globalForStore.__closureStore;
}

/** その30分の枠が閉じているか（休みの日は全部閉じている） */
export function isSlotClosed(day: DayClosures, slot: number): boolean {
  return day.holiday || day.slots.includes(slot);
}

/** その開始時刻から、メニューの全部の時間（席が埋まる時間）が、休み・閉じた枠と重なるか */
export function isBlocked(day: DayClosures, menu: Menu, start: number): boolean {
  if (day.holiday) return true;
  const end = start + menu.minutes;
  return day.slots.some((s) => s < end && start < s + SLOT_MINUTES);
}

/** その30分の枠に、席の時間がかかる予約があるか */
export function slotHasBooking(bookings: readonly Booking[], date: string, slot: number): boolean {
  return bookings.some((b) => {
    const menu = findMenu(b.menuId);
    return b.date === date && menu !== undefined && b.start < slot + SLOT_MINUTES && slot < b.start + menu.minutes;
  });
}

export type CloseResult = { status: "ok" } | { status: "booked" };

/** 予約が無ければ枠を閉じる。予約があれば閉じない */
export async function closeSlotIfFree(
  store: ClosureStore,
  bookings: readonly Booking[],
  date: string,
  slot: number,
): Promise<CloseResult> {
  if (slotHasBooking(bookings, date, slot)) return { status: "booked" };
  await store.closeSlot(date, slot);
  return { status: "ok" };
}

/** その日に予約が無ければ休みにする。予約があれば休みにしない */
export async function setHolidayIfFree(
  store: ClosureStore,
  bookings: readonly Booking[],
  date: string,
): Promise<CloseResult> {
  if (bookings.some((b) => b.date === date)) return { status: "booked" };
  await store.setHoliday(date, true);
  return { status: "ok" };
}
