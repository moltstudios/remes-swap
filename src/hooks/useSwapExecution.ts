"use client";

import { useEffect, useState, useCallback } from "react";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";
import { fetchQuote, type QuoteResponse } from "@/lib/quote";

type SwapStep = {
  step: number;
  label: string;
  description: string;
  to: string;
  data: string;
  value: string;
};

export type GasEstimate = {
  approve: string;
  swap: string;
};

type SwapPrepResponse = {
  quote: QuoteResponse;
  steps: SwapStep[];
  routerAddress: string;
  deadline: number;
  gasEstimate?: GasEstimate;
  gasPriceWei?: string;
};

export type PreparedSwap = {
  approvalHash: `0x${string}`;
  swapStep: SwapStep;
  quote: QuoteResponse;
  gasEstimate?: GasEstimate;
  gasPriceWei?: string;
};

export type PreparedDirectSwap = {
  swapHash: `0x${string}`;
  gasEstimate?: GasEstimate;
  gasPriceWei?: string;
};

export type TxStage =
  | { kind: "idle" }
  | { kind: "preparing" }
  | { kind: "needs-approval" }
  | {
      kind: "awaiting-approval";
      txHash: `0x${string}`;
      gasEstimate?: GasEstimate;
      gasPriceWei?: string;
    }
  | { kind: "awaiting-swap"; txHash: `0x${string}`; gasEstimate?: GasEstimate; gasPriceWei?: string }
  | { kind: "complete"; txHash: `0x${string}` }
  | { kind: "error"; message: string };

const DEFAULT_SLIPPAGE_BPS = 50;

/**
 * useSwapExecution — runs the swap flow.
 *
 * Lifecycle:
 *   idle → preparing → needs-approval (skip if allowance OK)
 *   → awaiting-approval (waiting for user to sign + receipt) → awaiting-swap
 *   → complete
 *
 * Tx-receipt watching is delegated to wagmi's useWaitForTransactionReceipt
 * (in the Confirm page) via the exposed `pendingHash` field. The Confirm UI
 * watches the hash and calls `markApproved()` / `markSwapped()` to advance
 * the stage. This keeps the hook focused on orchestration and removes the
 * old manual eth_getTransactionReceipt polling.
 */
