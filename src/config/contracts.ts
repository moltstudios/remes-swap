/**
 * Contract addresses & config for Remes Swap on Base chain
 */

export const CONTRACTS = {
  UNISWAP_V3_ROUTER: (process.env.NEXT_PUBLIC_UNISWAP_V3_ROUTER || '0x2626664c2603336E57B271c5C0b26F421741e481').trim(),
  UNISWAP_V3_QUOTER: (process.env.NEXT_PUBLIC_UNISWAP_V3_QUOTER || '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6').trim(),
  USDC: (process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913').trim(),
  USDT: (process.env.NEXT_PUBLIC_USDT_ADDRESS || '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2').trim(),
} as const

export const SWAP_CONFIG = {
  PLATFORM_FEE_BIPS: 30, // 0.3%
  DEFAULT_SLIPPAGE_BPS: 50, // 0.5%
  DEFAULT_DEADLINE_MINUTES: 20,
  POOL_FEES: [500, 3000, 100, 10000], // try in priority order
} as const

export const BASE_CHAIN = {
  mainnet: { id: 8453, name: 'Base' },
  sepolia: { id: 84532, name: 'Base Sepolia' },
} as const
