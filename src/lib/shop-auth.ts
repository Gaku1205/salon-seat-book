// お店の合言葉（docs/spec.md「お店の合言葉」）。
// 合言葉はサーバーの環境変数 SHOP_PASSPHRASE から読み、ここでは引数で受け取る。
// Cookie には合言葉そのものではなく「期限.HMAC(期限)」を入れる。
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const SHOP_COOKIE = "shop_session";
/** Cookie の期限（秒）。7日 */
export const SHOP_SESSION_SECONDS = 7 * 24 * 60 * 60;

/** 長さが違っても同じ手間で比べる（どちらも SHA-256 にそろえてから timingSafeEqual） */
function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

function sign(secret: string, expires: number): string {
  return createHmac("sha256", secret).update(`shop-session:${expires}`).digest("hex");
}

/** 入れた合言葉が合うか。合言葉が未設定（空）なら必ず false */
export function checkPassphrase(input: string, secret: string | undefined): boolean {
  if (!secret) return false;
  return safeEqual(input, secret);
}

/** 開いた状態の Cookie の値。合言葉が未設定なら作らない */
export function createSessionValue(secret: string | undefined, now: Date): string | undefined {
  if (!secret) return undefined;
  const expires = Math.floor(now.getTime() / 1000) + SHOP_SESSION_SECONDS;
  return `${expires}.${sign(secret, expires)}`;
}

/** Cookie の値が、今開いていると言えるか */
export function isSessionOpen(value: string | undefined, secret: string | undefined, now: Date): boolean {
  if (!secret || !value) return false;
  const m = value.match(/^(\d{1,12})\.([0-9a-f]{64})$/);
  if (!m) return false;
  const expires = Number(m[1]);
  if (expires <= Math.floor(now.getTime() / 1000)) return false;
  return safeEqual(m[2], sign(secret, expires));
}
