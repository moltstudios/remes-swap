"use client";

import { useState } from "react";
import clsx from "clsx";
import { TokenLogo } from "./TokenLogo";
import { useI18n } from "@/lib/i18n";
import type { TokenMeta } from "@/lib/tokens";

type Props = {
  selected: TokenMeta;
  onChange: (token: TokenMeta) => void;
  options: TokenMeta[];
  disabled?: boolean;
  exclude?: TokenMeta;
  label: string;
};

export function TokenSelector({
  selected,
  onChange,
  options,
  disabled,
  exclude,
  label,
}: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  const filtered = options.filter((o) => o.address !== exclude?.address);

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        data-state={open ? "open" : "rest"}
        className={clsx(
          "flex items-center gap-xs h-10 px-sm rounded-pill bg-surface",
          "font-semibold text-body text-ink",
          "hover:bg-surface/80 transition-colors",
          "focus-visible:shadow-focus focus-visible:outline-none",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        <TokenLogo symbol={selected.symbol} size="sm" />
        <span>{selected.symbol}</span>
        <ChevronDown className="w-4 h-4 text-ink/60" />
      </button>

      {open && (
        <>
          <button
            className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm cursor-default animate-tick-in"
            onClick={() => setOpen(false)}
            aria-label={t.common.close}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 sm:inset-0 sm:flex sm:items-center sm:justify-center pointer-events-none">
            <div className="bg-bg rounded-t-lg sm:rounded-lg w-full sm:w-96 p-lg shadow-card pointer-events-auto animate-sheet-up safe-bottom">
              <h3 className="text-subhead font-bold text-ink mb-md">
                {t.swap.selectToken}
              </h3>
              <div className="space-y-xs">
                {filtered.map((token) => (
                  <button
                    key={token.address}
                    onClick={() => {
                      onChange(token);
                      setOpen(false);
                    }}
                    className="w-full flex items-center gap-sm p-md rounded-md bg-surface hover:bg-surface/80 transition-colors focus-visible:shadow-focus focus-visible:outline-none"
                  >
                    <TokenLogo symbol={token.symbol} />
                    <div className="text-left">
                      <p className="font-semibold text-ink">{token.symbol}</p>
                      <p className="text-small text-ink/60">{token.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}