import Link from "next/link";
import { Ledger } from "@/components/Ledger";
import { SHOP_NAME } from "@/lib/salon";
import { getBookingStore } from "@/lib/booking-store";
import { getClosureStore } from "@/lib/closures";
import { bookingsOn } from "@/lib/reserve";
import { addDays, addOneMonth, formatDate, isDateString, jstParts } from "@/lib/time";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Home({ searchParams }: Props) {
  const query = await searchParams;
  const now = new Date();
  const today = jstParts(now).date;
  const last = addOneMonth(today);
  const asked = typeof query.date === "string" ? query.date : undefined;
  const date = isDateString(asked) && asked >= today && asked <= last ? asked : today;
  const prev = addDays(date, -1);
  const next = addDays(date, 1);

  return (
    <main className="desk">
      <article className="book">
        <header className="book-head">
          <h1 className="shop-name">{SHOP_NAME}</h1>
          <p className="book-title">席の予約帳</p>
          <nav className="day-nav" aria-label="日をめくる">
            {prev >= today ? (
              <Link href={`/?date=${prev}`} className="day-turn">
                ← 前の日
              </Link>
            ) : (
              <span className="day-turn is-off">← 前の日</span>
            )}
            <h2 className="book-date">{formatDate(date)}</h2>
            {next <= last ? (
              <Link href={`/?date=${next}`} className="day-turn">
                次の日 →
              </Link>
            ) : (
              <span className="day-turn is-off">次の日 →</span>
            )}
          </nav>
          <p className="book-note">空いた枡を押すと、その時間から予約できます</p>
        </header>

        <Ledger
          date={date}
          now={now}
          bookings={await bookingsOn(getBookingStore(), date, now)}
          closures={await getClosureStore().dayOf(date)}
        />

        <footer className="book-foot">
          <Link href="/reserve" className="button">
            予約する
          </Link>
          <p className="book-small">予約は無料です。お支払いはお店で</p>
        </footer>
      </article>
    </main>
  );
}
