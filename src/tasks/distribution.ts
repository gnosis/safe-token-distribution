import path from "path";
import assert from "assert";
import { Provider } from "@ethersproject/providers";
import { task, types } from "hardhat/config";

import {
  generate as generateIntervals,
  isPast as isPastInterval,
} from "../intervals";

import {
  Snapshot,
  sum,
  write as writeSnapshot,
  load as loadSnapshot,
  merge,
} from "../snapshot";

import { load as loadSchedule } from "../schedule";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import {
  SNAPSHOT_FREQUENCY_IN_MINUTES,
  VESTING_CREATION_BLOCK,
} from "../config";
import { calculate } from "../allocation";
import { loadAllocationGC, loadAllocationMainnet } from "../persistence";

task("distribution:calculate", "")
  .addOptionalParam(
    "inception",
    "vesting start block",
    VESTING_CREATION_BLOCK,
    types.int,
  )
  .addOptionalParam(
    "frequency",
    "distribution snapshot frequency in minutes",
    SNAPSHOT_FREQUENCY_IN_MINUTES,
    types.int,
  )
  .setAction(
    async ({ inception, frequency }, hre: HardhatRuntimeEnvironment) => {
      const log = (text: string) =>
        console.info(`distribution:calculate ${text}`);

      const providers = getProviders(hre);
      const schedule = loadSchedule();

      log("Starting");
      await ensureScheduleIsFresh(
        inception,
        frequency,
        schedule,
        providers.mainnet,
      );

      let mainnetAllocations: Snapshot[] = [];
      let gcAllocations: Snapshot[] = [];

      for (const entry of schedule) {
        const allocationMainnet = loadAllocationMainnet(
          entry.mainnet.blockNumber,
        );
        const allocationGC = loadAllocationGC(entry.gc.blockNumber);

        if (!allocationMainnet || !allocationGC) {
          throw new Error(
            `Allocation Not Calculated ${entry.mainnet.blockNumber}`,
          );
        }
        mainnetAllocations = [...mainnetAllocations, allocationMainnet];
        gcAllocations = [...gcAllocations, allocationMainnet];
      }

      const mainnetTotals = mainnetAllocations.reduce(
        (prev, next) => merge(prev, next),
        {},
      );

      const gcTotals = gcAllocations.reduce(
        (prev, next) => merge(prev, next),
        {},
      );
    },
  );

async function ensureScheduleIsFresh(
  inception: number,
  frequency: number,
  schedule: any[],
  provider: Provider,
) {
  const intervals = generateIntervals(
    await provider.getBlock(inception),
    frequency,
  ).filter(isPastInterval);

  if (intervals.length !== schedule.length) {
    throw new Error("Schedule is stale");
  }
}

function loadMainnet(block: number): Snapshot | null {
  return loadSnapshot(filePath(`mainnet.${block}.json`));
}

function loadGC(block: number): Snapshot | null {
  return loadSnapshot(filePath(`gc.${block}.json`));
}

function saveMainnet(block: number, allocations: Snapshot) {
  writeSnapshot(filePath(`mainnet.${block}.json`), allocations);
}

function saveGC(block: number, allocations: Snapshot) {
  writeSnapshot(filePath(`gc.${block}.json`), allocations);
}

function filePath(end: string) {
  return path.resolve(
    path.join(__dirname, "..", "..", "snapshots", "allocations", `${end}`),
  );
}

function getProviders(hre: HardhatRuntimeEnvironment) {
  const mainnet = new hre.ethers.providers.JsonRpcProvider(
    `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
  );

  const gc = new hre.ethers.providers.JsonRpcProvider(
    `https://rpc.gnosischain.com `,
  );

  return { mainnet, gc };
}
