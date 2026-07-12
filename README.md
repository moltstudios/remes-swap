# Remes Swap

> El dólar que funciona en todas partes — mobile-first PWA for swapping stablecoins on Base chain.

Spanish-first, non-custodial, banking-grade trust. Phase 1 MVP.

> Brand: **Remes** (from _remesa_ — remittance). Native stablecoin ticker: **RMUSD**.
> Renamed from the internal codename "Project Ciento" on 2026-07-12.

## Stack

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Styling:** TailwindCSS, mobile-first
- **Web3:** wagmi v2 + viem + WalletConnect v2 + Coinbase Wallet SDK + MetaMask
- **i18n:** Spanish (default) + English toggle
- **PWA:** Service worker for offline shell + install prompt

## Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Visit `http://localhost:3000`.

## Environment

See [`.env.example`](./.env.example). The quote API is mocked in-app until the backend API is live at `NEXT_PUBLIC_API_BASE`.

## Architecture

```
src/
├── app/                   # Next.js App Router pages
│   ├── page.tsx           # Landing (hero + swap card front-and-center)
│   ├── swap/              # Standalone swap page
│   ├── history/           # Transaction history (placeholder)
│   ├── settings/          # Settings (language, slippage)
│   ├── layout.tsx         # Root layout + providers
│   └── globals.css        # Tailwind + base styles
├── components/
│   ├── AppShell.tsx       # Header + bottom nav + footer
│   ├── WalletButton.tsx   # Connect/disconnect UI
│   ├── SwapCard.tsx       # Core swap interface
│   ├── TokenSelector.tsx  # Token picker modal
│   ├── TokenLogo.tsx      # Inline token icon + impact badge
│   └── ServiceWorkerRegistrar.tsx
├── lib/
│   ├── i18n/              # ES + EN dictionaries + provider
│   ├── web3/
│   │   ├── wagmi.ts       # wagmi config + connectors
│   │   └── contracts.ts   # Base chain addresses
│   ├── format.ts          # Number/address helpers
│   ├── quote.ts           # Quote fetching (real API + mock fallback)
│   └── tokens.ts          # Token metadata
├── hooks/
│   └── useTranslations.ts
└── providers/
    └── Web3Provider.tsx   # wagmi + react-query + i18n providers
```

## Phase 1 Status

- [x] Next.js 14 PWA scaffold (App Router, TS, Tailwind)
- [x] PWA manifest + service worker (offline shell)
- [x] Spanish-first i18n with EN toggle
- [x] Wallet connection UI (MetaMask, Coinbase, WalletConnect)
- [x] Landing page with hero + trust pillars
- [x] Swap interface UI (token select, amount input, quote, fee breakdown)
- [x] Mock quote fallback (1:1 minus 0.3% fee) until backend is live
- [x] Settings (language + slippage)
- [x] Transaction history placeholder
- [x] Brand: Remes (renamed from Ciento on 2026-07-12)
- [ ] Real Uniswap V3 swap execution (Week 2 — wiring `writeContract`)
- [ ] Real quote API integration (depends on backend)
- [ ] Push notifications (Week 3)

## Quote API contract

```
POST {API_BASE}/api/quote
→ { sourceAsset, destAsset, amount, slippageBps? }
← { expectedOutput, minReceived, fee, priceImpact, feePercent, route? }
```

Current placeholder: `src/lib/quote.ts` — swap mock for real `fetch('/api/quote')` when `NEXT_PUBLIC_API_BASE` is set.

## Security

We **never** touch user funds. All swaps execute via smart contracts; the user signs directly. No private keys on this server, ever.

## Deploy

```bash
vercel --prod --yes
```

Configured for the `moltstudios` Vercel account. Project alias: `remes-swap.vercel.app`.