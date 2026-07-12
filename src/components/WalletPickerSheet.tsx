"use client";

// src/components/WalletPickerSheet.tsx
//
// Contextual wallet picker. Renders ONLY what works in the current
// environment (HANDOFF.md target matrix):
//
//   iOS/Android browser, nothing injected  → 2 deep-link buttons
//                                            (open in MetaMask / Coinbase app)
//   Mobile in-app browser or Brave mobile  → the injected wallet(s) only
//   Desktop with extensions                → each EIP-6963 wallet once
//                                            + WalletConnect + Coinbase
//   Desktop, no extensions                 → WalletConnect + Coinbase
//
// Icons: EIP-6963 wallets show the icon they announce about themselves.
// Everything else uses the official brand SVGs in WalletIcons.tsx.
//
// WalletConnect renders OUR OWN QR view (display_uri → qrcode). The
// deprecated @walletconnect/modal is no longer mounted.

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useConnect, type Connector } from "wagmi";
import QRCode from "qrcode";
import { useI18n } from "@/lib/i18n";
import { detectWalletEnv, getDeepLinks, type WalletEnv } from "@/lib/wallet-env";
import {
  WalletOptionIcon,
  MetaMaskIcon,
  CoinbaseIcon,
  type BrandKey,
} from "./WalletIcons";
import { Logo } from "./Logo";
import clsx from "clsx";

type Props = {
  open: boolean;
  onClose: () => void;
};

const CONNECT_TIMEOUT_MS = 10_000;

// ---------------------------------------------------------------------------
// Option model
// ---------------------------------------------------------------------------

type ConnectorOption = {
  kind: "connector";
  connector: Connector;
  label: string;
  badge: "detectada" | "qr";
  brand: BrandKey;
  iconUri?: string;
};

type DeepLinkOption = {
  kind: "deeplink";
  id: "metamask" | "coinbase";
  label: string;
  href: string;
};

type WalletOption = ConnectorOption | DeepLinkOption;

/** Friendly labels for well-known EIP-6963 reverse-DNS ids. */
const RDNS_LABELS: Record<string, string> = {
  "io.metamask": "MetaMask",
  "io.metamask.mobile": "MetaMask",
  "com.brave.wallet": "Brave Wallet",
  "com.coinbase.wallet": "Coinbase Wallet",
  "app.phantom": "Phantom",
  "io.rabby": "Rabby Wallet",
};

function brandFromId(id: string): BrandKey {
  const lower = id.toLowerCase();
  if (lower.includes("brave")) return "brave";
  if (lower.includes("coinbase")) return "coinbase";
  if (lower.includes("metamask")) return "metamask";
  return "generic";
}

function toAnnouncedOption(c: Connector): ConnectorOption {
  return {
    kind: "connector",
    connector: c,
    label: RDNS_LABELS[c.id] ?? c.name,
    badge: "detectada",
    brand: brandFromId(c.id),
    // EIP-6963 wallets announce their own icon as a data URI — always
    // the correct brand mark, so Brave never wears the fox again.
    iconUri: c.icon ?? undefined,
  };
}

/** Brand the generic injected() fallback via window.ethereum flags. */
function toGenericOption(c: Connector, env: WalletEnv): ConnectorOption {
  const brand: BrandKey =
    env.injectedBrand === "brave"
      ? "brave"
      : env.injectedBrand === "coinbase"
        ? "coinbase"
        : env.injectedBrand === "metamask"
          ? "metamask"
          : "generic";
  const label =
    brand === "brave"
      ? "Brave Wallet"
      : brand === "coinbase"
        ? "Coinbase Wallet"
        : brand === "metamask"
          ? "MetaMask"
          : "Billetera del navegador";
  return { kind: "connector", connector: c, label, badge: "detectada", brand };
}

/**
 * The core fix: build a short, contextual list instead of dumping every
 * configured connector. Two working options > five broken ones.
 * Exported for tests — see FIX-NOTES.md for the environment matrix.
 */
