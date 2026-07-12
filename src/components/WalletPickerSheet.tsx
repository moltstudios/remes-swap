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

/**
 * WalletPickerSheet — bottom-sheet modal, portaled to document.body.
 *
 * Anchored to the bottom on mobile (with safe-area padding), centered on desktop.
 * Includes a drag handle, a back tap on the dimmed overlay to dismiss,
 * and a Cancelar button at the bottom of the sheet.
 *
 * Per Ghost (Timothy's screenshot review):
 * - Bottom-sheet, not top — position: fixed; bottom: 0
 * - pb-[env(safe-area-inset-bottom)] so iOS Safari toolbar doesn't cover
 * - Dim overlay (bg-black/40) covers page behind including TrustBar
 * - Slide-up animation 200-280ms with overshoot ease
 * - Portal at document.body to avoid z-index fights with sticky header
 */
export function WalletPickerSheet({ open, onClose }: Props) {
  const { t } = useI18n();
  const { connectors, connect, status, error } = useConnect();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Lock body scroll while the sheet is open (mobile UX)
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
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

  if (!mounted || !open) return null;
  const connecting = status === "pending";

  return createPortal(
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="wallet-sheet-title">
      {/* Overlay */}
      <button
        type="button"
        aria-label={t.common.close}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in cursor-default"
      />

      {/* Bottom sheet — slides up, anchored to bottom on mobile, centered on sm+ */}
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

        {/* Header row: title + close */}
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

        {/* Connectors list */}
        <div className="px-lg space-y-xs">
          {connectors.map((c) => (
            <button
              type="button"
              key={c.uid}
              onClick={() => {
                connect({ connector: c });
                onClose();
              }}
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
                <WalletConnectorIcon id={c.id} />
                <span className="text-body font-semibold text-ink">
                  {getConnectorName(c.id)}
                </span>
              </div>
              <span className="text-micro text-ink/50 uppercase tracking-wider">
                {c.type === "injected" ? "Detectada" : "QR"}
              </span>
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mx-lg mt-md p-sm rounded-md bg-error/10 border border-error/30">
            <p className="text-small text-error font-medium">
              {getConnectorError(error)}
            </p>
          </div>
        )}

        {/* Hairline + Cancelar (per Ghost #3: at BOTTOM of sheet, not top) */}
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
 * getConnectorName — for the generic 'injected' connector, we can't know
 * in advance whether it's MetaMask, Brave, Rabby, or Phantom. Show a
 * neutral label. After the user connects, we rename the pill in the
 * header based on the actual provider (see WalletButton.tsx).
 */
function getConnectorName(id: string): string {
  switch (id) {
    case "injected":
      return "Billetera del navegador";
    case "coinbaseWalletSDK":
      return "Coinbase Wallet";
    case "walletConnect":
      return "WalletConnect";
    default:
      return id;
  }
}

/**
 * getConnectorError — categorizes wagmi/viem errors into Spanish-friendly
 * messages. If we don't recognize the shape, surface the raw error code
 * so the user can copy/paste it for support (catches edge cases like
 * "Already processing eth_requestAccounts" or unexpected RPC errors).
 */
function getConnectorError(error: Error): string {
  const msg = error.message || "";
  if (msg.includes("Provider not found") || msg.includes("provider not found")) {
    return "Billetera no encontrada. Instala la extensión o usa WalletConnect con QR.";
  }
  if (msg.includes("rejected") || msg.includes("denied")) {
    return "Conexión rechazada por el usuario.";
  }
  if (msg.includes("connector not found")) {
    return "Conector no disponible. Recarga la página e intenta de nuevo.";
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
  if (msg.includes("already pending")) {
    return "Ya hay una solicitud pendiente en tu billetera. Ábrela para responder.";
  }
  // Fallback: surface a truncated message + the error name so support can debug
  const truncated = msg.length > 80 ? msg.slice(0, 80) + "..." : msg;
  return `Error: ${truncated}`;
}

/**
 * WalletConnectorIcon — uses real brand SVGs from /public/icons/wallets/.
 * Falls back to the MetaMask orange tile for the generic 'injected'
 * connector (covers Brave, Rabby, Phantom, etc. — we can't know
 * pre-connect which is installed).
 */
function WalletConnectorIcon({ id }: { id: string }) {
  const iconMap: Record<string, string> = {
    injected: "/icons/wallets/metamask.svg",
    coinbaseWalletSDK: "/icons/wallets/coinbase.svg",
    walletConnect: "/icons/wallets/walletconnect.svg",
  };
  const src = iconMap[id];
  if (!src) {
    return (
      <span className="w-8 h-8 rounded-full bg-ink flex items-center justify-center text-white text-xs font-bold">
        ?
      </span>
    );
  }
  return (
    <img
      src={src}
      alt=""
      width={32}
      height={32}
      className="w-8 h-8 rounded-lg object-contain"
      aria-hidden="true"
    />
  );
}