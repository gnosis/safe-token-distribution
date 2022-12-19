import assert from "assert";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { task, types } from "hardhat/config";
import { getUnixTime } from "date-fns";

import { Interval } from "../types";

import queryClosestBlock from "../queries/queryClosestBlock";
import intervalsToBlocks from "../fns/intervalsToBlocks";
import intervalsGenerate from "../fns/intervalsGenerate";

import {
  getProviders,
  ALLOCATION_FREQUENCY_IN_MINUTES,
  VESTING_CREATION_TIMESTAMP,
} from "../config";

import { loadSchedule, saveSchedule } from "../persistence";

task(
  "schedule:expand",
  "For all past intervals not yet in schedule.json, finds a random block, inserts and persists",
).setAction(async (_, hre: HardhatRuntimeEnvironment) => {
  const log = (text: string) => console.info(`Task schedule:expand -> ${text}`);
  const providers = getProviders(hre);

  log("Starting...");

  const intervals = pastIntervals();
  const prevSchedule = loadSchedule();
  assert(prevSchedule.length <= intervals.length);

  if (prevSchedule.length == intervals.length) {
    log("Already up to date");
    return prevSchedule;
  }

  log(`Inserting ${intervals.length - prevSchedule.length} new entries`);

  const blocks = await intervalsToBlocks(
    intervals.slice(prevSchedule.length),
    providers.mainnet,
  );

  let nextSchedule = prevSchedule;
  for (const block of blocks) {
    log(`Finding a block in gnosis that matches mainnet ${block.number}`);

    const blockGC = await queryClosestBlock(block.timestamp, providers.gnosis);
    nextSchedule = [
      ...nextSchedule,
      {
        mainnet: block.number,
        gnosis: blockGC.number,
        prev: null,
        next: null,
      },
    ];
  }

  saveSchedule(nextSchedule);
  log("Done");

  return nextSchedule;
});

task(
  "schedule:validate",
  "Validates that every VestingSlice in schedule is correct",
)
  .addOptionalParam(
    "frozen",
    "validates that no schedule entry is missing",
    false,
    types.boolean,
  )
  .setAction(async ({ frozen }, hre: HardhatRuntimeEnvironment) => {
    const log = (text: string) =>
      console.info(`Task schedule:validate -> ${text}`);

    log("Starting...");

    const providers = getProviders(hre);
    const intervals = pastIntervals();
    const schedule = loadSchedule();
    log(`Validating ${schedule.length} slices`);

    if (schedule.length > intervals.length) {
      throw new Error("More vesting slices than past intervals");
    }

    for (let i = 0; i < schedule.length; i++) {
      const slice = schedule[i];
      const { left, right } = intervals[i];

      const [timestampMainnet, timestampGnosis] = await Promise.all([
        providers.mainnet
          .getBlock(slice.mainnet)
          .then(({ timestamp }) => timestamp),
        providers.gnosis
          .getBlock(slice.gnosis)
          .then(({ timestamp }) => timestamp),
      ]);

      if (!(left <= timestampMainnet && timestampMainnet <= right)) {
        throw new Error(
          `Mainnet block ${slice.mainnet} in schedule at position ${i} does not match interval`,
        );
      }

      if (!(left <= timestampGnosis && timestampGnosis <= right)) {
        throw new Error(
          `GC block ${slice.gnosis} in schedule at position ${i} does not match interval`,
        );
      }

      log(`${i}: OK`);
    }

    if (frozen && schedule.length !== intervals.length) {
      throw new Error(
        "One or more past vesting intervals don't yet have a matching slice in schedule.json",
      );
    }
    log("Ok & Done");
  });

function pastIntervals() {
  const isPast = (interval: Interval) =>
    interval.right < getUnixTime(new Date());

  return intervalsGenerate(
    VESTING_CREATION_TIMESTAMP,
    ALLOCATION_FREQUENCY_IN_MINUTES,
  ).filter(isPast);
}
