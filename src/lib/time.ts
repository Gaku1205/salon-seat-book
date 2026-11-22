// 日付と時刻（日本の時刻 UTC+9 で数える）

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

/** 日本の時刻での、今日の日付（YYYY-MM-DD）と0時からの分 */
export function jstParts(now: Date): { date: string; minutes: number } {
  const d = new Date(now.getTime() + JST_OFFSET_MS);
  const date = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  return { date, minutes: d.getUTCHours() * 60 + d.getUTCMinutes() };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function isDateString(v: string | undefined): v is string {
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const [y, m, d] = v.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** 日付に n 日足す */
export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

/** 1か月先の同じ日。次の月に同じ日が無ければ、その月の最後の日 */
export function addOneMonth(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const dt = new Date(Date.UTC(y, m, Math.min(d, lastDay)));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

/** 今日から1か月先までの日付の一覧 */
export function bookableDates(today: string): string[] {
  const last = addOneMonth(today);
  const list: string[] = [];
  for (let d = today; d <= last; d = addDays(d, 1)) list.push(d);
  return list;
}

export function formatTime(minutes: number): string {
  return `${Math.floor(minutes / 60)}:${pad(minutes % 60)}`;
}

/** "HH:MM" または "H:MM" を0時からの分に。読めなければ undefined */
export function parseTime(v: string | undefined): number | undefined {
  const m = v?.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return undefined;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return undefined;
  return h * 60 + min;
}

/** クエリに入れる時刻（"HH:MM"） */
export function timeParam(minutes: number): string {
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

export function weekday(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

/** 「11月22日（日）」 */
export function formatDate(date: string): string {
  const [, m, d] = date.split("-").map(Number);
  return `${m}月${d}日（${weekday(date)}）`;
}
