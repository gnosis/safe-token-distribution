import { Provider } from "@ethersproject/providers";
import assert from "assert";
import { allocate } from "../domain/allocation";
import { ScheduleEntry } from "../persistence";
import { sum } from "../snapshot";

import { queryBalancesMainnet, queryBalancesGC } from "./querySubgraph";
import { queryVestedInInterval } from "./queryVestingPool";

export async function queryAllocationAmounts(
  entry: { mainnet: ScheduleEntry; gc: ScheduleEntry },
  vestingContract: string,
  vestingId: string,
  provider: Provider,
) {
  const [balancesMainnet, balancesGC, amountVestedInInterval] =
    await Promise.all([
      queryBalancesMainnet(entry.mainnet.blockNumber),
      queryBalancesGC(entry.gc.blockNumber),
      queryVestedInInterval(
        vestingContract,
        vestingId,
        entry.mainnet.blockNumber,
        provider,
      ),
    ]);

  // just re-use allocation math to figure how much (for this vestingSlice)
  // does Mainnet get, and how much does GC get
  const result = allocate(
    { mainnet: sum(balancesMainnet), gc: sum(balancesGC) },
    amountVestedInInterval,
  );

  // sanity check
  assert(result.mainnet.add(result.gc).eq(amountVestedInInterval));

  return {
    balancesMainnet,
    balancesGC,
    toAllocateMainnet: result.mainnet,
    toAllocateGC: result.gc,
  };
}
