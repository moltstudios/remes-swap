import { BASE_TOKENS } from "@/lib/web3/contracts";

export type TokenMeta = {
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
};

export const SUPPORTED_TOKENS: TokenMeta[] = [
  {
    address: BASE_TOKENS.USDC.address,
    symbol: BASE_TOKENS.USDC.symbol,
    name: BASE_TOKENS.USDC.name,
    decimals: BASE_TOKENS.USDC.decimals,
    logoURI: BASE_TOKENS.USDC.logoURI,
  },
  {
    address: BASE_TOKENS.USDT.address,
    symbol: BASE_TOKENS.USDT.symbol,
    name: BASE_TOKENS.USDT.name,
    decimals: BASE_TOKENS.USDT.decimals,
    logoURI: BASE_TOKENS.USDT.logoURI,
  },
];