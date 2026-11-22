// 予約の保存先。本番のデータベースは別Issueで、この interface を満たす物に差し替える。
import type { Customer } from "./customer";
import type { Booking } from "./slots";

export type StoredBooking = Booking & {
  id: string;
  customer: Customer;
  /** 確定した時刻（ISO 8601） */
  createdAt: string;
};

export type NewBooking = Omit<StoredBooking, "id" | "createdAt">;

export interface BookingStore {
  save(booking: NewBooking): Promise<StoredBooking>;
  /** その日の予約（YYYY-MM-DD） */
  listByDate(date: string): Promise<StoredBooking[]>;
  get(id: string): Promise<StoredBooking | undefined>;
}

export function createMemoryStore(now: () => Date = () => new Date()): BookingStore {
  const byId = new Map<string, StoredBooking>();
  return {
    async save(booking) {
      const stored: StoredBooking = {
        ...booking,
        id: crypto.randomUUID(),
        createdAt: now().toISOString(),
      };
      byId.set(stored.id, stored);
      return stored;
    },
    async listByDate(date) {
      return [...byId.values()].filter((b) => b.date === date);
    },
    async get(id) {
      return byId.get(id);
    },
  };
}

const globalForStore = globalThis as unknown as { __bookingStore?: BookingStore };

/** サーバー全体で1つのメモリ上の保存先（開発中の再読み込みでも消えないように globalThis に置く） */
export function getBookingStore(): BookingStore {
  globalForStore.__bookingStore ??= createMemoryStore();
  return globalForStore.__bookingStore;
}
