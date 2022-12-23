import assert from "assert";

import { queryBalancesGC, queryBalancesMainnet } from "./querySubgraph";
import { queryAmountVested } from "./queryVestingPool";
import without from "../fns/balancemapWithout";

import { AddressConfig, ProviderConfig, VestingSlice } from "../types";

export async function queryAllocationSetup(
  entry: VestingSlice,
  addresses: AddressConfig,
  vestingId: string,
  lgnoTimestamp: number,
  providers: ProviderConfig,
  log?: (text: string) => void,
) {
  const [blockMainnet, blockGnosis] = await Promise.all([
    providers.mainnet.getBlock(entry.mainnet),
    providers.gnosis.getBlock(entry.gnosis),
  ]);

  const withLgno =
    blockMainnet.timestamp < lgnoTimestamp &&
    blockGnosis.timestamp < lgnoTimestamp;

  const prevBlockNumber = entry.prev ? entry.prev.mainnet : null;
  const currBlockNumber = entry.mainnet;

  log?.(`Considering LGNO: ${withLgno ? "yes" : "no"}`);

  const [balancesMainnet, balancesGC, prevAmountVested, amountVested] =
    await Promise.all([
      queryBalancesMainnet(blockMainnet.number, withLgno),
      queryBalancesGC(blockGnosis.number, withLgno),
      prevBlockNumber !== null
        ? queryAmountVested(
            addresses.mainnet.vestingPool,
            vestingId,
            prevBlockNumber,
            providers.mainnet,
          )
        : 0,
      queryAmountVested(
        addresses.mainnet.vestingPool,
        vestingId,
        currBlockNumber,
        providers.mainnet,
      ),
    ]);

  assert(amountVested.gte(prevAmountVested));

  const ignore = {
    mainnet: [addresses.mainnet.treasurySafe],
    gnosis: [addresses.gnosis.treasurySafe],
  };

  return {
    balancesMainnet: without(balancesMainnet, ignore.mainnet),
    balancesGC: without(balancesGC, ignore.gnosis),
    amountVested: amountVested.sub(prevAmountVested),
  };
}
