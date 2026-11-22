import { describe, expect, it } from "vitest";
import { createMemoryStore } from "./booking-store";
import { findMenu } from "./salon";
import { parseSelection, reserve, type Selection } from "./reserve";

// 日本の時刻 2026-11-22 08:00
const now = new Date("2026-11-21T23:00:00Z");
const customer = { name: "山田 花子", phone: "09012345678", email: "a@example.com" };
const menu = (id: string) => {
  const m = findMenu(id);
  if (!m) throw new Error(id);
  return m;
};
const sel = (over: Partial<Selection> = {}): Selection => ({
  menu: menu("cut"),
  staff: "a",
  date: "2026-11-23",
  start: 15 * 60,
  ...over,
});

describe("parseSelection", () => {
  it("4つそろっていれば読める", () => {
    const s = parseSelection({ menu: "cut", staff: "any", date: "2026-11-23", time: "15:00" });
    expect(s?.menu.id).toBe("cut");
    expect(s?.start).toBe(900);
  });
  it("足りない・不正なら undefined", () => {
    expect(parseSelection({ menu: "cut", staff: "a", date: "2026-11-23" })).toBeUndefined();
    expect(parseSelection({ menu: "x", staff: "a", date: "2026-11-23", time: "15:00" })).toBeUndefined();
    expect(parseSelection({ menu: "cut", staff: "z", date: "2026-11-23", time: "15:00" })).toBeUndefined();
    expect(parseSelection({ menu: "cut", staff: "a", date: "2026-02-30", time: "15:00" })).toBeUndefined();
    expect(parseSelection({ menu: "cut", staff: "a", date: "2026-11-23", time: "15:10" })).toBeUndefined();
    expect(parseSelection({ menu: "cut", staff: "a", date: "2026-11-23", time: "19:00" })).toBeUndefined();
  });
});

describe("reserve", () => {
  it("空いていれば保存して、席と担当をつける", async () => {
    const store = createMemoryStore();
    const r = await reserve(store, sel(), customer, now);
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.booking.staffId).toBe("a");
      expect(r.booking.seatId).toBe(1);
      expect(r.booking.customer).toEqual(customer);
      expect(await store.get(r.booking.id)).toEqual(r.booking);
    }
  });

  it("おまかせは、空いている担当に決まる", async () => {
    const store = createMemoryStore();
    // 見本：今日 10:00 のカラーはスタッフAの施術（10:00〜10:15）
    const r = await reserve(store, sel({ staff: "any", date: "2026-11-22", start: 10 * 60 }), customer, now);
    expect(r.status).toBe("ok");
    if (r.status === "ok") expect(r.booking.staffId).not.toBe("a");
  });

  it("同じ担当・同じ枠を続けて2回確定すると、2回目は埋まりで保存されない", async () => {
    const store = createMemoryStore();
    expect((await reserve(store, sel(), customer, now)).status).toBe("ok");
    expect((await reserve(store, sel(), customer, now)).status).toBe("full");
    expect(await store.listByDate("2026-11-23")).toHaveLength(1);
  });

  it("同時に確定しても、1つしか通らない", async () => {
    const store = createMemoryStore();
    const results = await Promise.all([
      reserve(store, sel(), customer, now),
      reserve(store, sel(), customer, now),
      reserve(store, sel(), customer, now),
    ]);
    expect(results.filter((r) => r.status === "ok")).toHaveLength(1);
    expect(await store.listByDate("2026-11-23")).toHaveLength(1);
  });

  it("おまかせで同じ枠を続けると、3人の担当が埋まった4回目は埋まり", async () => {
    const store = createMemoryStore();
    const any = sel({ staff: "any" });
    const statuses: string[] = [];
    for (let i = 0; i < 4; i++) statuses.push((await reserve(store, any, customer, now)).status);
    expect(statuses).toEqual(["ok", "ok", "ok", "full"]);
  });

  it("見本の予約で埋まっている枠も埋まりになる", async () => {
    const store = createMemoryStore();
    // 見本：明日 10:00 にスタッフAのカット（席1）
    const r = await reserve(store, sel({ date: "2026-11-23", start: 10 * 60 }), customer, now);
    expect(r.status).toBe("full");
  });

  it("締め切り（1時間前）を過ぎた枠は埋まり扱いで保存されない", async () => {
    const store = createMemoryStore();
    // 日本の 12:30 に、12:00 の枠を確定しようとする
    const late = await reserve(store, sel({ date: "2026-11-22", start: 12 * 60 }), customer, new Date("2026-11-22T03:30:00Z"));
    expect(late.status).toBe("full");
    expect(await store.listByDate("2026-11-22")).toEqual([]);
  });

  it("1か月先より先は保存されない", async () => {
    const store = createMemoryStore();
    const r = await reserve(store, sel({ date: "2026-12-23" }), customer, now);
    expect(r.status).toBe("full");
  });
});
