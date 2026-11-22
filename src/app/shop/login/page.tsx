import { ShopLoginForm } from "@/components/ShopLoginForm";
import { SHOP_NAME } from "@/lib/salon";

export default function ShopLogin() {
  return (
    <main className="desk">
      <article className="book is-narrow">
        <header className="book-head">
          <p className="shop-name is-small">{SHOP_NAME}</p>
          <h1 className="book-date">お店の予約帳</h1>
        </header>
        <ShopLoginForm />
      </article>
    </main>
  );
}
