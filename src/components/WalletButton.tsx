"use client";

import { useEffect, useState } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useBalance,
  useSwitchChain,
} from "wagmi";
import { base } from "wagmi/chains";
import { useI18n } from "@/lib/i18n";
import { truncateAddress, formatTokenAmount } from "@/lib/format";
import { BASE_TOKENS } from "@/lib/web3/contracts";
import { WalletPickerSheet } from "./WalletPickerSheet";
import clsx from "clsx";

type Props = {
  variant?: "compact" | "full";
};

/**
 * WalletButton — 4 states per brief: disconnected · connecting · connected · wrong-network.
 * The wallet picker itself is the bottom-sheet modal in `WalletPickerSheet.tsx`.
 */
export function WalletButton({ variant = "full" }: Props) {
  const { t } = useI18n();
  const { address, isConnected, chain } = useAccount();
  const { status } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: switching } = useSwitchChain();
  const [mounted, setMounted] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  const { data: usdcBalance } = useBalance({
    address,
    token: BASE_TOKENS.USDC.address,
    chainId: chain?.id,
    query: { enabled: isConnected },
  });

  if (!mounted) {
    return (
      <button
        className={clsx(
          "rounded-pill bg-primary text-white font-bold",
          variant === "compact" ? "h-9 px-4 text-small" : "h-12 px-6 text-body"
        )}
        disabled
      >
        {t.wallet.connect}
      </button>
    );
  }

  // WRONG NETWORK
  if (isConnected && chain && chain.id !== base.id) {
    return (
      <button
        onClick={() => switchChain({ chainId: base.id })}
        disabled={switching}
        className="!w-auto !h-9 px-md text-small font-bold rounded-pill bg-error text-white hover:bg-error/90 transition-colors"
      >
        {switching ? "..." : t.wallet.switchNetwork}
      </button>
    );
  }

  // CONNECTED — wallet pill (down-arrow menu)
  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          onClick={() => setMenuOpen((s) => !s)}
          className={clsx(
            "flex items-center gap-sm rounded-pill bg-white border border-ink/10",
            "hover:bg-surface transition-colors",
            "focus-visible:shadow-focus focus-visible:outline-none",
            variant === "compact" ? "h-9 px-sm" : "h-12 px-md"
          )}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
        >
          <span className="w-2 h-2 rounded-full bg-success" aria-hidden="true" />
          <span className="text-small font-bold text-ink tabular-nums">
            {truncateAddress(address)}
          </span>
          {usdcBalance && variant === "full" && (
            <span className="text-small text-ink/60 tabular-nums">
              ·{" "}
              {formatTokenAmount(usdcBalance.value, usdcBalance.decimals, 2)}{" "}
              USDC
            </span>
          )}
        </button>
        {menuOpen && (
          <>
            <button
              className="fixed inset-0 z-30 cursor-default"
              onClick={() => setMenuOpen(false)}
              aria-label={t.common.close}
            />
            <div
              role="menu"
              className="absolute right-0 mt-xs w-64 bg-bg rounded-lg shadow-elevated border border-ink/5 p-xs z-40 animate-tick-in"
            >
              <div className="px-sm py-sm border-b border-ink/5">
                <p className="text-micro text-ink/50 uppercase tracking-wider">
                  {t.wallet.connected}
                </p>
                <p className="text-small font-mono text-ink mt-xs break-all">
                  {address}
                </p>
              </div>
              <button
                role="menuitem"
                onClick={() => {
                  if (address) navigator.clipboard?.writeText(address);
                  setMenuOpen(false);
                }}
                className="w-full text-left px-sm py-sm text-small text-ink hover:bg-surface rounded-sm"
              >
                {t.wallet.copyAddress}
              </button>
              <button
                role="menuitem"
                onClick={() => {
                  disconnect();
                  setMenuOpen(false);
                }}
                className="w-full text-left px-sm py-sm text-small text-ink hover:bg-surface rounded-sm border-t border-ink/5 mt-xs"
              >
                {t.wallet.disconnect}
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // DISCONNECTED (or connecting) — pill that opens the bottom-sheet picker
  const connecting = status === "pending";
  return (
    <>
      <button
        onClick={() => setPickerOpen(true)}
        disabled={connecting}
        className={clsx(
          "rounded-pill font-bold transition-all active:scale-[0.98]",
          "focus-visible:shadow-focus focus-visible:outline-none",
          "bg-primary text-white hover:bg-primary-hover",
          variant === "compact" ? "h-9 px-4 text-small" : "h-12 px-6 text-body"
        )}
        aria-busy={connecting}
      >
        {connecting ? t.wallet.connecting : t.wallet.connect}
      </button>

      <WalletPickerSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
      />
    </>
  );
}
