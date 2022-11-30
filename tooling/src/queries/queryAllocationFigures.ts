import { Provider } from "@ethersproject/providers";
import assert from "assert";

import { queryBalancesMainnet, queryBalancesGC } from "./querySubgraph";
import { queryAmountVested } from "./queryVestingPool";

import calculateAllocation from "../fns/calculateAllocation";
import snapshotWithout from "../fns/snapshotWithout";
import snapshotSum from "../fns/snapshotSum";

import { ScheduleEntry } from "../persistence";

import {
  TOKEN_LOCK_OPEN_TIMESTAMP,
  VESTING_ID,
  VESTING_POOL_ADDRESS,
} from "../config";

export async function queryAllocationFigures(
  prevEntry: ScheduleEntry | null,
  entry: ScheduleEntry,
  ignore: { mainnet: string[]; gc: string[] },
  provider: Provider,
  log?: (text: string) => void,
) {
  const withLGNO =
    entry.mainnet.timestamp < TOKEN_LOCK_OPEN_TIMESTAMP &&
    entry.gc.timestamp < TOKEN_LOCK_OPEN_TIMESTAMP;

  log?.(`Considering LGNO: ${withLGNO ? "yes" : "no"}`);

  let [balancesMainnet, balancesGC, prevAmountVested, amountVested] =
    await Promise.all([
      queryBalancesMainnet(entry.mainnet.blockNumber, withLGNO),
      queryBalancesGC(entry.gc.blockNumber, withLGNO),
      prevEntry
        ? queryAmountVested(
            VESTING_POOL_ADDRESS,
            VESTING_ID,
            prevEntry.mainnet.blockNumber,
            provider,
          )
        : 0,
      queryAmountVested(
        VESTING_POOL_ADDRESS,
        VESTING_ID,
        entry.mainnet.blockNumber,
        provider,
      ),
    ]);

  assert(amountVested.gte(prevAmountVested));

  balancesMainnet = snapshotWithout(balancesMainnet, ignore.mainnet);
  balancesGC = snapshotWithout(balancesGC, ignore.gc);
  const amountVestedInInterval = amountVested.sub(prevAmountVested);

  // just re-use allocation math to figure how much (for this vestingSlice)
  // does Mainnet get, and how much does GC get
  const result = calculateAllocation(
    { mainnet: snapshotSum(balancesMainnet), gc: snapshotSum(balancesGC) },
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
