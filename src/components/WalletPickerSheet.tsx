"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useConnect } from "wagmi";
import { useI18n } from "@/lib/i18n";
import { Logo } from "./Logo";
import clsx from "clsx";

type Props = {
  open: boolean;
  onClose: () => void;
};

const CONNECT_TIMEOUT_MS = 10_000;

export function WalletPickerSheet({ open, onClose }: Props) {
  const { t } = useI18n();
  const { connectors, connect, status, error } = useConnect();
  const [mounted, setMounted] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => setMounted(true), []);

  // Body scroll lock while open
  useEffect(() => {
    if (typeof document === "undefined" || !open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Reset timeout flag on each new attempt
  useEffect(() => {
    if (status === "pending") setTimedOut(false);
  }, [status]);

  // Dedupe connectors by id — prevents duplicate wallet entries
  const uniqueConnectors = connectors.filter(
    (c, i, arr) => arr.findIndex((c2) => c2.id === c.id) === i
  );

  if (!mounted || !open) return null;
  const connecting = status === "pending";
  const isIOS =
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent);

  async function handleConnect(c: (typeof connectors)[number]) {
    setTimedOut(false);
    try {
      // Race the connect() against a 10s timeout — Issue 3 fix.
      // Brave often hangs silently if its popup was dismissed; we surface
      // a clear timeout message instead of an indefinite spinner.
      await Promise.race([
        connect({ connector: c }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("__wallet_timeout__")),
            CONNECT_TIMEOUT_MS
          )
        ),
      ]);
      onClose();
    } catch (e) {
      const err = e as Error & { code?: number; message: string };
      if (err.message === "__wallet_timeout__") {
        setTimedOut(true);
      }
      // wagmi/viem errors bubble up via `error` state from useConnect.
    }
  }

  const finalError = timedOut
    ? "Tu billetera no respondió. Asegúrate de que esté desbloqueada y acepta la solicitud de conexión."
    : error
    ? getConnectorError(error)
    : null;

  return createPortal(
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallet-sheet-title"
    >
      <button
        type="button"
        aria-label={t.common.close}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in cursor-default"
      />

      <div
        className={clsx(
          "fixed bottom-0 left-0 right-0 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-md sm:w-full",
          "bg-bg rounded-t-2xl sm:rounded-2xl shadow-elevated",
          "animate-slide-up",
          "pb-[calc(20px+env(safe-area-inset-bottom))]"
        )}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-sm pb-xs">
          <div className="w-10 h-1 rounded-full bg-ink/20" aria-hidden="true" />
        </div>

        {/* Header */}
        <div className="px-lg pt-xs pb-md flex items-start justify-between">
          <div className="flex items-center gap-sm pr-sm">
            <Logo className="w-9 h-9" />
            <div>
              <h3
                id="wallet-sheet-title"
                className="text-subhead font-bold text-ink leading-tight"
              >
                {t.wallet.connect}
              </h3>
              <p className="text-small text-ink/60 mt-xs">
                Tus fondos quedan en tu billetera. Remes no los toca.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface text-ink/60"
            aria-label={t.common.close}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
              aria-hidden="true"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* iOS Safari fallback — Issue 2 fix */}
        {isIOS && connectors.length > 0 && (
          <div className="mx-lg mb-sm p-sm rounded-md bg-accent/10">
            <p className="text-small text-ink/80 leading-snug">
              En iPhone, abre esta página dentro de la app de MetaMask o Coinbase Wallet para conectar.{" "}
              <a
                className="font-semibold text-primary underline"
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Cómo conectar en iPhone
              </a>
            </p>
          </div>
        )}

        {/* Connectors list */}
        <div className="px-lg space-y-xs">
          {uniqueConnectors.map((c) => (
            <ConnectorButton
              key={c.uid}
              connector={c}
              connecting={connecting || timedOut}
              onClick={() => handleConnect(c)}
            />
          ))}
        </div>

        {/* Error / timeout */}
        {finalError && (
          <div className="mx-lg mt-md p-sm rounded-md bg-error/10 border border-error/30">
            <p className="text-small text-error font-medium">{finalError}</p>
          </div>
        )}

        {/* Cancelar at bottom of sheet */}
        <div className="mt-md border-t border-ink/5">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-12 text-body text-ink/60 font-medium hover:bg-surface transition-colors"
          >
            {t.common.cancel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * ConnectorButton — single wallet option row.
 * Icon + display name + connector-type label (Detectada / QR).
 */
function ConnectorButton({
  connector,
  connecting,
  onClick,
}: {
  connector: ReturnType<typeof useConnect>["connectors"][number];
  connecting: boolean;
  onClick: () => void;
}) {
  const brand = getWalletBrand(connector.id, connector.name);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={connecting}
      className={clsx(
        "w-full h-14 rounded-xl bg-surface border border-ink/5",
        "flex items-center justify-between px-md",
        "transition-colors duration-150 hover:bg-ink/5",
        "focus-visible:shadow-focus focus-visible:outline-none",
        connecting && "opacity-60 cursor-wait"
      )}
    >
      <div className="flex items-center gap-sm">
        <img
          src={brand.icon}
          alt=""
          width={32}
          height={32}
          className="w-8 h-8 rounded-lg object-contain"
          aria-hidden="true"
        />
        <span className="text-body font-semibold text-ink">
          {brand.displayName}
        </span>
      </div>
      <span className="text-micro text-ink/50 uppercase tracking-wider">
        {connector.type === "injected" ? "Detectada" : "QR"}
      </span>
    </button>
  );
}

