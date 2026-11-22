import Link from "next/link";
import { findMenu, findStaff, gridTimes, LAST_START_MINUTES, OPEN_MINUTES, SEATS, SLOT_MINUTES } from "@/lib/salon";
import { type Booking, isBookableTime } from "@/lib/slots";
import { formatTime, timeParam } from "@/lib/time";

type Props = {
  date: string;
  now: Date;
  bookings: readonly Booking[];
};

const HEADER_ROWS = 1;

function rowOf(minutes: number): number {
  return Math.floor((minutes - OPEN_MINUTES) / SLOT_MINUTES) + HEADER_ROWS + 1;
}

/** 席4列×30分の枡の1日の予約帳 */
export function Ledger({ date, now, bookings }: Props) {
  const times = gridTimes();
  const dayBookings = bookings.filter((b) => b.date === date);

  const covered = (seat: number, t: number) =>
    dayBookings.some((b) => {
      const menu = findMenu(b.menuId);
      return b.seatId === seat && menu !== undefined && b.start < t + SLOT_MINUTES && t < b.start + menu.minutes;
    });

  return (
    <div className="ledger" role="table" aria-label="席の予約帳">
      <div className="ledger-corner" style={{ gridRow: 1, gridColumn: 1 }} />
      {SEATS.map((seat) => (
        <div key={seat} className="ledger-seat" role="columnheader" style={{ gridRow: 1, gridColumn: seat + 1 }}>
          席{seat}
        </div>
      ))}

      {times.map((t) => (
        <div
          key={t}
          className={`ledger-time${t % 60 === 0 ? " is-hour" : ""}`}
          role="rowheader"
          style={{ gridRow: rowOf(t), gridColumn: 1 }}
        >
          {t % 60 === 0 ? formatTime(t) : ""}
        </div>
      ))}

      {times.flatMap((t) =>
        SEATS.filter((seat) => !covered(seat, t)).map((seat) => {
          const style = { gridRow: rowOf(t), gridColumn: seat + 1 };
          const cls = `ledger-cell${t % 60 === 0 ? " is-hour" : ""}`;
          const open = t <= LAST_START_MINUTES && isBookableTime(date, t, now);
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

      {dayBookings.map((b) => {
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
      })}
    </div>
  );
}
