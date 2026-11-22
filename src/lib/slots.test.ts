import { describe, expect, it } from "vitest";
import { availableStarts, type Booking } from "./slots";
import { addOneMonth, bookableDates, jstParts } from "./time";

// 日本の時刻 2026-11-22 08:00
const now = new Date("2026-11-21T23:00:00Z");
const today = "2026-11-22";
const h = (hour: number, min = 0) => hour * 60 + min;

describe("availableStarts", () => {
  it("予約が無ければ 10:00〜18:00 の30分ごとが全部出る", () => {
    const list = availableStarts({ menuId: "cut", staff: "a", date: today, now, bookings: [] });
    expect(list[0]).toBe(h(10));
    expect(list.at(-1)).toBe(h(18));
    expect(list).toHaveLength(17);
  });

  it("1時間前を過ぎた枠は出ない（ちょうど1時間前は出る）", () => {
    const at1030 = new Date("2026-11-22T01:30:00Z"); // 日本の 10:30
    const list = availableStarts({ menuId: "cut", staff: "a", date: today, now: at1030, bookings: [] });
    expect(list).not.toContain(h(10));
    expect(list).not.toContain(h(11));
    expect(list[0]).toBe(h(11, 30));
  });

  it("過ぎた日は何も出ない", () => {
    expect(availableStarts({ menuId: "cut", staff: "a", date: "2026-11-21", now, bookings: [] })).toEqual([]);
  });

  it("1か月先の同じ日までは出て、それより先は出ない", () => {
    expect(availableStarts({ menuId: "cut", staff: "a", date: "2026-12-22", now, bookings: [] })).toHaveLength(17);
    expect(availableStarts({ menuId: "cut", staff: "a", date: "2026-12-23", now, bookings: [] })).toEqual([]);
  });

  it("同じスタッフの予約と重なる枠は出ない", () => {
    const bookings: Booking[] = [{ menuId: "cut", staffId: "a", seatId: 1, date: today, start: h(12) }];
    const list = availableStarts({ menuId: "cut", staff: "a", date: today, now, bookings });
    expect(list).not.toContain(h(11, 30));
    expect(list).not.toContain(h(12));
    expect(list).not.toContain(h(12, 30));
    expect(list).toContain(h(11));
    expect(list).toContain(h(13));
    // 別のスタッフなら空いた席で入れる
    expect(availableStarts({ menuId: "cut", staff: "b", date: today, now, bookings })).toContain(h(12));
  });

  it("席が4つとも重なる枠は出ない", () => {
    const bookings: Booking[] = [
      { menuId: "cut", staffId: "a", seatId: 1, date: today, start: h(12) },
      { menuId: "cut", staffId: "b", seatId: 2, date: today, start: h(12) },
      { menuId: "color", staffId: "c", seatId: 3, date: today, start: h(12) },
      // 席4はカラーの放置中のスタッフCが入れている
      { menuId: "cut", staffId: "c", seatId: 4, date: today, start: h(12, 15) },
    ];
    const list = availableStarts({ menuId: "cut", staff: "any", date: today, now, bookings });
    expect(list).not.toContain(h(12));
    expect(list).not.toContain(h(12, 30));
  });

  it("カラーの放置中に、同じスタッフの別のカットが入る枠が出る", () => {
    const bookings: Booking[] = [{ menuId: "color", staffId: "a", seatId: 1, date: today, start: h(10) }];
    const list = availableStarts({ menuId: "cut", staff: "a", date: today, now, bookings });
    // 施術は 10:00〜10:15 と 11:15〜11:30。10:30〜11:30 のカットは 11:15 と重なる
    expect(list).not.toContain(h(10));
    expect(list).not.toContain(h(10, 30));
    // カラー（最初の15分）なら放置中に入る：10:30 開始 → 10:30〜10:45 と 11:45〜12:00
    const colors = availableStarts({ menuId: "color", staff: "a", date: today, now, bookings });
    expect(colors).toContain(h(10, 30));
    expect(colors).not.toContain(h(10));
  });

  it("カラーの放置中の60分に、同じスタッフのカットがちょうど入る", () => {
    const bookings: Booking[] = [{ menuId: "color", staffId: "a", seatId: 1, date: today, start: h(9, 45) }];
    // 施術は 9:45〜10:00 と 11:00〜11:15。10:00〜11:00 のカットは空き
    const list = availableStarts({ menuId: "cut", staff: "a", date: today, now, bookings });
    expect(list).toContain(h(10));
    expect(list).not.toContain(h(10, 30));
  });

  it("「おまかせ」は誰かが空いていれば出て、3人とも埋まっていれば出ない", () => {
    const busyAB: Booking[] = [
      { menuId: "cut", staffId: "a", seatId: 1, date: today, start: h(12) },
      { menuId: "cut", staffId: "b", seatId: 2, date: today, start: h(12) },
    ];
    expect(availableStarts({ menuId: "cut", staff: "any", date: today, now, bookings: busyAB })).toContain(h(12));
    expect(availableStarts({ menuId: "cut", staff: "a", date: today, now, bookings: busyAB })).not.toContain(h(12));
    const busyAll: Booking[] = [
      ...busyAB,
      { menuId: "cut", staffId: "c", seatId: 3, date: today, start: h(12) },
    ];
    expect(availableStarts({ menuId: "cut", staff: "any", date: today, now, bookings: busyAll })).not.toContain(h(12));
  });

  it("ほかの日の予約は数えない", () => {
    const bookings: Booking[] = [{ menuId: "perm", staffId: "a", seatId: 1, date: "2026-11-23", start: h(10) }];
    expect(availableStarts({ menuId: "cut", staff: "a", date: today, now, bookings })).toContain(h(10));
  });
});

describe("日付", () => {
  it("日本の時刻で今日を数える", () => {
    expect(jstParts(new Date("2026-11-21T15:30:00Z"))).toEqual({ date: "2026-11-22", minutes: 30 });
  });

  it("1か月先は、次の月に同じ日が無ければ月の最後の日", () => {
    expect(addOneMonth("2026-01-31")).toBe("2026-02-28");
    expect(addOneMonth("2026-12-15")).toBe("2027-01-15");
  });

  it("予約できる日は今日から1か月先まで", () => {
    const dates = bookableDates(today);
    expect(dates[0]).toBe(today);
    expect(dates.at(-1)).toBe("2026-12-22");
    expect(dates).toHaveLength(31);
  });
});
