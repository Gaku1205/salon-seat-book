import Link from "next/link";
import { findMenu, findStaff, isStaffChoice, MENUS, SHOP_NAME, STAFF, type StaffChoice } from "@/lib/salon";
import { getBookingStore } from "@/lib/booking-store";
import { getClosureStore } from "@/lib/closures";
import { bookingsOn } from "@/lib/reserve";
import { availableStarts } from "@/lib/slots";
import { bookableDates, formatDate, formatTime, isDateString, jstParts, parseTime, timeParam, weekday } from "@/lib/time";

type Choice = { menu?: string; staff?: string; date?: string; time?: string };

function href(c: Choice): string {
  const p = new URLSearchParams();
  if (c.menu) p.set("menu", c.menu);
  if (c.staff) p.set("staff", c.staff);
  if (c.date) p.set("date", c.date);
  if (c.time) p.set("time", c.time);
  const s = p.toString();
  return s ? `/reserve?${s}` : "/reserve";
}

function one(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" ? v : undefined;
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Reserve({ searchParams }: Props) {
  const query = await searchParams;
  const now = new Date();
  const today = jstParts(now).date;
  const dates = bookableDates(today);

  const menu = findMenu(one(query.menu));
  const staffRaw = one(query.staff);
  const staff: StaffChoice | undefined = isStaffChoice(staffRaw) ? staffRaw : undefined;
  const dateRaw = one(query.date);
  const date = isDateString(dateRaw) && dates.includes(dateRaw) ? dateRaw : undefined;

  const starts =
    menu && staff && date
      ? availableStarts({
          menuId: menu.id,
          staff,
          date,
          now,
          bookings: await bookingsOn(getBookingStore(), date, now),
          closures: await getClosureStore().dayOf(date),
        })
      : [];
  const asked = parseTime(one(query.time));
  // 時刻は、メニュー・担当・日付がそろって、空いているときだけ選んだことにする
  const time = asked !== undefined && starts.includes(asked) ? asked : undefined;
  // 枡から来た時刻は、まだそろっていなくても持ち回る
  const keepTime = time !== undefined ? timeParam(time) : !(menu && staff && date) ? one(query.time) : undefined;

  const base: Choice = { menu: menu?.id, staff, date, time: keepTime };
  const staffName = staff === "any" ? "おまかせ" : findStaff(staff)?.name;

  return (
    <main className="desk">
      <article className="book is-narrow">
        <header className="book-head">
          <Link href="/" className="shop-name is-small">
            {SHOP_NAME}
          </Link>
          <h1 className="book-date">ご予約</h1>
        </header>

        <section className="step" aria-labelledby="step-menu">
          <h2 id="step-menu" className="step-title">1. メニュー</h2>
          <ul className="choices">
            {MENUS.map((m) => (
              <li key={m.id}>
                <Link
                  href={href({ ...base, menu: m.id })}
                  scroll={false}
                  className={`choice${menu?.id === m.id ? " is-picked" : ""}`}
                  aria-current={menu?.id === m.id ? "true" : undefined}
                >
                  <span className="choice-main">{m.name}</span>
                  <span className="choice-sub">{m.minutes}分</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="step" aria-labelledby="step-staff">
          <h2 id="step-staff" className="step-title">2. 担当</h2>
          <ul className="choices">
            <li>
              <Link
                href={href({ ...base, staff: "any" })}
                scroll={false}
                className={`choice${staff === "any" ? " is-picked" : ""}`}
                aria-current={staff === "any" ? "true" : undefined}
              >
                <span className="choice-main">おまかせ</span>
                <span className="choice-sub">空いているスタッフが担当します</span>
              </Link>
            </li>
            {STAFF.map((s) => (
              <li key={s.id}>
                <Link
                  href={href({ ...base, staff: s.id })}
                  scroll={false}
                  className={`choice${staff === s.id ? " is-picked" : ""}`}
                  aria-current={staff === s.id ? "true" : undefined}
                >
                  <span className="choice-main is-hand">{s.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="step" aria-labelledby="step-date">
          <h2 id="step-date" className="step-title">3. 日付</h2>
          <ul className="dates">
            {dates.map((d) => {
              const [, m, day] = d.split("-").map(Number);
              return (
                <li key={d}>
                  <Link
                    href={href({ ...base, date: d })}
                    scroll={false}
                    className={`date${date === d ? " is-picked" : ""}`}
                    aria-current={date === d ? "true" : undefined}
                    aria-label={formatDate(d)}
                  >
                    <span className="date-month">{m}月</span>
                    <span className="date-day">{day}</span>
                    <span className="date-week">{weekday(d)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="step" aria-labelledby="step-time">
          <h2 id="step-time" className="step-title">4. 時間</h2>
          {!(menu && staff && date) ? (
            <p className="step-note">メニュー・担当・日付を選ぶと、空いた時間が並びます</p>
          ) : starts.length === 0 ? (
            <p className="step-note">この日は空きがありません。ほかの日をお選びください</p>
          ) : (
            <ul className="times">
              {starts.map((t) => (
                <li key={t}>
                  <Link
                    href={href({ ...base, time: timeParam(t) })}
                    scroll={false}
                    className={`time${time === t ? " is-picked" : ""}`}
                    aria-current={time === t ? "true" : undefined}
                  >
                    {formatTime(t)}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {menu && staffName && date && time !== undefined && (
          <section className="summary" aria-label="選んだ内容">
            <dl className="summary-list">
              <dt>メニュー</dt>
              <dd>{menu.name}</dd>
              <dt>担当</dt>
              <dd>{staffName}</dd>
              <dt>日時</dt>
              <dd>
                {formatDate(date)} {formatTime(time)}〜
              </dd>
            </dl>
            <Link
              href={`/reserve/confirm?${new URLSearchParams({
                menu: menu.id,
                staff: staff as string,
                date,
                time: timeParam(time),
              }).toString()}`}
              className="button"
            >
              お名前・連絡先の入力へ
            </Link>
            <p className="book-small">予約は無料です。お支払いはお店で</p>
          </section>
        )}
      </article>
    </main>
  );
}