export function buildOptions(
  connectors: readonly Connector[],
  env: WalletEnv
): WalletOption[] {
  // EIP-6963-announced wallets (id = reverse-DNS). Dedupe by id —
  // some browsers announce twice across frames.
  const seen = new Set<string>();
  const announced = connectors.filter((c) => {
    const isAnnounced = c.type === "injected" && c.id !== "injected";
    if (!isAnnounced || seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });

  const generic = connectors.find((c) => c.id === "injected");
  const coinbaseSdk = connectors.find((c) => c.id === "coinbaseWalletSDK");
  const wc = connectors.find((c) => c.id === "walletConnect");
  const coinbaseAnnounced = announced.some(
    (c) => c.id === "com.coinbase.wallet"
  );

  // ---- Mobile ----
  if (env.isMobile) {
    if (announced.length > 0) {
      // In-app browser or wallet-browser (Brave iOS, MetaMask app, …):
      // show exactly what's installed here. No QR — you can't scan a
      // QR with the phone it's displayed on.
      return announced.map(toAnnouncedOption);
    }
    if (env.hasInjected && generic) {
      // Legacy in-app browser: injected but not announced.
      return [toGenericOption(generic, env)];
    }
    // Plain mobile browser, no wallet in this context → deep links.
    const links = getDeepLinks();
    return [
      {
        kind: "deeplink",
        id: "metamask",
        label: "Abrir en MetaMask",
        href: links.metamask,
      },
      {
        kind: "deeplink",
        id: "coinbase",
        label: "Abrir en Coinbase Wallet",
        href: links.coinbase,
      },
    ];
  }

  // ---- Desktop ----
  const options: WalletOption[] = announced.map(toAnnouncedOption);
  if (options.length === 0 && env.hasInjected && generic) {
    options.push(toGenericOption(generic, env));
  }
  if (wc) {
    options.push({
      kind: "connector",
      connector: wc,
      label: "WalletConnect",
      badge: "qr",
      brand: "walletconnect",
    });
  }
  if (coinbaseSdk && !coinbaseAnnounced) {
    options.push({
      kind: "connector",
      connector: coinbaseSdk,
      label: "Coinbase Wallet",
      badge: "qr",
      brand: "coinbase",
    });
  }
  return options;
}

// ---------------------------------------------------------------------------
// Sheet
// ---------------------------------------------------------------------------

export function WalletPickerSheet({ open, onClose }: Props) {
  const { t } = useI18n();
  const { connectors, connectAsync, status, error, reset } = useConnect();
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<"list" | "wc-qr">("list");
  const [pendingUid, setPendingUid] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [wcUri, setWcUri] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  // Invalidates stale connect attempts when the user navigates back
  // or closes the sheet while a WalletConnect pairing is pending.
  const attemptRef = useRef(0);

  useEffect(() => setMounted(true), []);

  const env = useMemo(
    () => detectWalletEnv(),
    // Re-detect each time the sheet opens (a wallet may have unlocked).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mounted, open]
  );

  const options = useMemo(
    () => buildOptions(connectors, env),
    [connectors, env]
  );

  // Fresh state each time the sheet opens.
  useEffect(() => {
    if (!open) return;
    reset();
    setView("list");
    setPendingUid(null);
    setTimedOut(false);
    setWcUri(null);
    setQrDataUrl(null);
    setCopied(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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

  // Render the WalletConnect URI as an on-brand QR (design-token colors).
  useEffect(() => {
    if (!wcUri) {
      setQrDataUrl(null);
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(wcUri, {
      width: 560, // 2x for retina; displayed at 280
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#1A1A2E", light: "#FFFFFF" },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        /* QR generation failed — copy-link fallback still works */
      });
    return () => {
      cancelled = true;
    };
  }, [wcUri]);

  if (!mounted || !open) return null;

  const connecting = status === "pending";

  // ---- connect flows -------------------------------------------------------

  async function handleInjectedConnect(option: ConnectorOption) {
    const attempt = ++attemptRef.current;
    setTimedOut(false);
    setPendingUid(option.connector.uid);
    try {
      // 10s guard: injected wallets (Brave especially) can hang silently
      // if their popup was dismissed. QR flows are excluded — waiting for
      // a phone scan is not a hang.
      await Promise.race([
        connectAsync({ connector: option.connector }),
        new Promise<never>((_, rejectRace) =>
          setTimeout(
            () => rejectRace(new Error("__wallet_timeout__")),
            CONNECT_TIMEOUT_MS
          )
        ),
      ]);
      if (attempt === attemptRef.current) onClose();
    } catch (e) {
      if (attempt !== attemptRef.current) return; // stale attempt
      if ((e as Error).message === "__wallet_timeout__") setTimedOut(true);
      // Other errors surface via useConnect().error → getConnectorError.
    } finally {
      if (attempt === attemptRef.current) setPendingUid(null);
    }
  }

  async function handleWalletConnect(option: ConnectorOption) {
    const wc = option.connector;
    const attempt = ++attemptRef.current;
    setTimedOut(false);
    setPendingUid(wc.uid);
    setView("wc-qr");
    setWcUri(null);

    const onMessage = (payload: { type: string; data?: unknown }) => {
      if (payload.type === "display_uri" && typeof payload.data === "string") {
        setWcUri(payload.data);
      }
    };
    wc.emitter.on("message", onMessage);
    try {
      await connectAsync({ connector: wc });
      if (attempt === attemptRef.current) onClose();
    } catch {
      // Rejected in wallet, proposal expired, or user navigated back.
      if (attempt === attemptRef.current) setView("list");
    } finally {
      wc.emitter.off("message", onMessage);
      if (attempt === attemptRef.current) setPendingUid(null);
    }
  }

  function handleQrBack() {
    attemptRef.current++; // invalidate the pending pairing attempt
    setPendingUid(null);
    setView("list");
    setWcUri(null);
    setQrDataUrl(null);
  }

  async function handleCopyUri() {
    if (!wcUri) return;
    try {
      await navigator.clipboard?.writeText(wcUri);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — nothing to do */
    }
  }

  const showDeepLinkBanner =
    view === "list" && options.some((o) => o.kind === "deeplink");

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
            {view === "wc-qr" ? (
              <button
                type="button"
                onClick={handleQrBack}
                aria-label="Volver"
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface text-ink"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5"
                  aria-hidden="true"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            ) : (
              <Logo className="w-9 h-9" />
            )}
            <div>
              <h3
                id="wallet-sheet-title"
                className="text-subhead font-bold text-ink leading-tight"
              >
                {view === "wc-qr" ? "Escanea con tu billetera" : t.wallet.connect}
              </h3>
              <p className="text-small text-ink/60 mt-xs">
                {view === "wc-qr"
                  ? "Abre la app de tu billetera en el teléfono y escanea este código."
                  : "Tus fondos quedan en tu billetera. Remes no los toca."}
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

        {view === "wc-qr" ? (
          /* ------------------------- WalletConnect QR ------------------------- */
          <div className="px-lg flex flex-col items-center">
            <div className="w-[280px] h-[280px] rounded-lg border border-ink/10 bg-white p-sm flex items-center justify-center">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Código QR de WalletConnect"
                  width={264}
                  height={264}
                  className="w-full h-full"
                />
              ) : (
                <div
                  className="w-full h-full rounded-md bg-surface animate-pulse"
                  aria-label="Generando código QR"
                />
              )}
            </div>
            <button
              type="button"
              onClick={handleCopyUri}
              disabled={!wcUri}
              className={clsx(
                "mt-md h-10 px-md rounded-pill text-small font-semibold",
                "border border-ink/10 text-ink hover:bg-surface transition-colors",
                "focus-visible:shadow-focus focus-visible:outline-none",
                !wcUri && "opacity-50 cursor-not-allowed"
              )}
            >
              {copied ? "Enlace copiado" : "Copiar enlace"}
            </button>
          </div>
        ) : (
          /* ----------------------------- Wallet list ----------------------------- */
          <>
            {showDeepLinkBanner && (
              <div className="mx-lg mb-sm p-sm rounded-md bg-accent-soft">
                <p className="text-small text-ink/80 leading-snug">
                  {env.isIOS
                    ? "En iPhone, abre esta página dentro de la app de MetaMask o Coinbase Wallet para conectar."
                    : "En tu teléfono, abre esta página dentro de la app de MetaMask o Coinbase Wallet para conectar."}{" "}
                  <a
                    className="font-semibold text-primary underline"
                    href="https://metamask.io/download/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Cómo conectar
                  </a>
                </p>
              </div>
            )}

            <div className="px-lg space-y-xs">
              {options.map((option) =>
                option.kind === "deeplink" ? (
                  <DeepLinkRow key={option.id} option={option} />
                ) : (
                  <ConnectorRow
                    key={option.connector.uid}
                    option={option}
                    pending={pendingUid === option.connector.uid}
                    disabled={connecting || pendingUid !== null}
                    onClick={() =>
                      option.badge === "qr" &&
                      option.connector.id === "walletConnect"
                        ? handleWalletConnect(option)
                        : handleInjectedConnect(option)
                    }
                  />
                )
              )}
            </div>

            {finalError && (
              <div className="mx-lg mt-md p-sm rounded-md bg-error/10 border border-error/30">
                <p className="text-small text-error font-medium">
                  {finalError}
                </p>
              </div>
            )}
          </>
        )}

        {/* Cancelar */}
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

// ---------------------------------------------------------------------------
// Rows
// ---------------------------------------------------------------------------

function ConnectorRow({
  option,
  pending,
  disabled,
  onClick,
}: {
  option: ConnectorOption;
  pending: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "w-full h-14 rounded-xl bg-surface border border-ink/5",
        "flex items-center justify-between px-md",
        "transition-colors duration-150 hover:bg-ink/5",
        "focus-visible:shadow-focus focus-visible:outline-none",
        disabled && !pending && "opacity-60",
        pending && "cursor-wait"
      )}
    >
      <div className="flex items-center gap-sm">
        <WalletOptionIcon
          iconUri={option.iconUri}
          brand={option.brand}
          className="w-8 h-8 rounded-lg object-contain"
        />
        <span className="text-body font-semibold text-ink">{option.label}</span>
      </div>
      {pending ? (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-4 h-4 animate-spin text-primary"
          aria-label="Conectando"
        >
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeOpacity="0.2"
            strokeWidth="3"
          />
          <path
            d="M21 12a9 9 0 0 0-9-9"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <span className="text-micro text-ink/50 uppercase tracking-wider">
          {option.badge === "detectada" ? "Detectada" : "QR"}
        </span>
      )}
    </button>
  );
}

function DeepLinkRow({ option }: { option: DeepLinkOption }) {
  const Icon = option.id === "metamask" ? MetaMaskIcon : CoinbaseIcon;
  return (
    <a
      href={option.href}
      className={clsx(
        "w-full h-14 rounded-xl bg-surface border border-ink/5",
        "flex items-center justify-between px-md",
        "transition-colors duration-150 hover:bg-ink/5",
        "focus-visible:shadow-focus focus-visible:outline-none"
      )}
    >
      <div className="flex items-center gap-sm">
        <Icon className="w-8 h-8 rounded-lg" />
        <span className="text-body font-semibold text-ink">{option.label}</span>
      </div>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4 text-ink/40"
        aria-hidden="true"
      >
        <path d="M7 17L17 7M9 7h8v8" />
      </svg>
    </a>
  );
}

// ---------------------------------------------------------------------------
// Errors — DR tú form (never voseo)
// ---------------------------------------------------------------------------

function getConnectorError(error: Error): string {
  const msg = error.message || "";
  if (
    msg.includes("Provider not found") ||
    msg.includes("provider not found")
  ) {
    return "Billetera no encontrada. Instala la extensión o usa otra opción de la lista.";
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
  if (msg.includes("already pending") || msg.includes("Already processing")) {
    return "Ya hay una solicitud pendiente en tu billetera. Ábrela para responder.";
  }
  const truncated = msg.length > 80 ? msg.slice(0, 80) + "..." : msg;
  return `Error: ${truncated}`;
}
