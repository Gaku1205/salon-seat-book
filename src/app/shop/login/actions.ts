"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { checkPassphrase, createSessionValue, SHOP_COOKIE, SHOP_SESSION_SECONDS } from "@/lib/shop-auth";

export type LoginState = { status: "idle" | "wrong" };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const input = formData.get("passphrase");
  const secret = process.env.SHOP_PASSPHRASE;
  if (typeof input !== "string" || !checkPassphrase(input, secret)) return { status: "wrong" };
  const value = createSessionValue(secret, new Date());
  if (!value) return { status: "wrong" };
  (await cookies()).set(SHOP_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SHOP_SESSION_SECONDS,
    path: "/",
  });
  redirect("/shop");
}
