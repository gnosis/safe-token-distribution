import assert from "assert";

import calculateAllocation from "./calculateAddressAllocation";
import snapshotSum from "./snapshotSum";

import { Snapshot } from "../types";
import { BigNumber } from "ethers";

export default async function calculateNetworkAllocation(
  balancesMainnet: Snapshot,
  balancesGC: Snapshot,
  amountVested: BigNumber,
) {
  // just re-use allocation math to figure how much (for this vestingSlice)
  // does Mainnet get, and how much does GC get
  const result = calculateAllocation(
    { mainnet: snapshotSum(balancesMainnet), gnosis: snapshotSum(balancesGC) },
    amountVested,
  );

  const allocatedToMainnet = BigNumber.from(result.mainnet || 0);
  const allocatedToGC = BigNumber.from(result.gnosis || 0);
  // sanity check
  assert(allocatedToMainnet.add(allocatedToGC).eq(amountVested));

  return {
    allocatedToMainnet,
    allocatedToGC,
  };
}
