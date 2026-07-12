import { http, createConfig } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { injected, walletConnect, coinbaseWallet } from "wagmi/connectors";

// WalletConnect Cloud project ID — public for now, can be moved to env later
// For production, replace with env var via Vercel
const WC_PROJECT_ID =
  process.env.NEXT_PUBLIC_WC_PROJECT_ID || "c1000000000000000000000000000000";

export const config = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    // MetaMask + any other injected wallet
    injected({ shimDisconnect: true }),
    // WalletConnect v2 — supports Trust, Rainbow, Argent, mobile wallets via QR
    walletConnect({
      projectId: WC_PROJECT_ID,
      metadata: {
        name: "Remes Swap",
        description: "El dólar que funciona en todas partes",
        url: typeof window !== "undefined" ? window.location.origin : "https://remes.app",
        icons: ["https://remes.app/icons/icon-192.png"],
      },
      showQrModal: true,
    }),
    // Coinbase Wallet SDK — important for Base adoption
    coinbaseWallet({
      appName: "Remes Swap",
      appLogoUrl: "https://remes.app/icons/icon-192.png",
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