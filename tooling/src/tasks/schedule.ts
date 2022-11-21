import assert from "assert";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { task, types } from "hardhat/config";

import { loadSchedule, saveSchedule } from "../persistence";

import {
  validateShallow,
  validateDeep,
  assignRandomBlocks,
  expandEntry,
} from "../domain/schedule";

import {
  generate as generateIntervals,
  isPast as isPastInterval,
} from "../intervals";

import {
  VESTING_CREATION_BLOCK,
  SNAPSHOT_FREQUENCY_IN_MINUTES,
} from "../config";

task(
  "schedule:expand",
  "Appends to the schedule.json file - generates block numbers and timestamps for all past and not yet generated intervals",
)
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
      const log = (text: string) => console.info(`schedule:expand ${text}`);

      log("Starting...");
      const providers = getProviders(hre);

      const intervals = generateIntervals(
        await providers.mainnet.getBlock(inception),
        frequency,
      ).filter(isPastInterval);

      const prevSchedule = loadSchedule();
      validateShallow(intervals, prevSchedule);

      assert(prevSchedule.length <= intervals.length);

      if (prevSchedule.length == intervals.length) {
        log("Already up to date");
        return;
      }

      log(`Inserting ${intervals.length - prevSchedule.length} new entries`);

      const nextMainnetEntries = await assignRandomBlocks(
        intervals.slice(prevSchedule.length),
        providers.mainnet,
      );

      let nextSchedule = [...prevSchedule];
      for (const mainnetEntry of nextMainnetEntries) {
        log(
          `Finding GC's equivalent for mainnet block ${mainnetEntry.blockNumber}`,
        );
        const entry = await expandEntry(mainnetEntry, providers);
        nextSchedule = [...nextSchedule, entry];
        validateShallow(intervals, nextSchedule);
        saveSchedule(nextSchedule);
      }

      log("Done");
    },
  );

task(
  "schedule:validate",
  "Validates the schedule written to disk, and ensures it matches interval guidelines",
)
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
  .addOptionalParam(
    "deep",
    "refetch block info, and do exhaustive checks",
    false,
    types.boolean,
  )
  .setAction(
    async ({ inception, frequency, deep }, hre: HardhatRuntimeEnvironment) => {
      const log = (text: string) => console.info(`schedule:validate ${text}`);
      log("Starting...");

      const providers = getProviders(hre);

      const intervals = generateIntervals(
        await providers.mainnet.getBlock(inception),
        frequency,
      ).filter(isPastInterval);

      const prevSchedule = loadSchedule();
      log(
        `Validating ${prevSchedule.length} entries ${
          deep ? "(with block metadata refetching)" : ""
        }`,
      );

      if (deep) {
        await validateDeep(intervals, prevSchedule, providers, log);
      } else {
        validateShallow(intervals, prevSchedule);
      }
      console.log("schedule:validate Done");
    },
  );

function getProviders(hre: HardhatRuntimeEnvironment) {
  const mainnet = new hre.ethers.providers.JsonRpcProvider(
    `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
  );

  const gc = new hre.ethers.providers.JsonRpcProvider(
    `https://rpc.gnosischain.com `,
  );

  return { mainnet, gc };
}
