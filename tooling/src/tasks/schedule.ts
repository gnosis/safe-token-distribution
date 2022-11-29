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
  "For any past vesting interval not yet persisted, finds random blocks writes to schedule.json",
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
  .addOptionalParam(
    "frozen",
    "ensures every past entry is in disk",
    false,
    types.boolean,
  )
  .setAction(
    async (
      { inception, frequency, deep, frozen },
      hre: HardhatRuntimeEnvironment,
    ) => {
      const log = (text: string) => console.info(`schedule:validate ${text}`);
      log("Starting...");

      const providers = getProviders(hre);

      const intervals = generateIntervals(
        await providers.mainnet.getBlock(inception),
        frequency,
      ).filter(isPastInterval);

      const schedule = loadSchedule();
      log(
        `Validating ${schedule.length} entries ${
          deep ? "(with block metadata refetching)" : ""
        }`,
      );

      if (schedule.length > intervals.length) {
        throw new Error("More schedule entries than past vesting intervals");
      }

      if (deep) {
        await validateDeep(intervals, schedule, providers, log);
      } else {
        validateShallow(intervals, schedule);
      }

      if (frozen && schedule.length < intervals.length) {
        throw new Error(
          "Some past vesting intervals don't yet have a matching entry in schedule",
        );
      }
      console.log("schedule:validate Done");
    },
  );