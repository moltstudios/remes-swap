"use client";

import { useEffect, useState } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useBalance,
} from "wagmi";
import { useI18n } from "@/lib/i18n";
import { truncateAddress, formatTokenAmount } from "@/lib/format";
import { BASE_TOKENS } from "@/lib/web3/contracts";
import { Logo } from "./Logo";
import clsx from "clsx";

type Props = {
  variant?: "compact" | "full";
};

/**
 * WalletButton — 4 states per brief: disconnected · connecting · connected · wrong-network.
 * Renders as: small pill in header, larger CTA inline. Single primary color.
 */
export function WalletButton({ variant = "full" }: Props) {
  const { t } = useI18n();
  const { address, isConnected, chain } = useAccount();
  const { connectors, connect, status, error } = useConnect();
  const { disconnect } = useDisconnect();
  const [mounted, setMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => setMounted(true), []);

  const { data: usdcBalance } = useBalance({
    address,
    token: BASE_TOKENS.USDC.address,
    chainId: chain?.id,
    query: { enabled: isConnected },
  });

  if (!mounted) {
    return (
      <button className="cta-primary !w-auto !h-10 px-md text-small" disabled>
        {t.wallet.connect}
      </button>
    );
  }

  // CONNECTED — wallet pill
  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowMenu((s) => !s)}
          className={clsx(
            "flex items-center gap-sm rounded-pill bg-surface hover:bg-surface/80",
            "transition-colors focus-visible:shadow-focus focus-visible:outline-none",
            variant === "compact" ? "h-10 px-sm" : "h-12 px-md"
          )}
          aria-expanded={showMenu}
          aria-haspopup="menu"
        >
          <span className="w-2 h-2 rounded-full bg-success" aria-hidden="true" />
          <span className="text-small font-medium text-ink tabular-nums">
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
        {showMenu && (
          <>
            <button
              className="fixed inset-0 z-30 cursor-default"
              onClick={() => setShowMenu(false)}
              aria-label={t.common.close}
            />
            <div
              role="menu"
              className="absolute right-0 mt-xs w-64 bg-bg rounded-lg shadow-card border border-ink/5 p-xs z-40 animate-tick-in"
            >
              <div className="px-sm py-sm border-b border-ink/5">
                <p className="text-micro text-ink/50 uppercase tracking-wider">
                  {t.wallet.connected}
                </p>
                <p className="text-small font-mono text-ink mt-xs break-all">
                  {address}
                </p>
                {chain && (
                  <p className="text-micro text-ink/50 mt-xs">{chain.name}</p>
                )}
              </div>
              <button
                role="menuitem"
                onClick={() => {
                  if (address) navigator.clipboard?.writeText(address);
                  setShowMenu(false);
                }}
                className="w-full text-left px-sm py-sm text-small text-ink hover:bg-surface rounded-sm"
              >
                {t.wallet.copyAddress}
              </button>
              <button
                role="menuitem"
                onClick={() => {
                  disconnect();
                  setShowMenu(false);
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

  // DISCONNECTED — connect button (CONNECTING shows same button, spinner inside)
  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="cta-primary !w-auto !h-10 px-md text-small"
        disabled={status === "pending"}
        aria-busy={status === "pending"}
      >
        {status === "pending" ? t.wallet.connecting : t.wallet.connect}
      </button>

      {showModal && (
        <>
          <button
            className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm cursor-default animate-tick-in"
            onClick={() => setShowModal(false)}
            aria-label={t.common.close}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 sm:inset-0 sm:flex sm:items-center sm:justify-center pointer-events-none">
            <div className="bg-bg rounded-t-lg sm:rounded-lg w-full sm:w-96 p-lg shadow-card pointer-events-auto animate-sheet-up safe-bottom">
              <div className="flex items-center gap-sm mb-md">
                <Logo className="w-10 h-10" />
                <div>
                  <h3 className="text-subhead font-bold text-ink">
                    {t.wallet.connect}
                  </h3>
                  <p className="text-small text-ink/60">
                    Tus fondos quedan en tu billetera. Remes no los toca.
                  </p>
                </div>
              </div>
              <div className="space-y-xs">
                {connectors.map((c) => (
                  <button
                    key={c.uid}
                    onClick={() => {
                      connect({ connector: c });
                      setShowModal(false);
                    }}
                    className="w-full flex items-center justify-between p-md rounded-md bg-surface hover:bg-surface/80 transition-colors focus-visible:shadow-focus focus-visible:outline-none"
                  >
                    <span className="font-semibold text-ink">
                      {getConnectorName(c.id)}
                    </span>
                    <span className="text-micro text-ink/50 uppercase tracking-wider">
                      {c.type === "injected" ? "Detectada" : "QR"}
                    </span>
                  </button>
                ))}
              </div>
              {error && (
                <div className="mt-md p-sm rounded-md bg-error/10 border border-error/30">
                  <p className="text-small text-error font-medium">
                    {getErrorMessage(error)}
                  </p>
                </div>
              )}
              <button
                onClick={() => setShowModal(false)}
                className="w-full mt-md text-small text-ink/60 font-medium h-10"
              >
                {t.common.cancel}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function getConnectorName(id: string): string {
  switch (id) {
    case "injected":
      return "MetaMask";
    case "coinbaseWalletSDK":
      return "Coinbase Wallet";
    case "walletConnect":
      return "WalletConnect";
    default:
      return id;
  }
}

function getErrorMessage(error: Error): string {
  const msg = error.message || "";
  if (msg.includes("Provider not found") || msg.includes("provider not found")) {
    return "Billetera no encontrada. Instalá la extensión o usá WalletConnect con QR.";
  }
  if (msg.includes("rejected")) {
    return "Conexión rechazada por el usuario.";
  }
  return msg.length > 100 ? msg.slice(0, 100) + "..." : msg;
}