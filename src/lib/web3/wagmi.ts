import { http, createConfig } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { injected, walletConnect, coinbaseWallet } from "wagmi/connectors";

// wagmi's Target type has overly strict provider typing for runtime detection.
// We cast window.ethereum to `any` since the shape varies by wallet.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyProvider = any;

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
 * When locked, it returns `undefined` from `eth_requestAccounts`, which
 * causes wagmi v2's `injected()` connector to crash on `.map()`.
 *
 * We detect MetaMask explicitly and label it, rather than letting wagmi
 * auto-discover and crash on Brave's locked wallet.
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

  // EIP-5749: multiple injected providers — pick MetaMask if present
  if (eth.providers?.length) {
    const mm = eth.providers.find((p) => p.isMetaMask && !p.isBraveWallet);
    if (mm) {
      return { id: "isMetaMask", name: "MetaMask", provider: mm as AnyProvider };
    }
  }

  // Single provider: Brave Wallet (without MetaMask flag)
  if (eth.isBraveWallet && !eth.isMetaMask) {
    return { id: "isBraveWallet", name: "Brave Wallet", provider: eth as AnyProvider };
  }

  // MetaMask (single or primary)
  if (eth.isMetaMask) {
    return { id: "isMetaMask", name: "MetaMask", provider: eth as AnyProvider };
  }

  // Unknown injected provider
  return { id: "injected" as const, name: "Browser Wallet", provider: eth as AnyProvider };
}

export const config = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    // Explicitly target MetaMask (or whichever injected provider we detect).
    // This prevents Brave's locked wallet from crashing wagmi's connector.
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
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
