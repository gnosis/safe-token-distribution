import assert from "assert";
import { BigNumber } from "ethers";

import calculateAllocation from "./calculateAllocation";
import snapshotSum from "./snapshotSum";

import { BalanceMap } from "../types";

export default function calculateAllocationBreakdown(
  balancesMainnet: BalanceMap,
  balancesGC: BalanceMap,
  amountVested: BigNumber,
) {
  // just re-use allocation math to figure how much (for this vestingSlice)
  // does Mainnet get, and how much does GC get
  const result = calculateAllocation(
    { mainnet: snapshotSum(balancesMainnet), gnosis: snapshotSum(balancesGC) },
    amountVested,
  );

  const allocatedToMainnet = BigNumber.from(result.mainnet || 0);
  const allocatedToGnosis = BigNumber.from(result.gnosis || 0);
  // sanity check
  assert(allocatedToMainnet.add(allocatedToGnosis).eq(amountVested));

  return {
    allocatedToMainnet,
    allocatedToGnosis,
  };
}
