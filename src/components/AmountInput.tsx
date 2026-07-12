"use client";

import { useState } from "react";
import { formatAmountInput } from "@/lib/format";

export type AmountState =
  | "empty"
  | "typing"
  | "loading"
  | "quoted"
  | "error"
  | "success";

type Props = {
  value: string;
  onChange: (v: string) => void;
  state?: AmountState;
  placeholder?: string;
  readOnly?: boolean;
  token: string;
  tokenLogo?: React.ReactNode;
  onMax?: () => void;
  decimals?: number;
  label?: string;
  muted?: boolean; // 90% opacity — for result fields where user doesn't type
};

/**
 * Amount input — bold display-size numerals, auto-formatted with commas.
 * States: empty · typing · loading · quoted · error · success.
 */
export function AmountInput({
  value,
  onChange,
  state = "empty",
  placeholder = "0",
  readOnly,
  token,
  tokenLogo,
  onMax,
  decimals = 6,
  label,
  muted,
}: Props) {
  const [focused, setFocused] = useState(false);

  const fieldState =
    state === "error" ? "error" : focused ? "focused" : undefined;

  // For input: show formatted (with commas). For change: pass clean digits.
  const displayValue = formatAmountInput(value);

  return (
    <div className="field-card" data-state={fieldState}>
      <div className="flex items-center justify-between mb-xs">
        <label className="text-micro text-ink/50 uppercase tracking-wider">
          {label}
        </label>
        {onMax && state !== "loading" && (
          <button
            type="button"
            onClick={onMax}
            className="text-micro font-semibold text-primary hover:text-primary-hover uppercase tracking-wider focus-visible:outline-none"
          >
            Máx
          </button>
        )}
      </div>
      <div className="flex items-end gap-sm">
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          aria-label={label}
          placeholder={placeholder}
          value={displayValue}
          onChange={(e) => onChange(sanitize(e.target.value, decimals))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          readOnly={readOnly}
          className={
            "amount-input flex-1 min-w-0" +
            (muted ? " opacity-90" : "")
          }
          data-state={state}
        />
        <div className="flex items-center gap-xs shrink-0 pb-1">
          {tokenLogo}
          <span className="text-body font-semibold text-ink">{token}</span>
        </div>
      </div>
      {state === "loading" && (
        <p className="text-small text-ink/50 mt-xs flex items-center gap-xs">
          <Spinner /> Pidiendo precio...
        </p>
      )}
      {state === "error" && (
        <p className="text-small text-error mt-xs">
          No pudimos leer el monto
        </p>
      )}
    </div>
  );
}

function sanitize(raw: string, decimals: number): string {
  if (!raw) return "";
  // Strip commas (from pasted formatted values) before sanitizing
  let cleaned = raw.replace(/,/g, "").replace(/[^0-9.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot !== -1) {
    cleaned =
      cleaned.slice(0, firstDot + 1) +
      cleaned.slice(firstDot + 1).replace(/\./g, "");
  }
  if (firstDot !== -1 && decimals >= 0) {
    const [w, f = ""] = cleaned.split(".");
    cleaned = `${w}.${f.slice(0, decimals)}`;
  }
  if (
    cleaned.length > 1 &&
    cleaned.startsWith("0") &&
    !cleaned.startsWith("0.")
  ) {
    cleaned = cleaned.replace(/^0+/, "") || "0";
  }
  return cleaned;
}

function Spinner() {
  return (
    <svg
      className="w-3 h-3 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeOpacity="0.25"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}