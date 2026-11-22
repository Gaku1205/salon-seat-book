import { describe, expect, it } from "vitest";
import { createMemoryStore, type NewBooking } from "./booking-store";

const customer = { name: "山田 花子", phone: "09012345678", email: "a@example.com" };
const base: NewBooking = { menuId: "cut", staffId: "a", seatId: 1, date: "2026-11-22", start: 600, customer };

describe("createMemoryStore", () => {
  it("保存するとIDと確定時刻がつき、IDで取れる", async () => {
    const store = createMemoryStore(() => new Date("2026-11-22T00:00:00Z"));
    const saved = await store.save(base);
    expect(saved.id).toBeTruthy();
    expect(saved.createdAt).toBe("2026-11-22T00:00:00.000Z");
    expect(await store.get(saved.id)).toEqual(saved);
  });

  it("IDが違えば別の予約になる", async () => {
    const store = createMemoryStore();
    const a = await store.save(base);
    const b = await store.save(base);
    expect(a.id).not.toBe(b.id);
  });

  it("知らないIDは undefined", async () => {
    expect(await createMemoryStore().get("nothing")).toBeUndefined();
  });

  it("日ごとの一覧には、その日の予約だけが出る", async () => {
    const store = createMemoryStore();
    await store.save(base);
    await store.save({ ...base, date: "2026-11-23" });
    const list = await store.listByDate("2026-11-22");
    expect(list).toHaveLength(1);
    expect(list[0].date).toBe("2026-11-22");
    expect(await store.listByDate("2026-12-01")).toEqual([]);
  });

  it("保存先ごとに独立している", async () => {
    const a = createMemoryStore();
    const b = createMemoryStore();
    const saved = await a.save(base);
    expect(await b.get(saved.id)).toBeUndefined();
  });
});
