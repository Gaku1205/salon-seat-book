// 見本の予約（本物の保存は #2）。今日と明日に数件入れる
import type { Booking } from "./slots";
import { addDays } from "./time";

export function sampleBookings(today: string): Booking[] {
  const tomorrow = addDays(today, 1);
  return [
    { menuId: "color", staffId: "a", seatId: 1, date: today, start: 10 * 60 },
    { menuId: "cut", staffId: "a", seatId: 2, date: today, start: 10 * 60 + 30 },
    { menuId: "perm", staffId: "b", seatId: 3, date: today, start: 11 * 60 },
    { menuId: "cut", staffId: "c", seatId: 1, date: today, start: 13 * 60 },
    { menuId: "color", staffId: "c", seatId: 4, date: today, start: 14 * 60 + 30 },
    { menuId: "cut", staffId: "b", seatId: 2, date: today, start: 16 * 60 },
    { menuId: "cut", staffId: "a", seatId: 1, date: tomorrow, start: 10 * 60 },
    { menuId: "perm", staffId: "b", seatId: 2, date: tomorrow, start: 13 * 60 },
  ];
}
