// Quote fetching — coordinates with Neo's API contract:
// Input:  { sourceAsset, destAsset, amount }
// Output: { expectedOutput, minReceived, fee, priceImpact, route? }

import { parseTokenAmount } from "./format";

export type QuoteRequest = {
  sourceAsset: `0x${string}`;
  destAsset: `0x${string}`;
  amount: string; // human-readable, e.g. "100.5"
  sourceDecimals: number;
  slippageBps?: number; // basis points, default 50 (0.5%)
};

export type QuoteResponse = {
  expectedOutput: string; // human-readable
  minReceived: string; // human-readable after slippage
  fee: string; // human-readable
  priceImpact: number; // 0-1 (e.g. 0.001 = 0.1%)
  feePercent: number; // platform fee as 0-1
  route?: string;
};

// Default fee matches the platform fee Neo's API will return.
// Keep these aligned with backend config.
const DEFAULT_PLATFORM_FEE = 0.003; // 0.3%
const DEFAULT_SLIPPAGE_BPS = 50; // 0.5%

export async function fetchQuote(req: QuoteRequest): Promise<QuoteResponse> {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE;

  // If backend is not yet deployed, return a deterministic placeholder
  // so the UI can be exercised end-to-end during scaffolding.
  if (!apiBase) {
    return mockQuote(req);
  }

  const res = await fetch(`${apiBase}/api/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sourceAsset: req.sourceAsset,
      destAsset: req.destAsset,
      amount: parseTokenAmount(req.amount, req.sourceDecimals).toString(),
      slippageBps: req.slippageBps ?? DEFAULT_SLIPPAGE_BPS,
    }),
  });

  if (!res.ok) {
    throw new Error(`Quote failed: ${res.status}`);
  }
  return res.json();
}

// Mock quote for scaffolding — assumes 1:1 stablecoin ratio minus fee.
// Removed when Neo's API is live.
async function mockQuote(req: QuoteRequest): Promise<QuoteResponse> {
  await new Promise((r) => setTimeout(r, 400));
  const amount = parseFloat(req.amount || "0");
  if (!amount) {
    return {
      expectedOutput: "0",
      minReceived: "0",
      fee: "0",
      priceImpact: 0,
      feePercent: DEFAULT_PLATFORM_FEE,
    };
  }
  const fee = amount * DEFAULT_PLATFORM_FEE;
  const expected = amount - fee;
  const slippage = (req.slippageBps ?? DEFAULT_SLIPPAGE_BPS) / 10_000;
  const minReceived = expected * (1 - slippage);
  // Pretend tiny price impact scales with size
  const priceImpact = Math.min(0.005, amount / 1_000_000);
  return {
    expectedOutput: expected.toFixed(6),
    minReceived: minReceived.toFixed(6),
    fee: fee.toFixed(6),
    priceImpact,
    feePercent: DEFAULT_PLATFORM_FEE,
    route: "Uniswap V3 (mock)",
  };
}