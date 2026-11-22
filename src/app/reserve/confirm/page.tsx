import Link from "next/link";
import { ConfirmForm } from "@/components/ConfirmForm";
import { getBookingStore } from "@/lib/booking-store";
import { getClosureStore } from "@/lib/closures";
import { findAssignment, parseSelection } from "@/lib/reserve";
import { findStaff, SHOP_NAME } from "@/lib/salon";
import { formatDate, formatTime, timeParam } from "@/lib/time";

function one(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" ? v : undefined;
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Confirm({ searchParams }: Props) {
  const query = await searchParams;
  const sel = parseSelection({
    menu: one(query.menu),
    staff: one(query.staff),
    date: one(query.date),
    time: one(query.time),
  });
  const open = sel ? await findAssignment(getBookingStore(), sel, new Date(), getClosureStore()) : undefined;

  const backParams = new URLSearchParams();
  for (const key of ["menu", "staff", "date", "time"] as const) {
    const v = one(query[key]);
    if (v) backParams.set(key, v);
  }
  const backQuery = backParams.toString();
  const backHref = backQuery ? `/reserve?${backQuery}` : "/reserve";

  return (
    <main className="desk">
      <article className="book is-narrow">
        <header className="book-head">
          <Link href="/" className="shop-name is-small">
            {SHOP_NAME}
          </Link>
          <h1 className="book-date">お名前・連絡先</h1>
        </header>

        {sel && open ? (
          <>
            <section className="summary is-first" aria-label="選んだ内容">
              <dl className="summary-list">
                <dt>メニュー</dt>
                <dd>{sel.menu.name}</dd>
                <dt>担当</dt>
                <dd>{sel.staff === "any" ? "おまかせ" : findStaff(sel.staff)?.name}</dd>
                <dt>日時</dt>
                <dd>
                  {formatDate(sel.date)} {formatTime(sel.start)}〜
                </dd>
              </dl>
              <p className="book-small">
                <Link href={backHref}>選び直す</Link>
              </p>
            </section>
            <ConfirmForm
              menu={sel.menu.id}
              staff={sel.staff}
              date={sel.date}
              time={timeParam(sel.start)}
              backHref={backHref}
            />
          </>
        ) : (
          <div className="notice">
            <p className="notice-text">
              {sel
                ? "この時間は埋まってしまいました。ほかの時間をお選びください"
                : "予約の内容が読み取れませんでした。はじめから選び直してください"}
            </p>
            <Link href={sel ? backHref : "/reserve"} className="button">
              予約の選択へ戻る
            </Link>
          </div>
        )}
      </article>
    </main>
  );
}
