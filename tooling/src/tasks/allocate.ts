import { Provider } from "@ethersproject/providers";
import assert from "assert";
import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import {
  queryBalancesGC,
  queryBalancesMainnet,
} from "../queries/querySubgraph";
import { queryAmountVested } from "../queries/queryVestingPool";

import calculateAllocation from "../fns/calculateAddressAllocation";
import calculateNetworkAllocation from "../fns/calculateNetworkAllocation";
import scheduleFind from "../fns/scheduleFind";
import snapshotSort from "../fns/snapshotSort";
import snapshotSum from "../fns/snapshotSum";
import snapshotWithout from "../fns/snapshotWithout";

import {
  loadSchedule,
  loadAllocation,
  saveAllocation,
  ScheduleEntry,
} from "../persistence";

import {
  DAO_ADDRESS_GC,
  DAO_ADDRESS_MAINNET,
  getProviders,
  TOKEN_LOCK_OPEN_TIMESTAMP,
  VESTING_ID,
  VESTING_POOL_ADDRESS,
} from "../config";

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
        ? loadAllocation("gnosis", entry.gnosis.blockNumber)
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
  const blockMainnet = entry.mainnet.blockNumber;
  const blockGC = entry.gnosis.blockNumber;

  log(`mainnet ${blockMainnet} gnosis ${blockGC}`);
  const { balancesMainnet, balancesGC, amountVested } =
    await fetchAllocationFigures(prevEntry, entry, providers.mainnet, log);

  const { allocatedToMainnet, allocatedToGC } =
    await calculateNetworkAllocation(balancesMainnet, balancesGC, amountVested);

  const allocationMainnet = calculateAllocation(
    balancesMainnet,
    allocatedToMainnet,
  );
  assert(snapshotSum(allocationMainnet).eq(allocatedToMainnet));

  const allocationGC = calculateAllocation(balancesGC, allocatedToGC);
  assert(snapshotSum(allocationGC).eq(allocatedToGC));

  saveAllocation("mainnet", blockMainnet, snapshotSort(allocationMainnet));
  saveAllocation("gnosis", blockGC, snapshotSort(allocationGC));
}

async function fetchAllocationFigures(
  prevEntry: ScheduleEntry | null,
  entry: ScheduleEntry,
  provider: Provider,
  log?: (text: string) => void,
) {
  const ignore = {
    mainnet: [DAO_ADDRESS_MAINNET],
    gnosis: [DAO_ADDRESS_GC],
  };

  const withLGNO =
    entry.mainnet.timestamp < TOKEN_LOCK_OPEN_TIMESTAMP &&
    entry.gnosis.timestamp < TOKEN_LOCK_OPEN_TIMESTAMP;

  log?.(`Considering LGNO: ${withLGNO ? "yes" : "no"}`);

  let [balancesMainnet, balancesGC, prevAmountVested, amountVested] =
    await Promise.all([
      queryBalancesMainnet(entry.mainnet.blockNumber, withLGNO),
      queryBalancesGC(entry.gnosis.blockNumber, withLGNO),
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
  balancesGC = snapshotWithout(balancesGC, ignore.gnosis);

  return {
    balancesMainnet,
    balancesGC,
    amountVested,
  };
}
