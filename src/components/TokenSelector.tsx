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
        className={clsx(
          "flex items-center gap-2 px-3 py-2 rounded-pill",
          "bg-surface-alt hover:bg-ink-100 transition-colors",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        <TokenLogo symbol={selected.symbol} size="sm" />
        <span className="font-semibold text-ink-900">{selected.symbol}</span>
        <ChevronDown className="w-4 h-4 text-ink-500" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink-900/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white w-full sm:w-96 sm:rounded-card rounded-t-card sm:my-8 p-5 shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-heading text-ink-900 mb-4">
              {t.swap.selectToken}
            </h3>
            <div className="space-y-1">
              {filtered.map((token) => (
                <button
                  key={token.address}
                  onClick={() => {
                    onChange(token);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-card hover:bg-surface-alt transition-colors"
                >
                  <TokenLogo symbol={token.symbol} />
                  <div className="text-left">
                    <p className="font-semibold text-ink-900">
                      {token.symbol}
                    </p>
                    <p className="text-small text-ink-500">{token.name}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
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
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}