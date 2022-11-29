import { Provider } from "@ethersproject/providers";
import assert from "assert";

import { allocate } from "../domain/allocation";
import { ScheduleEntry } from "../persistence";
import { sum, without } from "../snapshot";

import { queryBalancesMainnet, queryBalancesGC } from "./querySubgraph";
import { queryVestedInInterval } from "./queryVestingPool";

import {
  TOKEN_LOCK_OPEN_TIMESTAMP,
  VESTING_ID,
  VESTING_POOL_ADDRESS,
} from "../config";

export async function queryAllocationFigures(
  entry: { mainnet: ScheduleEntry; gc: ScheduleEntry },
  ignore: { mainnet: string[]; gc: string[] },
  provider: Provider,
  log?: (text: string) => void,
) {
  const withLGNO =
    entry.mainnet.timestamp < TOKEN_LOCK_OPEN_TIMESTAMP &&
    entry.gc.timestamp < TOKEN_LOCK_OPEN_TIMESTAMP;

  log?.(`Considering LGNO: ${withLGNO ? "yes" : "no"}`);

  let [balancesMainnet, balancesGC, amountVestedInInterval] = await Promise.all(
    [
      queryBalancesMainnet(entry.mainnet.blockNumber, withLGNO),
      queryBalancesGC(entry.gc.blockNumber, withLGNO),
      queryVestedInInterval(
        VESTING_POOL_ADDRESS,
        VESTING_ID,
        entry.mainnet.blockNumber,
        provider,
      ),
    ],
  );

  balancesMainnet = without(balancesMainnet, ignore.mainnet);
  balancesGC = without(balancesGC, ignore.gc);

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
