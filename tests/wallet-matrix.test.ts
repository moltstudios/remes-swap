import { buildOptions } from "../src/components/WalletPickerSheet";
import type { WalletEnv } from "../src/lib/wallet-env";
import type { Connector } from "wagmi";

const mk = (id: string, type: string, name: string, icon?: string) =>
  ({ id, uid: `uid-${id}`, type, name, icon }) as unknown as Connector;

const generic = mk("injected", "injected", "Injected");
const cbSdk = mk("coinbaseWalletSDK", "coinbaseWallet", "Coinbase Wallet");
const wc = mk("walletConnect", "walletConnect", "WalletConnect");
const mmSdk = mk("metaMaskSDK", "metaMask", "MetaMask");
const mmAnnounced = mk("io.metamask", "injected", "MetaMask", "data:image/svg+xml;base64,MM");
const braveAnnounced = mk("com.brave.wallet", "injected", "Brave Wallet", "data:image/svg+xml;base64,BR");
const cbAnnounced = mk("com.coinbase.wallet", "injected", "Coinbase Wallet", "data:image/svg+xml;base64,CB");

const env = (over: Partial<WalletEnv>): WalletEnv => ({
  isIOS: false, isAndroid: false, isMobile: false,
  hasInjected: false, injectedBrand: null, ...over,
});

const summarize = (opts: ReturnType<typeof buildOptions>) =>
  opts.map((o) => (o.kind === "deeplink" ? `deeplink:${o.id}` : `${o.label}[${o.badge}]${"iconUri" in o && o.iconUri ? "*" : ""}`)).join(" | ");

let failures = 0;
function check(name: string, got: string, want: string) {
  const ok = got === want;
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}\n      got:  ${got}\n      want: ${want}`);
}

// ---- MOBILE ----

// 1. iOS Safari clean → MetaMask + Coinbase deep-links + WalletConnect (3 options)
check("iOS Safari clean → 3 options (MM + CB + WC)",
  summarize(buildOptions([generic, cbSdk, wc], env({ isIOS: true, isMobile: true }))),
  "deeplink:metamask | deeplink:coinbase | WalletConnect[qr]");

// 2. iOS Brave (Brave Wallet announced) → Brave + MetaMask + Coinbase + WC (4 options)
check("iOS Brave announced → 4 options (Brave + MM + CB + WC)",
  summarize(buildOptions([generic, braveAnnounced, cbSdk, wc], env({ isIOS: true, isMobile: true, hasInjected: true, injectedBrand: "brave" }))),
  "Brave Wallet[detectada]* | deeplink:metamask | deeplink:coinbase | WalletConnect[qr]");

// 3. iOS inside MetaMask app browser (announces io.metamask) → MetaMask only, no deep-link dupe
check("iOS MetaMask in-app → MetaMask only",
  summarize(buildOptions([generic, mmAnnounced, cbSdk, wc], env({ isIOS: true, isMobile: true, hasInjected: true, injectedBrand: "metamask" }))),
  "MetaMask[detectada]* | deeplink:coinbase | WalletConnect[qr]");

// 4. iOS inside Coinbase app browser → Coinbase only, no deep-link dupe
check("iOS Coinbase in-app → Coinbase + WC (no CB dupe)",
  summarize(buildOptions([generic, cbAnnounced, cbSdk, wc], env({ isIOS: true, isMobile: true, hasInjected: true, injectedBrand: "coinbase" }))),
  "Coinbase Wallet[detectada]* | deeplink:metamask | WalletConnect[qr]");

// 5. Legacy mobile in-app browser (injected, nothing announced, CB flags)
check("Legacy CB in-app → generic CB + WC",
  summarize(buildOptions([generic, cbSdk, wc], env({ isMobile: true, hasInjected: true, injectedBrand: "coinbase" }))),
  "Coinbase Wallet[detectada] | deeplink:metamask | WalletConnect[qr]");

// ---- DESKTOP ----

// 6. Desktop Chrome + MetaMask extension → MM + WC + Coinbase
check("Desktop Chrome + MM ext",
  summarize(buildOptions([generic, mmAnnounced, cbSdk, wc], env({ hasInjected: true, injectedBrand: "metamask" }))),
  "MetaMask[detectada]* | WalletConnect[qr] | Coinbase Wallet[qr]");

// 7. Desktop Brave → Brave + WC + Coinbase
check("Desktop Brave",
  summarize(buildOptions([generic, braveAnnounced, cbSdk, wc], env({ hasInjected: true, injectedBrand: "brave" }))),
  "Brave Wallet[detectada]* | WalletConnect[qr] | Coinbase Wallet[qr]");

// 8. Desktop with MM + Coinbase EXTENSIONS → no duplicate Coinbase (SDK hidden)
check("Desktop MM + CB extensions dedupe",
  summarize(buildOptions([generic, mmAnnounced, cbAnnounced, cbSdk, wc], env({ hasInjected: true, injectedBrand: "metamask" }))),
  "MetaMask[detectada]* | Coinbase Wallet[detectada]* | WalletConnect[qr]");

// 9. Desktop, nothing installed → WC + Coinbase QR flows
check("Desktop clean",
  summarize(buildOptions([generic, cbSdk, wc], env({}))),
  "WalletConnect[qr] | Coinbase Wallet[qr]");

// 10. Double-announce dedupe (same rdns twice)
check("Double announce dedupe",
  summarize(buildOptions([generic, mmAnnounced, mmAnnounced, cbSdk, wc], env({ hasInjected: true, injectedBrand: "metamask" }))),
  "MetaMask[detectada]* | WalletConnect[qr] | Coinbase Wallet[qr]");

// 11. Desktop Brave + MetaMask SDK connector → MM via SDK, no EIP-6963 dupe
check("Desktop Brave + MM SDK connector",
  summarize(buildOptions([generic, braveAnnounced, mmSdk, mmAnnounced, cbSdk, wc], env({ hasInjected: true, injectedBrand: "brave" }))),
  "Brave Wallet[detectada]* | MetaMask[detectada] | WalletConnect[qr] | Coinbase Wallet[qr]");

process.exit(failures ? 1 : 0);
