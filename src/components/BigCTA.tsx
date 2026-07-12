"use client";

import type { ReactNode } from "react";

export type CTAState =
  | "rest"
  | "hover"
  | "pressed"
  | "loading"
  | "disabled"
  | "error";

type Props = {
  children: ReactNode;
  state?: CTAState;
  onClick?: () => void;
  type?: "button" | "submit";
  ariaLabel?: string;
};

/**
 * BigCTA — single primary action per screen.
 * States: rest · hover · pressed · loading · disabled · error.
 */
export function BigCTA({
  children,
  state = "rest",
  onClick,
  type = "button",
  ariaLabel,
}: Props) {
  const isDisabled = state === "disabled" || state === "loading";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      data-state={state}
      aria-label={ariaLabel}
      aria-busy={state === "loading"}
      className="cta-primary"
    >
      {state === "loading" && (
        <span className="inline-block w-4 h-4 mr-sm animate-spin" aria-hidden="true">
          <Spinner />
        </span>
      )}
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
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