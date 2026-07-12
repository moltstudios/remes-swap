import { http, createConfig } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { injected, walletConnect, coinbaseWallet, metaMask } from "wagmi/connectors";

// ---------------------------------------------------------------------------
// WHAT CHANGED AND WHY (2026-07-12 wallet-picker fix)
//
// Before: THREE manual injected() connectors (generic + target:"metaMask" +
// custom braveTarget) stacked ON TOP of wagmi's default EIP-6963
// multi-provider discovery. On Brave iOS that produced up to 4 injected
// entries (Brave sets isMetaMask=true for compat, so the "metaMask" target
// matched Brave too) plus WalletConnect plus Coinbase = the 5-6 broken
// options in Timothy's screenshots.
//
// After: EIP-6963 discovery (wagmi default, left ON) is the ONLY source of
// per-wallet injected connectors. Each installed wallet announces itself
// exactly once, with its own real name and icon — Brave announces
// "Brave Wallet" with the lion, MetaMask announces "MetaMask" with the fox.
// Impersonation flags (isMetaMask on Brave) become irrelevant.
//
// One generic injected() stays as a FALLBACK for legacy in-app browsers
// that inject window.ethereum without announcing via EIP-6963. The picker
// (WalletPickerSheet) hides it whenever announced providers exist.
//
// WalletConnect: showQrModal is now FALSE. @walletconnect/modal is
// deprecated by Reown (that dark third-party modal is what rendered the
// blank wallet tiles). The picker renders its own on-brand QR view from
// the connector's `display_uri` message instead.
// ---------------------------------------------------------------------------

const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WC_PROJECT_ID || "";
const hasValidWCId = WC_PROJECT_ID.length >= 32;

// metadata.url MUST exactly match the origin the dapp is served from.
// Reown's relay + Verify API reject mismatched origins, which is one of
// the two causes of the "Subscribing to …" hang (the other is the project
// allowlist on dashboard.reown.com — see FIX-NOTES.md).
// The old code fell back to "https://remes.app" during SSR module
// evaluation, which never matched remes-swap.vercel.app.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://remes-swap.vercel.app";

export const config = createConfig({
  chains: [base, baseSepolia],
  // multiInjectedProviderDiscovery defaults to true — do not disable it,
  // and do not add per-wallet injected() targets. Discovery IS the dedupe.
  connectors: [
    // Fallback only. Hidden by the picker when EIP-6963 wallets exist.
    injected({ shimDisconnect: true }),

    // MetaMask SDK connector — uses MetaMask SDK's own connect() logic
    // instead of raw eth_requestAccounts on the EIP-1193 provider.
    // This prevents the "opens mobile app instead of extension popup"
    // bug on Desktop Brave with MetaMask extension installed.
    //
    // The SDK properly detects the extension and uses the popup, even
    // when Brave's built-in wallet shadows window.ethereum.
    //
    // rdns: ['io.metamask', 'io.metamask.mobile'] tells wagmi to bind
    // EIP-6963 MetaMask announcements to this connector. No duplicates.
    metaMask({
      dappMetadata: {
        name: "Remes",
        url: SITE_URL,
      },
    }),

    // Coinbase SDK: in-app browser, extension popup, mobile deep link,
    // and Smart Wallet. The picker hides this row if the Coinbase
    // EXTENSION already announced itself via EIP-6963 (avoids a
    // duplicate Coinbase entry on desktop).
    coinbaseWallet({
      appName: "Remes",
      appLogoUrl: `${SITE_URL}/icons/icon-192.png`,
      preference: "all",
    }),

    // WalletConnect v2 — desktop only in the picker. Custom QR view;
    // the deprecated @walletconnect/modal is gone.
    ...(hasValidWCId
      ? [
          walletConnect({
            projectId: WC_PROJECT_ID,
            metadata: {
              name: "Remes",
              description: "El dólar que funciona en todas partes",
              url: SITE_URL,
              icons: [`${SITE_URL}/icons/icon-192.png`],
            },
            showQrModal: false,
          }),
        ]
      : []),
  ],
  transports: {
    [base.id]: http(
      process.env.NEXT_PUBLIC_BASE_RPC || "https://mainnet.base.org"
    ),
    [baseSepolia.id]: http(
      process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || "https://sepolia.base.org"
    ),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
