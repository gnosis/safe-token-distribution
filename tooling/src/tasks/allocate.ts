import { getProviders, VESTING_ID, VESTING_POOL_ADDRESS } from "../config";
import { allocate } from "../domain/allocation";
import {
  loadSchedule,
  loadAllocation,
  saveAllocation,
  ScheduleEntry,
} from "../persistence";
import {
  queryBalancesGC,
  queryBalancesMainnet,
} from "../queries/queryBalances";
import queryVestedInInterval from "../queries/queryVestedInInterval";
import { sum } from "../snapshot";
import { Provider } from "@ethersproject/providers";
import assert from "assert";
import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

task("allocate:write-all", "")
  .addOptionalParam(
    "lazy",
    "Don't recalculate if result is found on disk",
    true,
    types.boolean,
  )
  .setAction(async ({ lazy }, hre: HardhatRuntimeEnvironment) => {
    const log = (text: string) => console.info(`snapshot:write ${text}`);

    const schedule = loadSchedule();
    const providers = getProviders(hre);

    log("Starting");

    for (const entry of schedule) {
      let allocationsMainnet = loadAllocation(
        "mainnet",
        entry.mainnet.blockNumber,
      );
      let allocationsGC = loadAllocation("gc", entry.gc.blockNumber);

      if (lazy === false || !allocationsMainnet || !allocationsGC) {
        log(`mainnet ${entry.mainnet.blockNumber} gc ${entry.gc.blockNumber}`);
        const { balancesMainnet, balancesGC, toAllocateMainnet, toAllocateGC } =
          await fetchBalancesAndTotals(
            entry,
            VESTING_POOL_ADDRESS,
            VESTING_ID,
            providers.mainnet,
          );

        allocationsMainnet = allocate(balancesMainnet, toAllocateMainnet);
        assert(sum(allocationsMainnet).eq(toAllocateMainnet));

        allocationsGC = allocate(balancesGC, toAllocateGC);
        assert(sum(allocationsGC).eq(toAllocateGC));

        saveAllocation(
          "mainnet",
          entry.mainnet.blockNumber,
          allocationsMainnet,
        );
        saveAllocation("gc", entry.gc.blockNumber, allocationsGC);
      }
    }
  });

async function fetchBalancesAndTotals(
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

  // use the same allocate math to decide amounts going to mainnet
  // and amount going to gc
  const result = allocate(
    { mainnet: sum(balancesMainnet), gc: sum(balancesGC) },
    amountVestedInInterval,
  );

  assert(result.mainnet.add(result.gc).eq(amountVestedInInterval));

  return {
    balancesMainnet,
    balancesGC,
    toAllocateMainnet: result.mainnet,
    toAllocateGC: result.gc,
  };
}
