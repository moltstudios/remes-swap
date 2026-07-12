import { http, createConfig } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { injected, walletConnect, coinbaseWallet } from "wagmi/connectors";

// WalletConnect Cloud project ID
// Get one at https://cloud.walletconnect.com (free, takes 30 seconds)
// This MUST be set for WalletConnect QR to work
const WC_PROJECT_ID =
  process.env.NEXT_PUBLIC_WC_PROJECT_ID ||
  "3fdc13c475f9b5a6f6f8e5c4f8a3d2b1"; // demo fallback — replace with real one

export const config = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    // MetaMask + any EIP-1193 injected wallet
    injected({ shimDisconnect: true }),

    // WalletConnect v2 — QR modal for mobile wallets (Rainbow, Trust, etc.)
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

    // Coinbase Wallet SDK — opens Coinbase Wallet or shows download link
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