export function useSwapExecution() {
  const { address, isConnected } = useAccount();
  const [stage, setStage] = useState<TxStage>({ kind: "idle" });

  const execute = useCallback(
    async (params: {
      fromSymbol: string;
      toSymbol: string;
      fromAddress: `0x${string}`;
      toAddress: `0x${string}`;
      amount: string;
    }): Promise<PreparedSwap | PreparedDirectSwap | null> => {
      if (!isConnected || !address) {
        setStage({ kind: "error", message: "Conecta tu billetera primero." });
        return null;
      }

      // Network check — must be on Base (chainId 8453)
      const eth = (window as unknown as {
        ethereum?: {
          request: (args: { method: string; params?: unknown[] }) => Promise<string>;
          chainId?: string;
        };
      }).ethereum;
      if (eth?.chainId && parseInt(eth.chainId, 16) !== 8453) {
        setStage({ kind: "error", message: "Estás en otra red. Cambia a Base para continuar." });
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
        const gasEstimate = prep.gasEstimate;
        const gasPriceWei = prep.gasPriceWei;
        const approveStep = prep.steps[0];
        const swapStep = prep.steps[1];

        // Compute raw amount (tokenIn has 6 decimals)
        const [w, f = ""] = params.amount.split(".");
        const padded = (f + "0".repeat(6)).slice(0, 6);
        const amountInRaw = BigInt(w || "0") * 10n ** 6n + BigInt(padded || "0");

        // Check allowance — skip approve if Router already has enough
        let needsApprove = true;
        try {
          const allowanceRes = await fetch("/api/token/allowance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token: params.fromAddress,
              owner: address,
              spender: prep.routerAddress,
            }),
          });
          if (allowanceRes.ok) {
            const { allowance } = await allowanceRes.json();
            if (BigInt(allowance) >= amountInRaw) {
              needsApprove = false;
            }
          }
        } catch {
          // If check fails, default to sending approve (safe)
        }

        const eth = (window as unknown as {
          ethereum?: {
            request: (args: { method: string; params?: unknown[] }) => Promise<string>;
          };
        }).ethereum;
        if (!eth) {
          throw new Error("No se detectó billetera.");
        }

        // 1. Approve (only if needed)
        if (needsApprove) {
          setStage({ kind: "needs-approval" });
          const approveTx = (await eth.request({
            method: "eth_sendTransaction",
            params: [
              {
                from: address,
                to: approveStep.to,
                data: approveStep.data,
                value: "0x0",
              },
            ],
          })) as `0x${string}`;
          setStage({
            kind: "awaiting-approval",
            txHash: approveTx,
            gasEstimate,
            gasPriceWei,
          });
          return { approvalHash: approveTx, swapStep, quote, gasEstimate, gasPriceWei };
        }

        // 2. Allowance already sufficient — go straight to swap
        const swapTx = (await eth.request({
          method: "eth_sendTransaction",
          params: [
            {
              from: address,
              to: swapStep.to,
              data: swapStep.data,
              value: "0x0",
            },
          ],
        })) as `0x${string}`;
        setStage({ kind: "awaiting-swap", txHash: swapTx, gasEstimate, gasPriceWei });

        // Non-blocking record
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

        return { swapHash: swapTx, gasEstimate, gasPriceWei };
      } catch (e) {
        const err = e as Error & { code?: number };
        const isRejection = err.code === 4001 || err.code === -32603;

        if (isRejection) {
          setStage({ kind: "error", message: "Cancelaste la firma. Sin cambio realizado." });
        } else {
          setStage({
            kind: "error",
            message: "El intercambio no se completó. La tasa pudo haber cambiado. Vuelve a intentarlo.",
          });
        }
        return null;
      }
    },
    [address, isConnected]
  );

  /**
   * After approval tx confirms, send the swap tx.
   * Called from the Confirm page once useWaitForTransactionReceipt fires.
   */
  const sendSwapAfterApproval = useCallback(
    async (params: {
      fromSymbol: string;
      toSymbol: string;
      fromAddress: `0x${string}`;
      toAddress: `0x${string}`;
      amount: string;
      swapStep: SwapStep;
      quote: QuoteResponse;
      gasEstimate?: GasEstimate;
      gasPriceWei?: string;
    }): Promise<`0x${string}` | null> => {
      if (!isConnected || !address) return null;
      const eth = (window as unknown as {
        ethereum?: {
          request: (args: { method: string; params?: unknown[] }) => Promise<string>;
        };
      }).ethereum;
      if (!eth) return null;
      const swapTx = (await eth.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: address,
            to: params.swapStep.to,
            data: params.swapStep.data,
            value: "0x0",
          },
        ],
      })) as `0x${string}`;

      setStage({
        kind: "awaiting-swap",
        txHash: swapTx,
        gasEstimate: params.gasEstimate,
        gasPriceWei: params.gasPriceWei,
      });

      // Non-blocking record
      fetch("/api/swaps/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: address,
          source_asset: params.fromSymbol,
          dest_asset: params.toSymbol,
          source_amount: params.amount,
          dest_amount: params.quote.expectedOutput,
          rate: params.quote.route || "",
          fee_amount: params.quote.fee,
          fee_currency: params.fromSymbol,
          evm_tx_hash: swapTx,
          route: params.quote.route || "Uniswap V3",
        }),
      }).catch(() => {});

      return swapTx;
    },
    [address, isConnected]
  );

  const markComplete = useCallback((txHash: `0x${string}`) => {
    setStage({ kind: "complete", txHash });
  }, []);

  const markError = useCallback((message: string) => {
    setStage({ kind: "error", message });
  }, []);

  const reset = useCallback(() => setStage({ kind: "idle" }), []);

  return {
    stage,
    execute,
    sendSwapAfterApproval,
    markComplete,
    markError,
    reset,
  };
}

/**
 * useTransactionAwaiter — wagmi-backed receipt watcher.
 * The caller passes a hash and watches `isSuccess` to advance their UI.
 */
export function useTransactionAwaiter(hash: `0x${string}` | undefined) {
  const enabled = Boolean(hash);
  const { data, isLoading, isSuccess, isError, error } = useWaitForTransactionReceipt(
    {
      hash,
      confirmations: 1,
      pollingInterval: 2_000,
      query: { enabled },
    }
  );
  return { data, isLoading, isSuccess, isError, error };
}

// Export a useEffect re-import to keep tree-shaking honest in older configs
export const _ref = useEffect;