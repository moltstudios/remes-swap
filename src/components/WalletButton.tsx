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
import clsx from "clsx";

type Props = {
  variant?: "compact" | "full";
};

export function WalletButton({ variant = "full" }: Props) {
  const { t } = useI18n();
  const { address, isConnected, chain } = useAccount();
  const { connectors, connect, status, error } = useConnect();
  const { disconnect } = useDisconnect();
  const [mounted, setMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Avoid SSR mismatch — wagmi is SSR-aware but the connector list is client-only
  useEffect(() => setMounted(true), []);

  // USDC balance for the connected wallet
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
          "rounded-pill bg-ink-900 text-white font-semibold",
          variant === "compact" ? "h-9 px-4 text-small" : "h-12 px-6 text-body"
        )}
        disabled
      >
        {t.wallet.connect}
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowModal((s) => !s)}
          className={clsx(
            "flex items-center gap-2 rounded-pill border border-ink-200 bg-white",
            "hover:bg-surface-alt transition-colors",
            variant === "compact" ? "h-9 px-3" : "h-12 px-4"
          )}
        >
          <span className="w-2 h-2 rounded-full bg-success" />
          <span className="text-small font-medium text-ink-900 tabular-nums">
            {truncateAddress(address)}
          </span>
          {usdcBalance && variant === "full" && (
            <span className="text-small text-ink-500 tabular-nums">
              ·{" "}
              {formatTokenAmount(usdcBalance.value, usdcBalance.decimals, 2)}{" "}
              USDC
            </span>
          )}
        </button>

        {showModal && (
          <div
            className="absolute right-0 mt-2 w-72 bg-white rounded-card shadow-elevated border border-ink-100 p-2 z-40"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-2 border-b border-ink-100">
              <p className="text-micro text-ink-400 uppercase tracking-wider">
                {t.wallet.connected}
              </p>
              <p className="text-small font-mono text-ink-900 mt-1 break-all">
                {address}
              </p>
              {chain && (
                <p className="text-micro text-ink-500 mt-1">
                  {chain.name}
                </p>
              )}
            </div>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(address);
                setShowModal(false);
              }}
              className="w-full text-left px-3 py-2.5 text-small text-ink-700 hover:bg-surface-alt rounded-md"
            >
              {t.wallet.copyAddress}
            </button>
            <a
              href={`https://basescan.org/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-3 py-2.5 text-small text-ink-700 hover:bg-surface-alt rounded-md"
            >
              {t.wallet.viewOnExplorer}
            </a>
            <button
              onClick={() => {
                disconnect();
                setShowModal(false);
              }}
              className="w-full text-left px-3 py-2.5 text-small text-ink-700 hover:bg-surface-alt rounded-md border-t border-ink-100 mt-1"
            >
              {t.wallet.disconnect}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Not connected — show connect button
  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={clsx(
          "rounded-pill bg-ink-900 text-white font-semibold transition-all active:scale-[0.98]",
          variant === "compact" ? "h-9 px-4 text-small" : "h-12 px-6 text-body"
        )}
      >
        {status === "pending" ? t.wallet.connecting : t.wallet.connect}
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink-900/40 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white w-full sm:w-96 sm:rounded-card rounded-t-card sm:my-8 p-5 shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-heading text-ink-900 mb-1">
              {t.wallet.connect}
            </h3>
            <p className="text-small text-ink-500 mb-5">
              {t.wallet.mobileNote}
            </p>

            <div className="space-y-2">
              {connectors.map((c) => (
                <button
                  key={c.uid}
                  onClick={() => {
                    connect({ connector: c });
                    setShowModal(false);
                  }}
                  className="w-full flex items-center justify-between p-4 rounded-card border border-ink-200 hover:border-ink-900 hover:bg-surface-alt transition-all"
                >
                  <span className="font-medium text-ink-900">
                    {getConnectorName(c.id)}
                  </span>
                  <span className="text-micro text-ink-400 uppercase tracking-wider">
                    {c.type === "injected" ? t.wallet.installed : "QR"}
                  </span>
                </button>
              ))}
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-card bg-red-50 border border-red-200">
                <p className="text-small text-red-700 font-medium">
                  {getErrorMessage(error)}
                </p>
                {error.message?.includes("Provider not found") && (
                  <a
                    href="https://www.coinbase.com/wallet/downloads"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mt-1 text-micro text-red-500 underline"
                  >
                    Descargar Coinbase Wallet →
                  </a>
                )}
              </div>
            )}

            <button
              onClick={() => setShowModal(false)}
              className="w-full mt-4 btn-ghost"
            >
              {t.common.cancel}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function getConnectorName(id: string): string {
  switch (id) {
    case "injected":
      return "MetaMask / Navegador";
    case "coinbaseWalletSDK":
      return "Coinbase Wallet";
    case "walletConnect":
      return "WalletConnect";
    case "walletConnectSDK":
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
  if (msg.includes("rejected") || msg.includes("User rejected")) {
    return "Conexión rechazada por el usuario.";
  }
  if (msg.includes("connector not found")) {
    return "Conector no disponible. Recargá la página e intentá de nuevo.";
  }
  // Truncate long errors
  return msg.length > 100 ? msg.slice(0, 100) + "..." : msg;
}