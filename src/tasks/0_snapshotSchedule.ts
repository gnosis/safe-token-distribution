import { task, types } from "hardhat/config";
import moment from "moment";

import { writeSchedule } from "../persistance";

import {
  DISTRIBUTION_INCEPTION_DATE,
  DISTRIBUTION_SUNSET_DATE,
  DISTRIBUTION_SNAPSHOT_DURATION_IN_MINUTES,
} from "../config";

task(
  "snapshot:schedule",
  "Generates and persists the sequence of timestamps that will be used to take balance snapshots",
)
  .addOptionalParam(
    "start",
    "distribution start date",
    DISTRIBUTION_INCEPTION_DATE,
    types.string,
  )
  .addOptionalParam(
    "end",
    "distribution sunsetting date",
    DISTRIBUTION_SUNSET_DATE,
    types.string,
  )
  .addOptionalParam(
    "frequency",
    "distribution snapshot frequency in minutes",
    DISTRIBUTION_SNAPSHOT_DURATION_IN_MINUTES,
    types.int,
  )
  .setAction(async ({ start, end, frequency }) => {
    writeSchedule(generate(start, end, frequency));
  });

function generate(start: string, end: string, frequency: number) {
  const result: string[] = [];

  let sweep = moment(start);
  const sunset = moment(end);
  while (sweep.isBefore(sunset)) {
    result.push(sweep.toISOString());
    sweep = sweep.add(frequency, "minutes");
  }
  return result;
}
