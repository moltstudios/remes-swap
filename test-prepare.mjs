import { ethers } from 'ethers'

const RPC = 'https://mainnet.base.org'
const ROUTER = '0x2626664c2603336E57B271c5C0b26F421741e481'
const USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
const USDT = '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2'

const SWAP_ROUTER_ABI = [
  {
    inputs: [
      {
        components: [
          { internalType: 'address', name: 'tokenIn', type: 'address' },
          { internalType: 'address', name: 'tokenOut', type: 'address' },
          { internalType: 'uint24', name: 'fee', type: 'uint24' },
          { internalType: 'address', name: 'recipient', type: 'address' },
          { internalType: 'uint256', name: 'amountIn', type: 'uint256' },
          { internalType: 'uint256', name: 'amountOutMinimum', type: 'uint256' },
          { internalType: 'uint160', name: 'sqrtPriceLimitX96', type: 'uint160' },
        ],
        internalType: 'tuple',
        name: 'params',
        type: 'tuple',
      },
    ],
    name: 'exactInputSingle',
    outputs: [{ internalType: 'uint256', name: 'amountOut', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function',
  },
]

const provider = new ethers.JsonRpcProvider(RPC)
const router = new ethers.Contract(ROUTER, SWAP_ROUTER_ABI, provider)

// Test encode
const swapParams = {
  tokenIn: USDC,
  tokenOut: USDT,
  fee: 100,
  recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
  amountIn: ethers.parseUnits('100', 6),
  amountOutMinimum: ethers.parseUnits('99.344477', 6),
  sqrtPriceLimitX96: 0n,
}

try {
  const calldata = router.interface.encodeFunctionData('exactInputSingle', [swapParams])
  console.log('Encoded calldata (first 200 chars):', calldata.substring(0, 200))
  console.log('Length:', calldata.length)
} catch (e) {
  console.log('Encode error:', e.message)
}
