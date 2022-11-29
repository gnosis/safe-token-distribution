import { Provider } from "@ethersproject/providers";
import assert from "assert";
import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { DAO_ADDRESS_GC, DAO_ADDRESS_MAINNET, getProviders } from "../config";
import { allocate } from "../domain/allocation";
import { findEntry } from "../domain/schedule";
import {
  loadSchedule,
  loadAllocation,
  saveAllocation,
  ScheduleEntry,
} from "../persistence";
import { queryAllocationFigures } from "../queries/queryAllocationFigures";
import { sum } from "../snapshot";

task(
  "allocate:write-all",
  "Goes through the schedule, and writes an allocation file each entry",
)
  .addOptionalParam(
    "lazy",
    "Don't recalculate if already in disk",
    true,
    types.boolean,
  )
  .setAction(async ({ lazy }, hre: HardhatRuntimeEnvironment) => {
    const log = (text: string) => console.info(`allocate:write-all ${text}`);

    const schedule = loadSchedule();
    const providers = getProviders(hre);

    log("Starting");

    for (const entry of schedule) {
      const allocationsMainnet = lazy
        ? loadAllocation("mainnet", entry.mainnet.blockNumber)
        : null;
      const allocationsGC = lazy
        ? loadAllocation("gc", entry.gc.blockNumber)
        : null;

      if (!allocationsMainnet || !allocationsGC) {
        _writeOne(entry, providers, log);
      }
    }
  });

task(
  "allocate:write-one",
  "Gets a schedule entry from a block number, and writes one allocation file",
)
  .addPositionalParam("block", "A block number", undefined, types.int)
  .setAction(async ({ block }, hre: HardhatRuntimeEnvironment) => {
    const log = (text: string) => console.info(`allocate:write-one ${text}`);

    const schedule = loadSchedule();
    const providers = getProviders(hre);
    log("Starting");

    const entry = findEntry(schedule, block);
    if (!entry) {
      throw new Error(`Could not find a schedule entry for ${block}`);
    }

    _writeOne(entry, providers, log);
  });

async function _writeOne(
  entry: ScheduleEntry,
  providers: { mainnet: Provider; gc: Provider },
  log: (text: string) => void,
) {
  const ignoreAddresses = {
    mainnet: [DAO_ADDRESS_MAINNET],
    gc: [DAO_ADDRESS_GC],
  };

  log(`mainnet ${entry.mainnet.blockNumber} gc ${entry.gc.blockNumber}`);
  const { balancesMainnet, balancesGC, toAllocateMainnet, toAllocateGC } =
    await queryAllocationFigures(
      entry,
      ignoreAddresses,
      providers.mainnet,
      log,
    );

  const allocationsMainnet = allocate(balancesMainnet, toAllocateMainnet);
  assert(sum(allocationsMainnet).eq(toAllocateMainnet));

  const allocationsGC = allocate(balancesGC, toAllocateGC);
  assert(sum(allocationsGC).eq(toAllocateGC));

  saveAllocation("mainnet", entry.mainnet.blockNumber, allocationsMainnet);
  saveAllocation("gc", entry.gc.blockNumber, allocationsGC);
}
