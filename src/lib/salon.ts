// hair room HARU のメニュー・スタッフ・席・営業時間の定義（docs/spec.md「予約の決まり」）

export const SHOP_NAME = "hair room HARU";

export type MenuId = "cut" | "color" | "perm";
export type StaffId = "a" | "b" | "c";
export type StaffChoice = StaffId | "any";
export type SeatId = 1 | 2 | 3 | 4;

/** メニューの中で、スタッフの手が要る時間（開始からの分） */
export type Segment = { from: number; to: number };

export type Menu = {
  id: MenuId;
  name: string;
  /** 席を使う時間（分） */
  minutes: number;
  /** スタッフの手が要る時間。間が空いていれば、その間は放置 */
  staffSegments: Segment[];
};

export const MENUS: readonly Menu[] = [
  { id: "cut", name: "カット", minutes: 60, staffSegments: [{ from: 0, to: 60 }] },
  {
    id: "color",
    name: "カラー",
    minutes: 90,
    staffSegments: [
      { from: 0, to: 15 },
      { from: 75, to: 90 },
    ],
  },
  { id: "perm", name: "パーマ", minutes: 120, staffSegments: [{ from: 0, to: 120 }] },
];

export type Staff = { id: StaffId; name: string };

export const STAFF: readonly Staff[] = [
  { id: "a", name: "スタッフA" },
  { id: "b", name: "スタッフB" },
  { id: "c", name: "スタッフC" },
];

export const SEATS: readonly SeatId[] = [1, 2, 3, 4];

/** 営業の始まり（0時からの分） */
export const OPEN_MINUTES = 10 * 60;
/** 営業の終わり（0時からの分） */
export const CLOSE_MINUTES = 19 * 60;
/** 最後に始められる時刻（0時からの分） */
export const LAST_START_MINUTES = 18 * 60;
export const SLOT_MINUTES = 30;
/** 予約の締め切り：開始の何分前まで */
export const DEADLINE_MINUTES = 60;

export function findMenu(id: string | undefined): Menu | undefined {
  return MENUS.find((m) => m.id === id);
}

export function findStaff(id: string | undefined): Staff | undefined {
  return STAFF.find((s) => s.id === id);
}

export function isStaffChoice(v: string | undefined): v is StaffChoice {
  return v === "any" || findStaff(v) !== undefined;
}

/** 開始できる時刻の一覧（0時からの分） */
export function startTimes(): number[] {
  const list: number[] = [];
  for (let t = OPEN_MINUTES; t <= LAST_START_MINUTES; t += SLOT_MINUTES) list.push(t);
  return list;
}

/** 表の行（30分ごと、営業の始まりから終わりの手前まで） */
export function gridTimes(): number[] {
  const list: number[] = [];
  for (let t = OPEN_MINUTES; t < CLOSE_MINUTES; t += SLOT_MINUTES) list.push(t);
  return list;
}
