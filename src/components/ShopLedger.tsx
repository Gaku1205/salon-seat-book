import Link from "next/link";
import { isCovered, LedgerBookings, LedgerFrame, rowOf } from "@/components/Ledger";
import type { DayClosures } from "@/lib/closures";
import { gridTimes, SEATS } from "@/lib/salon";
import type { Booking } from "@/lib/slots";
import { formatTime, timeParam } from "@/lib/time";

type Props = {
  date: string;
  bookings: readonly Booking[];
  closures: DayClosures;
  /** 閉じる・開けるができる日か（過去の日は見るだけ） */
  editable: boolean;
  /** 選んだ行の時刻 */
  picked?: number;
};

/** お店の予約帳：トップと同じ席4列×30分の枡。空いた枡・閉じた枡を押すと、その行を選ぶ */
export function ShopLedger({ date, bookings, closures, editable, picked }: Props) {
  const dayBookings = bookings.filter((b) => b.date === date);

  return (
    <div className="ledger" role="table" aria-label="お店の予約帳">
      <LedgerFrame />

      {gridTimes().flatMap((t) =>
        SEATS.filter((seat) => !isCovered(dayBookings, seat, t)).map((seat) => {
          const key = `${seat}-${t}`;
          const style = { gridRow: rowOf(t), gridColumn: seat + 1 };
          const shut = closures.slots.includes(t);
          const cls = [
            "ledger-cell",
            t % 60 === 0 ? "is-hour" : "",
            closures.holiday || shut ? "is-closed" : "",
            shut ? "is-shut" : "",
            picked === t ? "is-picked" : "",
          ]
            .filter(Boolean)
            .join(" ");
          const mark = shut ? <span className="ledger-shut">閉</span> : null;

          if (!editable || closures.holiday) {
            return (
              <div key={key} className={cls} style={style}>
                {mark}
              </div>
            );
          }
          return (
            <Link
              key={key}
              href={`/shop?date=${date}&at=${timeParam(t)}`}
              scroll={false}
              className={`${cls} is-open`}
              style={style}
              aria-label={`${formatTime(t)} ${shut ? "閉じた時間を選ぶ" : "この時間を選ぶ"}`}
              aria-current={picked === t ? "true" : undefined}
            >
              {mark}
            </Link>
          );
        }),
      )}

      <LedgerBookings bookings={dayBookings} />
    </div>
  );
}
