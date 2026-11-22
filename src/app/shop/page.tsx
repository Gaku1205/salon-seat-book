import Link from "next/link";
import { redirect } from "next/navigation";
import { ShopLedger } from "@/components/ShopLedger";
import { getBookingStore } from "@/lib/booking-store";
import { getClosureStore } from "@/lib/closures";
import { bookingsOn } from "@/lib/reserve";
import { gridTimes, SHOP_NAME } from "@/lib/salon";
import { addDays, addOneMonth, formatDate, formatTime, isDateString, jstParts, parseTime, timeParam } from "@/lib/time";
import { closeSlotAction, holidayAction, openSlotAction } from "./actions";
import { isShopOpen } from "./session";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function one(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" ? v : undefined;
}

const ERRORS: Record<string, string> = {
  slot: "予約が入っている時間は閉じられません",
  day: "予約が入っている日は休みにできません",
};

export default async function Shop({ searchParams }: Props) {
  // 開いていなければ、予約帳の中身は読まずにログインへ
  if (!(await isShopOpen())) redirect("/shop/login");

  const query = await searchParams;
  const now = new Date();
  const today = jstParts(now).date;
  const last = addOneMonth(today);
  const asked = one(query.date);
  const date = isDateString(asked) && asked <= last ? asked : today;
  const prev = addDays(date, -1);
  const next = addDays(date, 1);
  const editable = date >= today;

  const bookings = await bookingsOn(getBookingStore(), date, now);
  const closures = await getClosureStore().dayOf(date);
  const at = parseTime(one(query.at));
  const picked = editable && !closures.holiday && at !== undefined && gridTimes().includes(at) ? at : undefined;
  const pickedShut = picked !== undefined && closures.slots.includes(picked);
  const error = ERRORS[one(query.error) ?? ""];

  return (
    <main className="desk">
      <article className="book">
        <header className="book-head">
          <p className="shop-name">{SHOP_NAME}</p>
          <h1 className="book-title">お店の予約帳</h1>
          <nav className="day-nav" aria-label="日をめくる">
            <Link href={`/shop?date=${prev}`} className="day-turn">
              ← 前の日
            </Link>
            <h2 className="book-date">{formatDate(date)}</h2>
            {next <= last ? (
              <Link href={`/shop?date=${next}`} className="day-turn">
                次の日 →
              </Link>
            ) : (
              <span className="day-turn is-off">次の日 →</span>
            )}
          </nav>
          {closures.holiday && <p className="shop-holiday">休み</p>}
          {editable ? (
            <>
              <form action={holidayAction} className="shop-day">
                <input type="hidden" name="date" value={date} />
                <input type="hidden" name="holiday" value={closures.holiday ? "off" : "on"} />
                <button type="submit" className="shop-day-button">
                  {closures.holiday ? "休みをやめる" : "この日を休みにする"}
                </button>
              </form>
              {!closures.holiday && <p className="book-note">空いた枡を押すと、その時間を閉じられます</p>}
            </>
          ) : (
            <p className="book-note">過ぎた日は見るだけです</p>
          )}
          {error && (
            <p className="notice shop-error" role="alert">
              {error}
            </p>
          )}
        </header>

        <ShopLedger date={date} bookings={bookings} closures={closures} editable={editable} picked={picked} />

        {picked !== undefined && (
          <form action={pickedShut ? openSlotAction : closeSlotAction} className="shop-bar">
            <input type="hidden" name="date" value={date} />
            <input type="hidden" name="time" value={timeParam(picked)} />
            <span className="shop-bar-time">{formatTime(picked)}</span>
            <button type="submit" className="button shop-bar-button">
              {pickedShut ? "この時間を開ける" : "この時間を閉じる"}
            </button>
            <Link href={`/shop?date=${date}`} scroll={false} className="shop-bar-cancel">
              やめる
            </Link>
          </form>
        )}
      </article>
    </main>
  );
}
