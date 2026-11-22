// お客さん情報の検証（docs/spec.md「予約の確定」）

export const NAME_MAX = 30;
export const EMAIL_MAX = 100;

export type Customer = { name: string; phone: string; email: string };
export type CustomerErrors = Partial<Record<keyof Customer, string>>;
export type CustomerInput = { name?: string; phone?: string; email?: string };

export type CustomerResult =
  | { ok: true; customer: Customer }
  | { ok: false; errors: CustomerErrors };

/** 全角の数字・英字・記号を半角に。ハイフンに見える文字は "-" にそろえる */
function toHalfWidth(v: string): string {
  return v.normalize("NFKC").replace(/[‐‑‒–—―−ーｰ─━]/g, "-");
}

export function validateName(raw: string | undefined): { value: string; error?: string } {
  const value = (raw ?? "").replace(/[\s　]+/g, " ").trim();
  if (value === "") return { value, error: "お名前を入力してください" };
  if (/[\u0000-\u001f\u007f]/.test(value)) return { value, error: "お名前に使えない文字があります" };
  if ([...value].length > NAME_MAX) return { value, error: `お名前は${NAME_MAX}文字までで入力してください` };
  return { value };
}

/** 数字とハイフンで10〜11桁。保存するのはハイフンを除いた数字 */
export function validatePhone(raw: string | undefined): { value: string; error?: string } {
  const text = toHalfWidth((raw ?? "").trim());
  if (text === "") return { value: text, error: "電話番号を入力してください" };
  if (!/^\d+(-\d+)*$/.test(text)) {
    return { value: text, error: "電話番号は数字とハイフンで入力してください" };
  }
  const digits = text.replace(/-/g, "");
  if (digits.length < 10 || digits.length > 11) {
    return { value: digits, error: "電話番号は10〜11桁で入力してください" };
  }
  return { value: digits };
}

export function validateEmail(raw: string | undefined): { value: string; error?: string } {
  const value = toHalfWidth((raw ?? "").trim());
  if (value === "") return { value, error: "メールアドレスを入力してください" };
  if (value.length > EMAIL_MAX) {
    return { value, error: `メールアドレスは${EMAIL_MAX}文字までで入力してください` };
  }
  if (!/^[A-Za-z0-9._%+'-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/.test(value)) {
    return { value, error: "メールアドレスの形が正しくありません" };
  }
  return { value };
}

export function validateCustomer(input: CustomerInput): CustomerResult {
  const name = validateName(input.name);
  const phone = validatePhone(input.phone);
  const email = validateEmail(input.email);
  const errors: CustomerErrors = {};
  if (name.error) errors.name = name.error;
  if (phone.error) errors.phone = phone.error;
  if (email.error) errors.email = email.error;
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, customer: { name: name.value, phone: phone.value, email: email.value } };
}