/**
 * Wallet brand registry — covers every connector id wagmi v2 emits AND
 * the standard EIP-5749 / EIP-6963 flag names so we never show raw IDs.
 *
 * EIP-6963 injects each wallet with its own `info.uuid` like `isMetaMask`,
 * `com.brave.wallet`, `io.rabby`, etc. — those flow in via the
 * `targetMap` lookup in wagmi's injected connector and end up as
 * `connector.id` here.
 */
type Brand = { displayName: string; icon: string };

const BRAND_REGISTRY: Record<string, Brand> = {
  // wagmi v2 connector ids
  injected: {
    displayName: "Billetera del navegador",
    icon: "/icons/wallets/metamask.svg",
  },
  metaMask: {
    displayName: "MetaMask",
    icon: "/icons/wallets/metamask.svg",
  },
  brave: {
    displayName: "Brave Wallet",
    icon: "/icons/wallets/brave.svg",
  },
  coinbaseWalletSDK: {
    displayName: "Coinbase Wallet",
    icon: "/icons/wallets/coinbase.svg",
  },
  walletConnect: {
    displayName: "WalletConnect",
    icon: "/icons/wallets/walletconnect.svg",
  },

  // EIP-5749 / EIP-6963 raw flag names (defense-in-depth for any
  // future connector that surfaces an unhandled id)
  isMetaMask: {
    displayName: "MetaMask",
    icon: "/icons/wallets/metamask.svg",
  },
  "com.brave.wallet": {
    displayName: "Brave Wallet",
    icon: "/icons/wallets/brave.svg",
  },
  isBraveWallet: {
    displayName: "Brave Wallet",
    icon: "/icons/wallets/brave.svg",
  },
  io: {
    displayName: "Billetera del navegador",
    icon: "/icons/wallets/metamask.svg",
  },
};

const NEUTRAL_BRAND: Brand = {
  displayName: "Billetera",
  icon: "/icons/wallets/metamask.svg",
};

function getWalletBrand(id: string, name?: string): Brand {
  if (id in BRAND_REGISTRY) return BRAND_REGISTRY[id];

  // Prefer the display name wagmi already computed for us.
  if (name && name !== id && name !== "Injected") {
    return {
      displayName: name,
      icon: BRAND_REGISTRY[id]?.icon ?? NEUTRAL_BRAND.icon,
    };
  }

  // EIP-6963 UUIDs often look like `isMetaMask`, `com.brave.wallet`,
  // `io.rabby`, etc. Pattern-match on substrings before giving up.
  const lower = (id || "").toLowerCase();
  if (lower.includes("metamask")) {
    return BRAND_REGISTRY.isMetaMask;
  }
  if (lower.includes("brave")) {
    return BRAND_REGISTRY.isBraveWallet;
  }
  if (lower.includes("rabby")) {
    return {
      displayName: "Rabby Wallet",
      icon: "/icons/wallets/metamask.svg",
    };
  }
  if (lower.includes("coinbase")) {
    return BRAND_REGISTRY.coinbaseWalletSDK;
  }
  if (lower.includes("walletconnect") || lower.includes("wc")) {
    return BRAND_REGISTRY.walletConnect;
  }

  return NEUTRAL_BRAND;
}

/**
 * getConnectorError — categorizes wagmi/viem errors into Spanish-friendly
 * messages. If we don't recognize the shape, surface the raw error so the
 * user can copy/paste it for support (catches edge cases like
 * "Already processing eth_requestAccounts" or unexpected RPC errors).
 */
function getConnectorError(error: Error): string {
  const msg = error.message || "";
  // iOS Brave phantom "MetaMask" — internal RPC error
  if (msg.includes("An internal error has occurred")) {
    return "Tu billetera no respondió. Prueba con otra opción o abre esta página dentro de la app de MetaMask en iPhone.";
  }
  // Brave wallet locked / undefined response crash
  if (
    msg.includes("undefined is not an object") ||
    msg.includes("Cannot read properties of undefined")
  ) {
    return "Tu billetera no respondió. Desbloquéala e intenta de nuevo.";
  }
  if (msg.includes("connector not found")) {
    return "Conector no disponible. Recarga la página e intenta de nuevo.";
  }
  if (msg.includes("Provider not found") || msg.includes("provider not found")) {
    return "Billetera no encontrada. Instala la extensión o usa WalletConnect con QR.";
  }
  if (msg.includes("rejected") || msg.includes("denied")) {
    return "Conexión rechazada por el usuario.";
  }
  if (msg.includes("locked")) {
    return "Tu billetera está bloqueada. Ábrela y vuelve a intentar.";
  }
  if (
    msg.includes("wrong network") ||
    msg.includes("chain mismatch") ||
    msg.includes("Unrecognized chain")
  ) {
    return "Red incorrecta. Cambia a Base en tu billetera.";
  }
  if (msg.includes("rate limit") || msg.includes("Limit exceeded")) {
    return "Demasiados intentos. Espera un minuto e intenta de nuevo.";
  }
  if (
    msg.includes("already pending") ||
    msg.includes("Already processing")
  ) {
    return "Ya hay una solicitud pendiente en tu billetera. Ábrela para responder.";
  }
  const truncated = msg.length > 80 ? msg.slice(0, 80) + "..." : msg;
  return `Error: ${truncated}`;
}