const abi = [
  {
    inputs: [
      { internalType: "address", name: "_token", type: "address" },
      { internalType: "address", name: "_poolManager", type: "address" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "id", type: "bytes32" },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "AddedVesting",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "id", type: "bytes32" },
    ],
    name: "CancelledVesting",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "id", type: "bytes32" },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "beneficiary",
        type: "address",
      },
    ],
    name: "ClaimedVesting",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "id", type: "bytes32" },
    ],
    name: "PausedVesting",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "id", type: "bytes32" },
    ],
    name: "UnpausedVesting",
    type: "event",
  },
  {
    inputs: [
      { internalType: "address", name: "account", type: "address" },
      { internalType: "uint8", name: "curveType", type: "uint8" },
      { internalType: "bool", name: "managed", type: "bool" },
      { internalType: "uint16", name: "durationWeeks", type: "uint16" },
      { internalType: "uint64", name: "startDate", type: "uint64" },
      { internalType: "uint128", name: "amount", type: "uint128" },
    ],
    name: "addVesting",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "vestingId", type: "bytes32" }],
    name: "calculateVestedAmount",
    outputs: [
      { internalType: "uint128", name: "vestedAmount", type: "uint128" },
      { internalType: "uint128", name: "claimedAmount", type: "uint128" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "vestingId", type: "bytes32" }],
    name: "cancelVesting",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "vestingId", type: "bytes32" },
      { internalType: "address", name: "beneficiary", type: "address" },
      { internalType: "uint128", name: "tokensToClaim", type: "uint128" },
    ],
    name: "claimVestedTokens",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "vestingId", type: "bytes32" }],
    name: "pauseVesting",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "poolManager",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "token",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "tokensAvailableForVesting",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalTokensInVesting",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "vestingId", type: "bytes32" }],
    name: "unpauseVesting",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "account", type: "address" },
      { internalType: "uint8", name: "curveType", type: "uint8" },
      { internalType: "bool", name: "managed", type: "bool" },
      { internalType: "uint16", name: "durationWeeks", type: "uint16" },
      { internalType: "uint64", name: "startDate", type: "uint64" },
      { internalType: "uint128", name: "amount", type: "uint128" },
    ],
    name: "vestingHash",
    outputs: [{ internalType: "bytes32", name: "vestingId", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    name: "vestings",
    outputs: [
      { internalType: "address", name: "account", type: "address" },
      { internalType: "uint8", name: "curveType", type: "uint8" },
      { internalType: "bool", name: "managed", type: "bool" },
      { internalType: "uint16", name: "durationWeeks", type: "uint16" },
      { internalType: "uint64", name: "startDate", type: "uint64" },
      { internalType: "uint128", name: "amount", type: "uint128" },
      { internalType: "uint128", name: "amountClaimed", type: "uint128" },
      { internalType: "uint64", name: "pausingDate", type: "uint64" },
      { internalType: "bool", name: "cancelled", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

const vestingContract = {
  chainId: 1,
  address: "0x96b71e2551915d98d22c448b040a3bc4801ea4ff",
  abi,
};

export default vestingContract;
