import { describe, expect, it } from "vitest";
import { NAME_MAX, validateCustomer, validateEmail, validateName, validatePhone } from "./customer";

describe("validateName", () => {
  it("空・空白だけはエラー", () => {
    expect(validateName("").error).toBeDefined();
    expect(validateName(undefined).error).toBeDefined();
    expect(validateName("  　 ").error).toBeDefined();
  });
  it("前後の空白は取る", () => {
    expect(validateName("  山田 花子 ")).toEqual({ value: "山田 花子" });
  });
  it("最大文字数を超えるとエラー", () => {
    expect(validateName("あ".repeat(NAME_MAX)).error).toBeUndefined();
    expect(validateName("あ".repeat(NAME_MAX + 1)).error).toBeDefined();
  });
});

describe("validatePhone", () => {
  it("空はエラー", () => {
    expect(validatePhone("").error).toBeDefined();
  });
  it("ハイフンありなし・11桁と10桁を受け付け、数字だけを返す", () => {
    expect(validatePhone("090-1234-5678")).toEqual({ value: "09012345678" });
    expect(validatePhone("0312345678")).toEqual({ value: "0312345678" });
  });
  it("前後の空白は取る", () => {
    expect(validatePhone("  09012345678 ").value).toBe("09012345678");
  });
  it("全角の数字・ハイフンは半角にそろえる", () => {
    expect(validatePhone("０９０－１２３４－５６７８")).toEqual({ value: "09012345678" });
    expect(validatePhone("090ー1234ー5678").error).toBeUndefined();
  });
  it("桁が足りない・多いとエラー", () => {
    expect(validatePhone("090123456").error).toBeDefined();
    expect(validatePhone("090123456789").error).toBeDefined();
  });
  it("数字とハイフン以外・ハイフンの位置がおかしいとエラー", () => {
    expect(validatePhone("090-1234-abcd").error).toBeDefined();
    expect(validatePhone("-09012345678").error).toBeDefined();
    expect(validatePhone("090--12345678").error).toBeDefined();
    expect(validatePhone("090 1234 5678").error).toBeDefined();
  });
});

describe("validateEmail", () => {
  it("空はエラー", () => {
    expect(validateEmail("").error).toBeDefined();
  });
  it("ふつうの形は通り、前後の空白は取る", () => {
    expect(validateEmail(" haru@example.com ")).toEqual({ value: "haru@example.com" });
    expect(validateEmail("a.b+c@mail.example.co.jp").error).toBeUndefined();
  });
  it("全角は半角にそろえる", () => {
    expect(validateEmail("ｈａｒｕ＠ｅｘａｍｐｌｅ．ｃｏｍ").value).toBe("haru@example.com");
  });
  it("形がおかしいとエラー", () => {
    for (const v of ["haru", "haru@", "@example.com", "haru@example", "ha ru@example.com", "a@b@c.com", "haru@.com"]) {
      expect(validateEmail(v).error, v).toBeDefined();
    }
  });
});

describe("validateCustomer", () => {
  it("全部正しければ整えた値を返す", () => {
    const r = validateCustomer({ name: " 山田 ", phone: "090-1234-5678", email: "a@example.com" });
    expect(r).toEqual({
      ok: true,
      customer: { name: "山田", phone: "09012345678", email: "a@example.com" },
    });
  });
  it("項目ごとにエラーを返す", () => {
    const r = validateCustomer({ name: "", phone: "1", email: "a@example.com" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(Object.keys(r.errors).sort()).toEqual(["name", "phone"]);
    }
  });
});
