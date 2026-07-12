// Quote fetching — calls our backend /api/quote endpoint
// Same Next.js app, so we use relative URL. No external API base needed.

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

const DEFAULT_SLIPPAGE_BPS = 50; // 0.5%

export async function fetchQuote(req: QuoteRequest): Promise<QuoteResponse> {
  // Same-origin call to our API route — no external base URL needed
  const res = await fetch("/api/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sourceAsset: req.sourceAsset,
      destAsset: req.destAsset,
      amount: req.amount, // send human-readable, backend handles parsing
      slippageBps: req.slippageBps ?? DEFAULT_SLIPPAGE_BPS,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Quote failed: ${res.status}`);
  }

  return res.json();
}
