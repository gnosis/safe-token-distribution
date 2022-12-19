import assert from "assert";
import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { queryAllocationSetup } from "../queries/queryAllocationSetup";
import calculateAllocation from "../fns/calculateAllocation";
import calculateAllocationBreakdown from "../fns/calculateAllocationBreakdown";
import scheduleFind from "../fns/scheduleFind";
import snapshotSort from "../fns/snapshotSort";
import snapshotSum from "../fns/snapshotSum";

import { loadSchedule, loadAllocation, saveAllocation } from "../persistence";
import {
  addresses,
  getProviders,
  GNO_LOCK_OPEN_TIMESTAMP,
  VESTING_ID,
} from "../config";
import { ProviderConfig, VestingSlice } from "../types";

task(
  "allocate:all",
  "Calculates and persists one allocation file for every entry in the schedule",
)
  .addOptionalParam(
    "lazy",
    "Don't recalculate an allocation entry if already in disk",
    true,
    types.boolean,
  )
  .setAction(async ({ lazy }, hre: HardhatRuntimeEnvironment) => {
    const log = (text: string) => console.info(`Task allocate:all -> ${text}`);

    const providers = getProviders(hre);
    const schedule = loadSchedule();

    log("Starting");

    for (const entry of schedule) {
      const allocationsMainnet = lazy
        ? loadAllocation("mainnet", entry.mainnet)
        : null;
      const allocationsGC = lazy
        ? loadAllocation("gnosis", entry.gnosis)
        : null;

      if (!allocationsMainnet || !allocationsGC) {
        await _writeOne(entry, providers, log);
      }
    }
  });

task(
  "allocate:one",
  "Calculates and persists one allocation file for a given block number",
)
  .addPositionalParam("block", "A block number", undefined, types.int)
  .setAction(async ({ block }, hre: HardhatRuntimeEnvironment) => {
    const log = (text: string) => console.info(`Task allocate:one -> ${text}`);

    const providers = getProviders(hre);

    const schedule = loadSchedule();

    log("Starting");

    const entry = scheduleFind(schedule, block);
    if (!entry) {
      throw new Error(`Could not find a schedule entry for ${block}`);
    }

    await _writeOne(entry, providers, log);
  });

async function _writeOne(
  entry: VestingSlice,
  providers: ProviderConfig,
  log: (text: string) => void,
) {
  const blockMainnet = entry.mainnet;
  const blockGC = entry.gnosis;

  log(`mainnet ${blockMainnet} gnosis ${blockGC}`);
  const { balancesMainnet, balancesGC, amountVested } =
    await queryAllocationSetup(
      entry,
      addresses,
      VESTING_ID,
      GNO_LOCK_OPEN_TIMESTAMP,
      providers,
      log,
    );

  const { allocatedToMainnet, allocatedToGnosis } =
    calculateAllocationBreakdown(balancesMainnet, balancesGC, amountVested);

  const allocationMainnet = calculateAllocation(
    balancesMainnet,
    allocatedToMainnet,
  );
  assert(snapshotSum(allocationMainnet).eq(allocatedToMainnet));

  const allocationGC = calculateAllocation(balancesGC, allocatedToGnosis);
  assert(snapshotSum(allocationGC).eq(allocatedToGnosis));

  saveAllocation("mainnet", blockMainnet, snapshotSort(allocationMainnet));
  saveAllocation("gnosis", blockGC, snapshotSort(allocationGC));
}
