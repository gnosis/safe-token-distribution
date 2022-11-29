import assert from "assert";
import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { getProviders } from "../config";
import { allocate } from "../domain/allocation";
import { loadSchedule, loadAllocation, saveAllocation } from "../persistence";
import { queryAllocationFigures } from "../queries/queryAllocationFigures";
import { sum } from "../snapshot";

task("allocate:write-all", "")
  .addOptionalParam(
    "lazy",
    "Don't recalculate if already in disk",
    true,
    types.boolean,
  )
  .setAction(async ({ lazy }, hre: HardhatRuntimeEnvironment) => {
    const log = (text: string) => console.info(`allocate:write ${text}`);

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
          await queryAllocationFigures(entry, providers.mainnet, log);

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
