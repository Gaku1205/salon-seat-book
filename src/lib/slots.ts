// 空き枠の計算（docs/spec.md「予約の決まり」）
// 席は「メニューの全部の時間」、スタッフは「手が要る時間」だけ埋まる。
// なので、カラーの放置中に同じスタッフが別の席でカットに入れる。

import {
  DEADLINE_MINUTES,
  findMenu,
  type Menu,
  type MenuId,
  SEATS,
  type SeatId,
  STAFF,
  type StaffChoice,
  type StaffId,
  startTimes,
} from "./salon";
import { addOneMonth, jstParts } from "./time";

export type Booking = {
  menuId: MenuId;
  staffId: StaffId;
  seatId: SeatId;
  /** YYYY-MM-DD */
  date: string;
  /** 開始（0時からの分） */
  start: number;
};

type Range = { from: number; to: number };

function overlaps(a: Range, b: Range): boolean {
  return a.from < b.to && b.from < a.to;
}

function staffRanges(menu: Menu, start: number): Range[] {
  return menu.staffSegments.map((s) => ({ from: start + s.from, to: start + s.to }));
}

function seatRange(menu: Menu, start: number): Range {
  return { from: start, to: start + menu.minutes };
}

function menuOf(b: Booking): Menu {
  const menu = findMenu(b.menuId);
  if (!menu) throw new Error(`知らないメニュー：${b.menuId}`);
  return menu;
}

export function isStaffFree(
  staffId: StaffId,
  menu: Menu,
  date: string,
  start: number,
  bookings: readonly Booking[],
): boolean {
  const mine = staffRanges(menu, start);
  return bookings
    .filter((b) => b.date === date && b.staffId === staffId)
    .every((b) => {
      const theirs = staffRanges(menuOf(b), b.start);
      return mine.every((r) => theirs.every((t) => !overlaps(r, t)));
    });
}

export function isSeatFree(
  seatId: SeatId,
  menu: Menu,
  date: string,
  start: number,
  bookings: readonly Booking[],
): boolean {
  const mine = seatRange(menu, start);
  return bookings
    .filter((b) => b.date === date && b.seatId === seatId)
    .every((b) => !overlaps(mine, seatRange(menuOf(b), b.start)));
}

/** その時刻に入れる担当と席。入れなければ undefined */
export function assign(
  menu: Menu,
  staff: StaffChoice,
  date: string,
  start: number,
  bookings: readonly Booking[],
): { staffId: StaffId; seatId: SeatId } | undefined {
  const seatId = SEATS.find((s) => isSeatFree(s, menu, date, start, bookings));
  if (seatId === undefined) return undefined;
  const candidates: StaffId[] = staff === "any" ? STAFF.map((s) => s.id) : [staff];
  const staffId = candidates.find((s) => isStaffFree(s, menu, date, start, bookings));
  if (staffId === undefined) return undefined;
  return { staffId, seatId };
}

/** 予約の締め切り（1時間前）と1か月先までに収まるか */
export function isBookableTime(date: string, start: number, now: Date): boolean {
  const today = jstParts(now);
  if (date < today.date || date > addOneMonth(today.date)) return false;
  if (date === today.date && start - today.minutes < DEADLINE_MINUTES) return false;
  return true;
}

export type SlotQuery = {
  menuId: MenuId;
  staff: StaffChoice;
  /** YYYY-MM-DD */
  date: string;
  now: Date;
  bookings: readonly Booking[];
};

/** 空いた開始時刻の一覧（0時からの分） */
export function availableStarts(q: SlotQuery): number[] {
  const menu = findMenu(q.menuId);
  if (!menu) return [];
  return startTimes().filter(
    (t) =>
      isBookableTime(q.date, t, q.now) &&
      assign(menu, q.staff, q.date, t, q.bookings) !== undefined,
  );
}
