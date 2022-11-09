import fs from "fs";
import path from "path";

import { task, types } from "hardhat/config";
import moment from "moment";

import {
  DISTRIBUTION_INCEPTION_DATE,
  DISTRIBUTION_SUNSET_DATE,
  DISTRIBUTION_SNAPSHOT_DURATION_IN_MINUTES,
} from "../config";

task(
  "snapshotTimestamps",
  "Generates and persists the timestamps that will be used to take balance snapshots",
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
    write(generate(start, end, frequency));
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

function write(timestamps: any) {
  const file = path.resolve(
    path.join(__dirname, "..", "..", "harvest", "timestamps.json"),
  );
  fs.writeFileSync(file, JSON.stringify(timestamps, null, 2), "utf8");
}
