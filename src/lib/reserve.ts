// 予約の確定（docs/spec.md「予約の確定」）。確定の直前にもう一度空きを確かめる。
import type { BookingStore, StoredBooking } from "./booking-store";
import { type ClosureStore, isBlocked } from "./closures";
import type { Customer } from "./customer";
import {
  findMenu,
  isStaffChoice,
  type Menu,
  startTimes,
  type StaffChoice,
  type StaffId,
  type SeatId,
} from "./salon";
import { sampleBookings } from "./sampleBookings";
import { assign, type Booking, isBookableTime } from "./slots";
import { isDateString, jstParts, parseTime } from "./time";

export type Selection = { menu: Menu; staff: StaffChoice; date: string; start: number };

/** `/reserve` のクエリから選んだ内容を読む。足りない・不正なら undefined（空きは見ない） */
export function parseSelection(q: {
  menu?: string;
  staff?: string;
  date?: string;
  time?: string;
}): Selection | undefined {
  const menu = findMenu(q.menu);
  if (!menu || !isStaffChoice(q.staff) || !isDateString(q.date)) return undefined;
  const start = parseTime(q.time);
  if (start === undefined || !startTimes().includes(start)) return undefined;
  return { menu, staff: q.staff, date: q.date, start };
}

/** 見本の予約と保存済みの予約をあわせた、その日の予約 */
export async function bookingsOn(store: BookingStore, date: string, now: Date): Promise<Booking[]> {
  const samples = sampleBookings(jstParts(now).date).filter((b) => b.date === date);
  return [...samples, ...(await store.listByDate(date))];
}

/** 今この枠に入れる担当と席。入れなければ undefined（締め切り・範囲外・休み・閉じた時間も含む） */
export async function findAssignment(
  store: BookingStore,
  sel: Selection,
  now: Date,
  closures?: ClosureStore,
): Promise<{ staffId: StaffId; seatId: SeatId } | undefined> {
  if (!isBookableTime(sel.date, sel.start, now)) return undefined;
  if (closures && isBlocked(await closures.dayOf(sel.date), sel.menu, sel.start)) return undefined;
  const bookings = await bookingsOn(store, sel.date, now);
  return assign(sel.menu, sel.staff, sel.date, sel.start, bookings);
}

// 確かめてから保存するまでの間に、別の確定や閉じる操作が割り込まないように順番に処理する
let queue: Promise<unknown> = Promise.resolve();

/** 予約の確定と、お店の閉じる操作を1つずつ順番に動かす */
export function inOrder<T>(run: () => Promise<T>): Promise<T> {
  const result = queue.then(run, run);
  queue = result.catch(() => undefined);
  return result;
}

export type ReserveResult =
  | { status: "ok"; booking: StoredBooking }
  | { status: "full" };

export function reserve(
  store: BookingStore,
  sel: Selection,
  customer: Customer,
  now: Date = new Date(),
  closures?: ClosureStore,
): Promise<ReserveResult> {
  return inOrder(async (): Promise<ReserveResult> => {
    const found = await findAssignment(store, sel, now, closures);
    if (!found) return { status: "full" };
    const booking = await store.save({
      menuId: sel.menu.id,
      staffId: found.staffId,
      seatId: found.seatId,
      date: sel.date,
      start: sel.start,
      customer,
    });
    return { status: "ok", booking };
  });
}
