"use client";

import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { fetchQuote, type QuoteResponse } from "@/lib/quote";

type SwapStep = {
  step: number;
  label: string;
  description: string;
  to: string;
  data: string;
  value: string;
};

type SwapPrepResponse = {
  quote: QuoteResponse;
  steps: SwapStep[];
  routerAddress: string;
  deadline: number;
};

export type TxStage =
  | { kind: "idle" }
  | { kind: "preparing" }
  | { kind: "awaiting-approval"; txHash: string }
  | { kind: "approval-confirmed" }
  | { kind: "broadcasting-swap" }
  | { kind: "swap-sent"; txHash: string }
  | { kind: "complete"; txHash: string }
  | { kind: "error"; message: string };

const DEFAULT_SLIPPAGE_BPS = 50;

async function waitForTx(hash: string): Promise<void> {
  const eth = (window as unknown as { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum;
  if (!eth) return;
  // Poll until the tx is mined
  for (let i = 0; i < 60; i++) {
    const receipt = (await eth.request({
      method: "eth_getTransactionReceipt",
      params: [hash],
    })) as { blockHash?: string } | null;
    if (receipt?.blockHash) return;
    await new Promise((r) => setTimeout(r, 2000));
  }
}

/**
 * useSwapExecution — runs the full swap flow:
 * 1. Prepare (POST /api/swaps/prepare) → approve + swap calldata
 * 2. Send approve tx via wallet
 * 3. Wait for approval
 * 4. Send swap tx via wallet
 * 5. Record swap in backend (non-blocking)
 *
 * Extracted from SwapCard for reuse on /confirm.
 */
export function useSwapExecution() {
  const { address, isConnected, chain } = useAccount();
  const [stage, setStage] = useState<TxStage>({ kind: "idle" });

  const execute = useCallback(
    async (params: {
      fromSymbol: string;
      toSymbol: string;
      fromAddress: `0x${string}`;
      toAddress: `0x${string}`;
      amount: string;
    }) => {
      if (!isConnected || !address) {
        setStage({ kind: "error", message: "Conectá tu billetera primero." });
        return null;
      }

      setStage({ kind: "preparing" });

      try {
        const quote = await fetchQuote({
          sourceAsset: params.fromAddress,
          destAsset: params.toAddress,
          amount: params.amount,
          sourceDecimals: 6,
          slippageBps: DEFAULT_SLIPPAGE_BPS,
        });

        const prepRes = await fetch("/api/swaps/prepare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceAsset: params.fromAddress,
            destAsset: params.toAddress,
            amount: params.amount,
            recipient: address,
            slippageBps: DEFAULT_SLIPPAGE_BPS,
          }),
        });

        if (!prepRes.ok) {
          const err = (await prepRes.json().catch(() => ({}))) as { error?: string };
          throw new Error(err.error || "Failed to prepare swap");
        }

        const prep: SwapPrepResponse = await prepRes.json();
        const eth = (window as unknown as {
          ethereum?: {
            request: (args: { method: string; params?: unknown[] }) => Promise<string>;
          };
        }).ethereum;
        if (!eth) {
          throw new Error("No se detectó billetera.");
        }

        const approveStep = prep.steps[0];
        const swapStep = prep.steps[1];

        // 1. Approve
        setStage({ kind: "awaiting-approval", txHash: "" });
        const approveTx = await eth.request({
          method: "eth_sendTransaction",
          params: [
            {
              from: address,
              to: approveStep.to,
              data: approveStep.data,
              value: "0x0",
            },
          ],
        });
        setStage({ kind: "awaiting-approval", txHash: approveTx });

        await waitForTx(approveTx);
        setStage({ kind: "approval-confirmed" });

        // 2. Swap
        setStage({ kind: "broadcasting-swap" });
        const swapTx = await eth.request({
          method: "eth_sendTransaction",
          params: [
            {
              from: address,
              to: swapStep.to,
              data: swapStep.data,
              value: "0x0",
            },
          ],
        });
        setStage({ kind: "swap-sent", txHash: swapTx });

        // 3. Record (non-blocking)
        fetch("/api/swaps/record", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: address,
            source_asset: params.fromSymbol,
            dest_asset: params.toSymbol,
            source_amount: params.amount,
            dest_amount: quote.expectedOutput,
            rate: quote.route || "",
            fee_amount: quote.fee,
            fee_currency: params.fromSymbol,
            evm_tx_hash: swapTx,
            route: quote.route || "Uniswap V3",
          }),
        }).catch(() => {});

        setStage({ kind: "complete", txHash: swapTx });
        return swapTx;
      } catch (e) {
        const err = e as Error & { code?: number };
        if (err.code === 4001 || err.code === -32603) {
          setStage({ kind: "error", message: "Cancelaste la transacción." });
        } else {
          setStage({
            kind: "error",
            message: err.message || "Algo falló. Intentá de nuevo.",
          });
        }
        return null;
      }
    },
    [address, isConnected]
  );

  const reset = useCallback(() => setStage({ kind: "idle" }), []);

  return { stage, execute, reset };
}