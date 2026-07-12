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
 * Detect the injected EIP-1193 provider.
 *
 * Brave browser ships a built-in wallet that shadows `window.ethereum`.
 * Brave sets BOTH `isBraveWallet=true` AND `isMetaMask=true` for backward
 * compatibility with dApps expecting MetaMask.
 *
 * Therefore: check `isBraveWallet` FIRST. If present, it's Brave —
 * never MetaMask, regardless of the `isMetaMask` flag.
 *
 * When locked, Brave returns `undefined` from `eth_requestAccounts`,
 * which crashes wagmi v2's `injected()` connector on `.map()`.
 */
function getInjectedTarget() {
  if (typeof window === "undefined") return undefined;

  const eth = window.ethereum as
    | {
        isMetaMask?: boolean;
        isBraveWallet?: boolean;
        providers?: Array<{
          isMetaMask?: boolean;
          isBraveWallet?: boolean;
        }>;
      }
    | undefined;

  if (!eth) return undefined;

  // EIP-5749: multiple injected providers (desktop with multiple extensions)
  // Look for a REAL MetaMask (not Brave pretending to be MetaMask)
  if (eth.providers?.length) {
    const mm = eth.providers.find((p) => p.isMetaMask && !p.isBraveWallet);
    if (mm) {
      return { id: "isMetaMask", name: "MetaMask", provider: mm as any };
    }
  }

  // ⚠️ Brave check MUST come before MetaMask check.
  // Brave sets both isBraveWallet=true AND isMetaMask=true.
  // If we check MetaMask first, Brave gets misidentified as MetaMask.
  if (eth.isBraveWallet) {
    return { id: "isBraveWallet", name: "Brave Wallet", provider: eth as any };
  }

  // Real MetaMask (desktop extension, not Brave)
  if (eth.isMetaMask) {
    return { id: "isMetaMask", name: "MetaMask", provider: eth as any };
  }

  // Unknown injected provider
  return { id: "injected" as const, name: "Browser Wallet", provider: eth as any };
}

export const config = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    // Single injected connector with explicit provider detection.
    // Prevents Brave's locked wallet from crashing wagmi's connector
    // and correctly identifies Brave vs MetaMask (Brave sets both flags).
    injected({
      shimDisconnect: true,
      target: getInjectedTarget,
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
      (process.env.NEXT_PUBLIC_BASE_RPC || "https://mainnet.base.org").trim()
    ),
    [baseSepolia.id]: http(
      (process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || "https://sepolia.base.org").trim()
    ),
  },
  // Disable EIP-6963 multi-provider discovery — we use explicit connector
  // targeting in getInjectedTarget(). Without this, wagmi discovers every
  // injected provider (including Brave pretending to be MetaMask) and creates
  // separate connectors for each, resulting in 5+ wallet entries on iOS Brave.
  multiInjectedProviderDiscovery: false,
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
