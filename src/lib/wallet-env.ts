// src/lib/wallet-env.ts
//
// Single source of truth for "what browser environment are we in?"
// The wallet picker uses this to decide WHICH options to render.
//
// Design rule (HANDOFF.md): show only options that can actually work
// in the current environment. Two working options > five broken ones.

export type InjectedBrand = "brave" | "coinbase" | "metamask" | "unknown";

export type WalletEnv = {
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  /** window.ethereum exists (any EIP-1193 provider was injected) */
  hasInjected: boolean;
  /**
   * Best-effort brand of the legacy window.ethereum provider.
   * Only consulted when NO wallet announced itself via EIP-6963
   * (older in-app browsers). Order matters: Brave impersonates
   * MetaMask by also setting `isMetaMask: true`, so Brave is
   * checked first. This is the "same fox icon on Brave" bug.
   */
  injectedBrand: InjectedBrand | null;
};

type EthereumFlags = {
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  isBraveWallet?: boolean;
  providers?: EthereumFlags[];
};

function readEthereum(): EthereumFlags | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { ethereum?: EthereumFlags }).ethereum;
}

function brandFromFlags(eth: EthereumFlags): InjectedBrand {
  // Multi-provider array (legacy EIP-5749 style): scan all entries.
  const candidates = Array.isArray(eth.providers) && eth.providers.length > 0
    ? eth.providers
    : [eth];
  if (candidates.some((p) => p?.isBraveWallet)) return "brave";
  if (candidates.some((p) => p?.isCoinbaseWallet)) return "coinbase";
  if (candidates.some((p) => p?.isMetaMask)) return "metamask";
  return "unknown";
}

export function detectWalletEnv(): WalletEnv {
  if (typeof navigator === "undefined") {
    return {
      isIOS: false,
      isAndroid: false,
      isMobile: false,
      hasInjected: false,
      injectedBrand: null,
    };
  }

  const ua = navigator.userAgent;
  // iPadOS 13+ reports as "Macintosh" but has touch — check maxTouchPoints.
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  const isMobile = isIOS || isAndroid;

  const eth = readEthereum();
  const hasInjected = Boolean(eth);

  return {
    isIOS,
    isAndroid,
    isMobile,
    hasInjected,
    injectedBrand: eth ? brandFromFlags(eth) : null,
  };
}

/**
 * Deep links used on mobile when NO wallet is injected (plain Safari /
 * Chrome / Brave-without-wallet). They open the page inside the wallet
 * app's own browser, where the wallet IS injected and connection works.
 * Built from the live location so preview deployments also work.
 */
export function getDeepLinks(): { metamask: string; coinbase: string } {
  const href =
    typeof window !== "undefined"
      ? window.location.href
      : "https://remes-swap.vercel.app";
  const hostAndPath =
    typeof window !== "undefined"
      ? window.location.host + window.location.pathname
      : "remes-swap.vercel.app/";

  return {
    // MetaMask expects host/path WITHOUT scheme after /dapp/
    metamask: `https://metamask.app.link/dapp/${hostAndPath}`,
    coinbase: `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(href)}`,
  };
}
