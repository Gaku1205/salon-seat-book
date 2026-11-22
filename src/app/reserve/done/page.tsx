import Link from "next/link";
import { getBookingStore } from "@/lib/booking-store";
import { findMenu, findStaff, SHOP_NAME } from "@/lib/salon";
import { formatDate, formatTime } from "@/lib/time";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Done({ searchParams }: Props) {
  const query = await searchParams;
  const id = typeof query.id === "string" ? query.id : undefined;
  const booking = id ? await getBookingStore().get(id) : undefined;
  const menu = findMenu(booking?.menuId);
  const staff = findStaff(booking?.staffId);

  return (
    <main className="desk">
      <article className="book is-narrow">
        <header className="book-head">
          <Link href="/" className="shop-name is-small">
            {SHOP_NAME}
          </Link>
          <h1 className="book-date">{booking ? "ご予約を承りました" : "ご予約"}</h1>
        </header>

        {booking && menu && staff ? (
          <section className="summary is-first" aria-label="予約の内容">
            <dl className="summary-list">
              <dt>お店</dt>
              <dd>{SHOP_NAME}</dd>
              <dt>メニュー</dt>
              <dd>{menu.name}</dd>
              <dt>担当</dt>
              <dd>{staff.name}</dd>
              <dt>日時</dt>
              <dd>
                {formatDate(booking.date)} {formatTime(booking.start)}〜
              </dd>
              <dt>お名前</dt>
              <dd>{booking.customer.name} 様</dd>
              <dt>予約番号</dt>
              <dd className="is-id">{booking.id}</dd>
            </dl>
            <p className="book-small">予約は無料です。お支払いはお店で</p>
            <p className="book-foot">
              <Link href="/">予約帳へ戻る</Link>
            </p>
          </section>
        ) : (
          <div className="notice">
            <p className="notice-text">予約が見つかりませんでした。お手数ですが、予約の選択からやり直してください</p>
            <Link href="/reserve" className="button">
              予約の選択へ
            </Link>
          </div>
        )}
      </article>
    </main>
  );
}
