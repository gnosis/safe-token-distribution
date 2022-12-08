import assert from "assert";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { task, types } from "hardhat/config";
import { getUnixTime } from "date-fns";

import { Interval } from "../types";

import queryClosestBlock from "../queries/queryClosestBlock";
import intervalsToBlocks from "../fns/intervalsToBlocks";
import intervalsGenerate from "../fns/intervalsGenerate";
import scheduleValidate from "../fns/scheduleValidate";

import {
  getProviders,
  ALLOCATION_FREQUENCY_IN_MINUTES,
  VESTING_CREATION_TIMESTAMP,
} from "../config";

import { loadSchedule, saveSchedule } from "../persistence";

task(
  "schedule:expand",
  "For any past vesting interval not yet persisted, finds random blocks writes to schedule.json",
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

  const nextMainnetEntries = await intervalsToBlocks(
    intervals.slice(prevSchedule.length),
    providers.mainnet,
  );

  let nextSchedule = prevSchedule;
  for (const mainnetEntry of nextMainnetEntries) {
    log(
      `Finding a block in GC that matches mainnet ${mainnetEntry.blockNumber}`,
    );

    const blockGC = await queryClosestBlock(
      mainnetEntry.timestamp,
      providers.gnosis,
    );
    nextSchedule = [
      ...nextSchedule,
      {
        mainnet: mainnetEntry,
        gnosis: {
          timestamp: blockGC.timestamp,
          blockNumber: blockGC.number,
        },
      },
    ];
  }

  saveSchedule(nextSchedule);
  log("Done");

  return nextSchedule;
});

task(
  "schedule:validate",
  "Validates the schedule written to disk, and ensures it matches interval guidelines",
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
  .setAction(async ({ deep, frozen }, hre: HardhatRuntimeEnvironment) => {
    const log = (text: string) =>
      console.info(`Task schedule:validate -> ${text}`);
    log("Starting...");

    const providers = getProviders(hre);
    const intervals = pastIntervals();
    const schedule = loadSchedule();
    log(
      `Validating ${schedule.length} entries ${
        deep ? "(with block metadata refetching)" : ""
      }`,
    );

    if (schedule.length > intervals.length) {
      throw new Error("More schedule entries than past vesting intervals");
    }

    await scheduleValidate(
      intervals,
      schedule,
      deep,
      providers,
      deep ? log : () => {},
    );

    if (frozen && schedule.length < intervals.length) {
      throw new Error(
        "One or more past vesting intervals don't yet have a matching entry in schedule.json",
      );
    }
    console.log("schedule:validate Ok & Done");
  });

function pastIntervals() {
  const isPast = (interval: Interval) =>
    interval.right < getUnixTime(new Date());

  return intervalsGenerate(
    VESTING_CREATION_TIMESTAMP,
    ALLOCATION_FREQUENCY_IN_MINUTES,
  ).filter(isPast);
}
