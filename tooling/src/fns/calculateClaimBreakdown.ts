import assert from "assert";
import { BigNumber } from "ethers";

import snapshotSum from "./snapshotSum";

import { loadAllocation } from "../persistence";
import { Schedule } from "../types";

export default async function calculateClaimBreakdown(
  schedule: Schedule,
  amountToClaim: BigNumber,
) {
  const reversedSchedule = [...schedule].reverse();
  let totalMainnet = BigNumber.from(0);
  let totalGC = BigNumber.from(0);

  for (const { mainnet, gnosis } of reversedSchedule) {
    const allocationMainnet = loadAllocation("mainnet", mainnet.blockNumber);
    assert(!!allocationMainnet);
    const allocationGC = loadAllocation("gnosis", gnosis.blockNumber);
    assert(!!allocationGC);

    totalMainnet = totalMainnet.add(snapshotSum(allocationMainnet));
    totalGC = totalGC.add(snapshotSum(allocationGC));
    const total = totalMainnet.add(totalGC);

    if (total.eq(amountToClaim)) {
      return {
        amountForMainnet: totalMainnet,
        amountForGC: totalGC,
      };
    }

    if (total.gt(amountToClaim)) {
      throw new Error("!!!Accounting Overflow Panic!!!");
    }
  }

  throw new Error("!!!Accounting Underflow Panic!!!");
}
