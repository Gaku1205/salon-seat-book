"use client";

import Link from "next/link";
import { useActionState } from "react";
import { type ConfirmState, confirmReservation } from "@/app/reserve/confirm/actions";

type Props = {
  menu: string;
  staff: string;
  date: string;
  time: string;
  /** 選んだ内容を保って /reserve に戻るリンク */
  backHref: string;
};

const initial: ConfirmState = { status: "idle", errors: {}, values: { name: "", phone: "", email: "" } };

export function ConfirmForm({ menu, staff, date, time, backHref }: Props) {
  const [state, formAction, pending] = useActionState(confirmReservation, initial);
  const { errors, values } = state;

  return (
    <form action={formAction} className="form" noValidate>
      <input type="hidden" name="menu" value={menu} />
      <input type="hidden" name="staff" value={staff} />
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="time" value={time} />

      {state.status === "full" && (
        <div className="notice" role="alert">
          <p className="notice-text">この時間は埋まってしまいました。ほかの時間をお選びください</p>
          <Link href={backHref} className="button">
            時間を選び直す
          </Link>
        </div>
      )}

      <div className="field">
        <label htmlFor="name" className="field-label">お名前</label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          defaultValue={values.name}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "name-error" : undefined}
          className="field-input"
        />
        {errors.name && <p id="name-error" className="field-error">{errors.name}</p>}
      </div>

      <div className="field">
        <label htmlFor="phone" className="field-label">電話番号</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          defaultValue={values.phone}
          aria-invalid={errors.phone ? true : undefined}
          aria-describedby={errors.phone ? "phone-error" : "phone-hint"}
          className="field-input"
        />
        <p id="phone-hint" className="field-hint">数字とハイフンで入力してください</p>
        {errors.phone && <p id="phone-error" className="field-error">{errors.phone}</p>}
      </div>

      <div className="field">
        <label htmlFor="email" className="field-label">メールアドレス</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={values.email}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "email-error" : undefined}
          className="field-input"
        />
        {errors.email && <p id="email-error" className="field-error">{errors.email}</p>}
      </div>

      <button type="submit" className="button" disabled={pending}>
        {pending ? "予約しています" : "この内容で予約する"}
      </button>
      <p className="book-small">予約は無料です。お支払いはお店で</p>
    </form>
  );
}
