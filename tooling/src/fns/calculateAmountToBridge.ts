import assert from "assert";
import { BigNumber } from "ethers";

import { loadAllocation, Schedule } from "../persistence";

import snapshotSum from "../fns/snapshotSum";

export default async function calculateAmountToBridge(
  schedule: Schedule,
  amountToClaim: BigNumber,
) {
  const reversedSchedule = [...schedule].reverse();
  let totalMainnet = BigNumber.from(0);
  let totalGC = BigNumber.from(0);

  for (const { mainnet, gc } of reversedSchedule) {
    const allocationMainnet = loadAllocation("mainnet", mainnet.blockNumber);
    assert(!!allocationMainnet);
    const allocationGC = loadAllocation("gc", gc.blockNumber);
    assert(!!allocationGC);

    totalMainnet = totalMainnet.add(snapshotSum(allocationMainnet));
    totalGC = totalGC.add(snapshotSum(allocationGC));
    const total = totalMainnet.add(totalGC);

    if (total.eq(amountToClaim)) {
      const amountToBridge = totalGC;
      return amountToBridge;
    }

    if (total.gt(amountToClaim)) {
      throw new Error("!!!Accounting Overflow Panic!!!");
    }
  }

  throw new Error("!!!Accounting Underflow Panic!!!");
}
