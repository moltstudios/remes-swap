import { http, createConfig } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { injected, walletConnect, coinbaseWallet } from "wagmi/connectors";

// WalletConnect Cloud project ID
// Register at https://cloud.walletconnect.com (free, 30 seconds)
// MUST be a real project ID — fake ones cause "Invalid App Configuration"
const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WC_PROJECT_ID || "";

// Only include WalletConnect if we have a real project ID (32+ hex chars)
const hasValidWCId = WC_PROJECT_ID.length >= 32;

export const config = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    // MetaMask + any EIP-1193 injected wallet — always available
    injected({ shimDisconnect: true }),

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
