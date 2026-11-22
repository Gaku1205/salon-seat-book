import Link from "next/link";
import { findMenu, findStaff, gridTimes, LAST_START_MINUTES, OPEN_MINUTES, SEATS, SLOT_MINUTES } from "@/lib/salon";
import { type DayClosures, isSlotClosed, NO_CLOSURES } from "@/lib/closures";
import { type Booking, isBookableTime } from "@/lib/slots";
import { formatTime, timeParam } from "@/lib/time";

type Props = {
  date: string;
  now: Date;
  bookings: readonly Booking[];
  /** その日の休み・閉じた枠。閉じた枡は押せない */
  closures?: DayClosures;
};

const HEADER_ROWS = 1;

export function rowOf(minutes: number): number {
  return Math.floor((minutes - OPEN_MINUTES) / SLOT_MINUTES) + HEADER_ROWS + 1;
}

/** 予約帳の頭の行（席1〜席4）と左の時刻の列 */
export function LedgerFrame() {
  return (
    <>
      <div className="ledger-corner" style={{ gridRow: 1, gridColumn: 1 }} />
      {SEATS.map((seat) => (
        <div key={seat} className="ledger-seat" role="columnheader" style={{ gridRow: 1, gridColumn: seat + 1 }}>
          席{seat}
        </div>
      ))}
      {gridTimes().map((t) => (
        <div
          key={t}
          className={`ledger-time${t % 60 === 0 ? " is-hour" : ""}`}
          role="rowheader"
          style={{ gridRow: rowOf(t), gridColumn: 1 }}
        >
          {t % 60 === 0 ? formatTime(t) : ""}
        </div>
      ))}
    </>
  );
}

/** 予約の塊（担当の名前・メニュー・放置） */
export function LedgerBookings({ bookings }: { bookings: readonly Booking[] }) {
  return bookings.map((b) => {
    const menu = findMenu(b.menuId);
    const staff = findStaff(b.staffId);
    if (!menu || !staff) return null;
    const span = Math.ceil(menu.minutes / SLOT_MINUTES);
    const resting = menu.staffSegments.length > 1;
    return (
      <div
        key={`${b.seatId}-${b.start}`}
        className="ledger-booking"
        style={{ gridRow: `${rowOf(b.start)} / span ${span}`, gridColumn: b.seatId + 1 }}
      >
        <span className="ledger-name">{staff.name}</span>
        <span className="ledger-menu">{menu.name}</span>
        {resting && <span className="ledger-rest">放置</span>}
      </div>
    );
  });
}

/** その枡（席・時刻）に予約の席の時間がかかっているか */
export function isCovered(bookings: readonly Booking[], seat: number, t: number): boolean {
  return bookings.some((b) => {
    const menu = findMenu(b.menuId);
    return b.seatId === seat && menu !== undefined && b.start < t + SLOT_MINUTES && t < b.start + menu.minutes;
  });
}

/** 席4列×30分の枡の1日の予約帳 */
export function Ledger({ date, now, bookings, closures = NO_CLOSURES }: Props) {
  const times = gridTimes();
  const dayBookings = bookings.filter((b) => b.date === date);

  return (
    <div className="ledger" role="table" aria-label="席の予約帳">
      <LedgerFrame />

      {times.flatMap((t) =>
        SEATS.filter((seat) => !isCovered(dayBookings, seat, t)).map((seat) => {
          const style = { gridRow: rowOf(t), gridColumn: seat + 1 };
          const cls = `ledger-cell${t % 60 === 0 ? " is-hour" : ""}`;
          const open = t <= LAST_START_MINUTES && isBookableTime(date, t, now) && !isSlotClosed(closures, t);
          if (!open) {
            return <div key={`${seat}-${t}`} className={`${cls} is-closed`} style={style} aria-label={`席${seat} ${formatTime(t)} 受付終了`} />;
          }
          return (
            <Link
              key={`${seat}-${t}`}
              href={`/reserve?date=${date}&time=${timeParam(t)}`}
              className={`${cls} is-open`}
              style={style}
              aria-label={`席${seat} ${formatTime(t)}から予約する`}
            />
          );
        }),
      )}

      <LedgerBookings bookings={dayBookings} />
    </div>
  );
}
