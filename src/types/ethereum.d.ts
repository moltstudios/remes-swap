// Type declarations for window.ethereum (EIP-1193 provider)
// Injected by MetaMask, Coinbase Wallet, and other EIP-1193 wallets

export interface EIP1193Provider {
  request<T = unknown>(args: { method: string; params?: unknown[] }): Promise<T>;
  on?(event: string, handler: (...args: unknown[]) => void): void;
  removeListener?(event: string, handler: (...args: unknown[]) => void): void;
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
}

export interface EIP1193TxReceipt {
  status: string;
  blockHash: string;
  blockNumber: string;
  contractAddress: string | null;
  cumulativeGasUsed: string;
  from: string;
  gasUsed: string;
  logs: unknown[];
  logsBloom: string;
  to: string;
  transactionHash: string;
  transactionIndex: string;
}

export {};

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}
