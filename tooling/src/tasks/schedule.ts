import assert from "assert";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { task, types } from "hardhat/config";

import { loadSchedule, saveSchedule } from "../persistence";

import {
  validateShallow,
  validateDeep,
  assignRandomBlocks,
} from "../domain/schedule";

import {
  generate as generateIntervals,
  isPast as isPastInterval,
} from "../intervals";

import {
  VESTING_CREATION_BLOCK,
  SNAPSHOT_FREQUENCY_IN_MINUTES,
  getProviders,
} from "../config";
import queryClosestBlock from "../queries/queryClosestBlock";

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
      const providers = getProviders(hre);

      log("Starting...");

      const intervals = generateIntervals(
        await providers.mainnet.getBlock(inception),
        frequency,
      ).filter(isPastInterval);

      const prevSchedule = loadSchedule();
      assert(prevSchedule.length <= intervals.length);

      if (prevSchedule.length == intervals.length) {
        log("Already up to date");
        return prevSchedule;
      }

      log(`Inserting ${intervals.length - prevSchedule.length} new entries`);

      const nextMainnetEntries = await assignRandomBlocks(
        intervals.slice(prevSchedule.length),
        providers.mainnet,
      );

      let nextSchedule = [...prevSchedule];
      for (const mainnetEntry of nextMainnetEntries) {
        log(
          `Finding a block in GC that matches mainnet ${mainnetEntry.blockNumber}`,
        );

        const blockGC = await queryClosestBlock(
          mainnetEntry.timestamp,
          providers.gc,
        );
        nextSchedule = [
          ...nextSchedule,
          {
            mainnet: mainnetEntry,
            gc: { timestamp: blockGC.timestamp, blockNumber: blockGC.number },
          },
        ];
      }

      validateShallow(intervals, nextSchedule);
      saveSchedule(nextSchedule);

      log("Done");
      return nextSchedule;
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
