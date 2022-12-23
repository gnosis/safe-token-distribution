import assert from "assert";
import { BigNumber } from "ethers";

import balancemapSum from "./balancemapSum";

import { loadAllocation } from "../persistence";
import { Schedule } from "../types";

export default function calculateFundingBreakdown(
  schedule: Schedule,
  amountToClaim: BigNumber,
) {
  const reversedSchedule = [...schedule].reverse();
  let totalMainnet = BigNumber.from(0);
  let totalGnosis = BigNumber.from(0);

  for (const { mainnet, gnosis } of reversedSchedule) {
    const allocationMainnet = loadAllocation("mainnet", mainnet);
    assert(!!allocationMainnet);
    const allocationGC = loadAllocation("gnosis", gnosis);
    assert(!!allocationGC);

    totalMainnet = totalMainnet.add(balancemapSum(allocationMainnet));
    totalGnosis = totalGnosis.add(balancemapSum(allocationGC));
    const total = totalMainnet.add(totalGnosis);

    if (total.eq(amountToClaim)) {
      return {
        amountToFundMainnet: totalMainnet,
        amountToFundGnosis: totalGnosis,
      };
    }

    if (total.gt(amountToClaim)) {
      throw new Error("!!!Accounting Overflow Panic!!!");
    }
  }

  throw new Error("!!!Accounting Underflow Panic!!!");
}
