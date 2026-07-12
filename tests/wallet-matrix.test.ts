import { buildOptions } from "../src/components/WalletPickerSheet";
import type { WalletEnv } from "../src/lib/wallet-env";
import type { Connector } from "wagmi";

const mk = (id: string, type: string, name: string, icon?: string) =>
  ({ id, uid: `uid-${id}`, type, name, icon }) as unknown as Connector;

const generic = mk("injected", "injected", "Injected");
const cbSdk = mk("coinbaseWalletSDK", "coinbaseWallet", "Coinbase Wallet");
const wc = mk("walletConnect", "walletConnect", "WalletConnect");
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

// 1. iOS Safari, nothing injected → 2 deep links, no WC, no QR
check("iOS Safari clean",
  summarize(buildOptions([generic, cbSdk, wc], env({ isIOS: true, isMobile: true }))),
  "deeplink:metamask | deeplink:coinbase");

// 2. iOS inside MetaMask app browser (announces io.metamask) → exactly 1
check("iOS MetaMask in-app",
  summarize(buildOptions([generic, mmAnnounced, cbSdk, wc], env({ isIOS: true, isMobile: true, hasInjected: true, injectedBrand: "metamask" }))),
  "MetaMask[detectada]*");

// 3. iOS Brave (announces com.brave.wallet, impersonates isMetaMask) → exactly 1, Brave-branded
check("iOS Brave",
  summarize(buildOptions([generic, braveAnnounced, cbSdk, wc], env({ isIOS: true, isMobile: true, hasInjected: true, injectedBrand: "brave" }))),
  "Brave Wallet[detectada]*");

// 4. Desktop Chrome + MetaMask extension → MM + WC + Coinbase
check("Desktop Chrome + MM ext",
  summarize(buildOptions([generic, mmAnnounced, cbSdk, wc], env({ hasInjected: true, injectedBrand: "metamask" }))),
  "MetaMask[detectada]* | WalletConnect[qr] | Coinbase Wallet[qr]");

// 5. Desktop Brave → Brave + WC + Coinbase
check("Desktop Brave",
  summarize(buildOptions([generic, braveAnnounced, cbSdk, wc], env({ hasInjected: true, injectedBrand: "brave" }))),
  "Brave Wallet[detectada]* | WalletConnect[qr] | Coinbase Wallet[qr]");

// 6. Desktop with MM + Coinbase EXTENSIONS → no duplicate Coinbase (SDK hidden)
check("Desktop MM + CB extensions dedupe",
  summarize(buildOptions([generic, mmAnnounced, cbAnnounced, cbSdk, wc], env({ hasInjected: true, injectedBrand: "metamask" }))),
  "MetaMask[detectada]* | Coinbase Wallet[detectada]* | WalletConnect[qr]");

// 7. Legacy mobile in-app browser (injected, nothing announced, CB flags)
check("Legacy CB in-app",
  summarize(buildOptions([generic, cbSdk, wc], env({ isMobile: true, hasInjected: true, injectedBrand: "coinbase" }))),
  "Coinbase Wallet[detectada]");

// 8. Desktop, nothing installed → WC + Coinbase QR flows
check("Desktop clean",
  summarize(buildOptions([generic, cbSdk, wc], env({}))),
  "WalletConnect[qr] | Coinbase Wallet[qr]");

// 9. Double-announce dedupe (same rdns twice)
check("Double announce dedupe",
  summarize(buildOptions([generic, mmAnnounced, mmAnnounced, cbSdk, wc], env({ hasInjected: true, injectedBrand: "metamask" }))),
  "MetaMask[detectada]* | WalletConnect[qr] | Coinbase Wallet[qr]");

process.exit(failures ? 1 : 0);
