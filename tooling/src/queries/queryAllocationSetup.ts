import assert from "assert";
import { Provider } from "@ethersproject/providers";

import { queryBalancesGC, queryBalancesMainnet } from "./querySubgraph";
import { queryAmountVested } from "./queryVestingPool";
import snapshotWithout from "../fns/snapshotWithout";

import { AddressConfig, ScheduleEntry } from "../types";

export async function queryAllocationSetup(
  prevEntry: ScheduleEntry | null,
  entry: ScheduleEntry,
  addresses: AddressConfig,
  vestingId: string,
  lgnoTimestamp: number,
  provider: Provider,
  log?: (text: string) => void,
) {
  const ignore = {
    mainnet: [addresses.mainnet.treasurySafe],
    gnosis: [addresses.gnosis.treasurySafe],
  };

  const withLgno =
    entry.mainnet.timestamp < lgnoTimestamp &&
    entry.gnosis.timestamp < lgnoTimestamp;

  log?.(`Considering LGNO: ${withLgno ? "yes" : "no"}`);

  let [balancesMainnet, balancesGC, prevAmountVested, amountVested] =
    await Promise.all([
      queryBalancesMainnet(entry.mainnet.blockNumber, withLgno),
      queryBalancesGC(entry.gnosis.blockNumber, withLgno),
      prevEntry
        ? queryAmountVested(
            addresses.mainnet.vestingPool,
            vestingId,
            prevEntry.mainnet.blockNumber,
            provider,
          )
        : 0,
      queryAmountVested(
        addresses.mainnet.vestingPool,
        vestingId,
        entry.mainnet.blockNumber,
        provider,
      ),
    ]);

  assert(amountVested.gte(prevAmountVested));

  balancesMainnet = snapshotWithout(balancesMainnet, ignore.mainnet);
  balancesGC = snapshotWithout(balancesGC, ignore.gnosis);

  return {
    balancesMainnet,
    balancesGC,
    amountVested: amountVested.sub(prevAmountVested),
  };
}
