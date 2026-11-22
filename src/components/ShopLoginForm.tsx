"use client";

import { useActionState } from "react";
import { type LoginState, login } from "@/app/shop/login/actions";

const initial: LoginState = { status: "idle" };

export function ShopLoginForm() {
  const [state, formAction, pending] = useActionState(login, initial);
  const wrong = state.status === "wrong";

  return (
    <form action={formAction} className="form" noValidate>
      <div className="field">
        <label htmlFor="passphrase" className="field-label">合言葉</label>
        <input
          id="passphrase"
          name="passphrase"
          type="password"
          autoComplete="current-password"
          aria-invalid={wrong ? true : undefined}
          aria-describedby={wrong ? "passphrase-error" : undefined}
          className="field-input"
        />
        {wrong && (
          <p id="passphrase-error" className="field-error" role="alert">
            合言葉が違います
          </p>
        )}
      </div>
      <button type="submit" className="button" disabled={pending}>
        {pending ? "確かめています" : "開く"}
      </button>
    </form>
  );
}
