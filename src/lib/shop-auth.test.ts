import { describe, expect, it } from "vitest";
import { checkPassphrase, createSessionValue, isSessionOpen, SHOP_SESSION_SECONDS } from "./shop-auth";

// テスト用のダミーの合言葉（本物ではない）
const SECRET = "dummy-secret-for-test";
const now = new Date("2026-11-22T00:00:00Z");

describe("checkPassphrase", () => {
  it("合う合言葉なら true", () => {
    expect(checkPassphrase(SECRET, SECRET)).toBe(true);
  });
  it("違う合言葉・空なら false", () => {
    expect(checkPassphrase("wrong", SECRET)).toBe(false);
    expect(checkPassphrase("", SECRET)).toBe(false);
    expect(checkPassphrase(`${SECRET} `, SECRET)).toBe(false);
  });
  it("環境変数が未設定なら、どれを入れても false", () => {
    expect(checkPassphrase("", undefined)).toBe(false);
    expect(checkPassphrase("", "")).toBe(false);
    expect(checkPassphrase("anything", undefined)).toBe(false);
  });
});

describe("isSessionOpen", () => {
  it("合言葉から作った Cookie なら開いている", () => {
    const v = createSessionValue(SECRET, now);
    expect(v).toBeDefined();
    expect(isSessionOpen(v, SECRET, now)).toBe(true);
  });
  it("Cookie に合言葉そのものは入らない", () => {
    expect(createSessionValue(SECRET, now)).not.toContain(SECRET);
  });
  it("Cookie が無い・形が違う・作り替えたなら開いていない", () => {
    expect(isSessionOpen(undefined, SECRET, now)).toBe(false);
    expect(isSessionOpen("", SECRET, now)).toBe(false);
    expect(isSessionOpen(SECRET, SECRET, now)).toBe(false);
    const v = createSessionValue(SECRET, now) ?? "";
    const [exp, sig] = v.split(".");
    expect(isSessionOpen(`${Number(exp) + 1000}.${sig}`, SECRET, now)).toBe(false);
    expect(isSessionOpen(`${exp}.${"0".repeat(64)}`, SECRET, now)).toBe(false);
  });
  it("違う合言葉で作った Cookie は開いていない（合言葉を変えると前の Cookie は使えない）", () => {
    const v = createSessionValue("another-dummy", now);
    expect(isSessionOpen(v, SECRET, now)).toBe(false);
  });
  it("環境変数が未設定なら開いていない・作れない", () => {
    const v = createSessionValue(SECRET, now);
    expect(isSessionOpen(v, undefined, now)).toBe(false);
    expect(isSessionOpen(v, "", now)).toBe(false);
    expect(createSessionValue(undefined, now)).toBeUndefined();
  });
  it("7日を過ぎた Cookie は開いていない", () => {
    const v = createSessionValue(SECRET, now);
    const almost = new Date(now.getTime() + (SHOP_SESSION_SECONDS - 1) * 1000);
    const after = new Date(now.getTime() + SHOP_SESSION_SECONDS * 1000);
    expect(isSessionOpen(v, SECRET, almost)).toBe(true);
    expect(isSessionOpen(v, SECRET, after)).toBe(false);
  });
});
