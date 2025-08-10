export const IPoolAbi = [
  {
    type: 'function',
    name: 'getReservesList',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address[]' }],
  },
  {
    type: 'function',
    name: 'getReserveData',
    stateMutability: 'view',
    inputs: [{ name: 'asset', type: 'address' }],
    outputs: [
      {
        components: [
          { name: 'configuration', type: 'uint256' },
          { name: 'liquidityIndex', type: 'uint128' },
          { name: 'currentLiquidityRate', type: 'uint128' },
          { name: 'variableBorrowIndex', type: 'uint128' },
          { name: 'currentVariableBorrowRate', type: 'uint128' },
          { name: 'currentStableBorrowRate', type: 'uint128' },
          { name: 'lastUpdateTimestamp', type: 'uint40' },
          { name: 'aTokenAddress', type: 'address' },
          { name: 'stableDebtTokenAddress', type: 'address' },
          { name: 'variableDebtTokenAddress', type: 'address' },
          { name: 'interestRateStrategyAddress', type: 'address' },
          { name: 'id', type: 'uint8' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
  },
] as const;

export const ERC20Abi = [
  {
    type: 'function',
    name: 'symbol',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
  },
  {
    type: 'function',
    name: 'name',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }],
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
] as const;

export const UiPoolDataProviderV3Abi = [
  {
    type: 'function',
    name: 'getReservesData',
    stateMutability: 'view',
    inputs: [{ name: 'provider', type: 'address' }],
    outputs: [
      {
        components: [
          {
            components: [
              { name: 'underlyingAsset', type: 'address' },
              { name: 'name', type: 'string' },
              { name: 'symbol', type: 'string' },
              { name: 'decimals', type: 'uint256' },
              { name: 'liquidityRate', type: 'uint256' },
            ],
            name: '',
            type: 'tuple',
          },
        ],
        name: '',
        type: 'tuple[]',
      },
      {
        components: [
          { name: 'marketReferenceCurrencyUnit', type: 'uint256' },
          { name: 'marketReferenceCurrencyPriceInUsd', type: 'uint256' },
          { name: 'networkBaseTokenPriceInUsd', type: 'uint256' },
          { name: 'networkBaseTokenPriceDecimals', type: 'uint8' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
  },
] as const;
