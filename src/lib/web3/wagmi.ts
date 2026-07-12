import { http, createConfig } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { injected, walletConnect, coinbaseWallet } from "wagmi/connectors";

// WalletConnect Cloud project ID
// Register at https://cloud.walletconnect.com (free, 30 seconds)
// MUST be a real project ID — fake ones cause "Invalid App Configuration"
const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WC_PROJECT_ID || "";

// Only include WalletConnect if we have a real project ID (32+ hex chars)
const hasValidWCId = WC_PROJECT_ID.length >= 32;

/**
 * Custom Brave target — wagmi v2's injected targetMap doesn't include
 * Brave, so we hand-roll a Target object that walks window.ethereum
 * (single provider or EIP-6963 multi-provider), filters by
 * `isBraveWallet`, and labels it 'braveWallet' so the picker maps
 * it correctly. Falls back to undefined (silent — Brave just won't
 * show as an option if not installed).
 */
const braveTarget = (): unknown => {
  if (typeof window === "undefined") return undefined;
  const eth = (window as unknown as { ethereum?: unknown }).ethereum as
    | undefined
    | {
        providers?: Array<{ isBraveWallet?: boolean }>;
        isBraveWallet?: boolean;
      };
  if (!eth) return undefined;
  if (Array.isArray(eth.providers)) {
    return eth.providers.find((p) => p?.isBraveWallet);
  }
  if (eth.isBraveWallet) {
    return (window as unknown as { ethereum: unknown }).ethereum;
  }
  return undefined;
};

export const config = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    // Generic injected — covers any EIP-6963 / EIP-1193 wallet not listed
    // explicitly below (Rabby, Phantom, Frame, …). Renders as
    // 'Billetera del navegador' with the MetaMask tile by default.
    injected({ shimDisconnect: true }),

    // Explicit MetaMask target — wagmi resolves this to its metaMask
    // targetMap entry which uses the canonical id 'metaMask'. Labeled
    // + iconed correctly via getWalletBrand('metaMask').
    injected({
      shimDisconnect: true,
      target: "metaMask",
    }),

    // Explicit Brave connector — has `isBraveWallet` set on
    // window.ethereum (single provider or EIP-6963 multi-provider).
    // Falls back silently if Brave isn't installed (no UI noise).
    injected({
      shimDisconnect: true,
      target: braveTarget as never,
    }),

    // WalletConnect v2 — only if real project ID is configured
    ...(hasValidWCId
      ? [
          walletConnect({
            projectId: WC_PROJECT_ID,
            metadata: {
              name: "Remes Swap",
              description: "El dólar que funciona en todas partes",
              url:
                typeof window !== "undefined"
                  ? window.location.origin
                  : "https://remes.app",
              icons: ["https://remes.app/icons/icon-192.png"],
            },
            showQrModal: true,
          }),
        ]
      : []),

    // Coinbase Wallet SDK — opens app or shows download link
    coinbaseWallet({
      appName: "Remes Swap",
      appLogoUrl: "https://remes.app/icons/icon-192.png",
      headlessMode: false,
    }),
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
