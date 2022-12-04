import { Provider } from "@ethersproject/providers";
import assert from "assert";
import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { DAO_ADDRESS_GC, DAO_ADDRESS_MAINNET, getProviders } from "../config";

import { queryAllocationFigures } from "../queries/queryAllocationFigures";

import calculate from "../fns/calculateAllocation";
import snapshotSort from "../fns/snapshotSort";
import snapshotSum from "../fns/snapshotSum";
import scheduleFind from "../fns/scheduleFind";

import {
  loadSchedule,
  loadAllocation,
  saveAllocation,
  ScheduleEntry,
} from "../persistence";

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
        const { prevEntry } = scheduleFind(schedule, entry.mainnet.blockNumber);

        assert(
          prevEntry === null ||
            schedule.indexOf(prevEntry) + 1 == schedule.indexOf(entry),
        );

        await _writeOne(prevEntry, entry, providers, log);
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

    const { prevEntry, entry } = scheduleFind(schedule, block);
    if (!entry) {
      throw new Error(`Could not find a schedule entry for ${block}`);
    }

    await _writeOne(prevEntry, entry, providers, log);
  });

async function _writeOne(
  prevEntry: ScheduleEntry | null,
  entry: ScheduleEntry,
  providers: { mainnet: Provider; gc: Provider },
  log: (text: string) => void,
) {
  const ignoreAddresses = {
    mainnet: [DAO_ADDRESS_MAINNET],
    gc: [DAO_ADDRESS_GC],
  };

  const blockMainnet = entry.mainnet.blockNumber;
  const blockGC = entry.gc.blockNumber;

  log(`mainnet ${blockMainnet} gc ${blockGC}`);
  const { balancesMainnet, balancesGC, toAllocateMainnet, toAllocateGC } =
    await queryAllocationFigures(
      prevEntry,
      entry,
      ignoreAddresses,
      providers.mainnet,
      log,
    );

  const allocationMainnet = calculate(balancesMainnet, toAllocateMainnet);
  assert(snapshotSum(allocationMainnet).eq(toAllocateMainnet));

  const allocationGC = calculate(balancesGC, toAllocateGC);
  assert(snapshotSum(allocationGC).eq(toAllocateGC));

  saveAllocation("mainnet", blockMainnet, snapshotSort(allocationMainnet));
  saveAllocation("gc", blockGC, snapshotSort(allocationGC));
}
