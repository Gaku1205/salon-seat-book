import { cookies } from "next/headers";
import { isSessionOpen, SHOP_COOKIE } from "@/lib/shop-auth";

/** 今のリクエストの Cookie で、お店の予約帳が開いているか */
export async function isShopOpen(): Promise<boolean> {
  const value = (await cookies()).get(SHOP_COOKIE)?.value;
  return isSessionOpen(value, process.env.SHOP_PASSPHRASE, new Date());
}
