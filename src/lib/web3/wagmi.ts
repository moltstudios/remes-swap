import { http, createConfig } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { injected, walletConnect, coinbaseWallet } from "wagmi/connectors";

// WalletConnect Cloud project ID
// Get one at https://cloud.walletconnect.com (free)
// When unset, WalletConnect QR is disabled but injected + Coinbase still work
const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WC_PROJECT_ID || "";

// wagmi connectors are typed as a union — pass them directly to createConfig
type Connector = ReturnType<typeof injected | typeof walletConnect | typeof coinbaseWallet>;

const connectors: Connector[] = [];

// MetaMask + any other injected wallet — always available
connectors.push(injected({ shimDisconnect: true }));

// WalletConnect v2 — only if project ID is configured
if (WC_PROJECT_ID && WC_PROJECT_ID.length >= 32) {
  connectors.push(
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
    })
  );
}

// Coinbase Wallet SDK — works without WC project ID
connectors.push(
  coinbaseWallet({
    appName: "Remes Swap",
    appLogoUrl: "https://remes.app/icons/icon-192.png",
  })
);

export const config = createConfig({
  chains: [base, baseSepolia],
  connectors,
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
