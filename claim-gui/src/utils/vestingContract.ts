const abi = [
  "function vestings(bytes32 vestingId) view returns (address account, uint8 curveType, bool managed, uint16 durationWeeks, uint64 startDate, uint128 amount)",
  "function calculateVestedAmount(bytes32) view returns (uint128 vestedAmount, uint128 claimedAmount)",
];

const vestingContract = {
  chainId: 1,
  address: "0x96b71e2551915d98d22c448b040a3bc4801ea4ff",
  abi,
};

export default vestingContract;
