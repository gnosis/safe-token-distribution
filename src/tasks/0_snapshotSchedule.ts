import { task, types } from "hardhat/config";
import moment from "moment";

import { writeSchedule } from "../persistence";

import {
  DISTRIBUTION_INCEPTION_BLOCK,
  DISTRIBUTION_SNAPSHOT_FREQUENCY_IN_MINUTES,
} from "../config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

task(
  "snapshot:schedule",
  "Generates and persists the sequence of timestamps that will be used to take balance snapshots",
)
  .addOptionalParam(
    "inception",
    "distribution start date",
    DISTRIBUTION_INCEPTION_BLOCK,
    types.int,
  )
  .addOptionalParam(
    "frequency",
    "distribution snapshot frequency in minutes",
    DISTRIBUTION_SNAPSHOT_FREQUENCY_IN_MINUTES,
    types.int,
  )
  .setAction(
    async ({ inception, frequency }, hre: HardhatRuntimeEnvironment) => {
      const schedule = await generate(inception, frequency, hre);
      writeSchedule(schedule);
    },
  );

async function generate(
  inception: string,
  frequency: number,
  hre: HardhatRuntimeEnvironment,
) {
  const provider = new hre.ethers.providers.JsonRpcProvider(
    `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
  );

  const result: string[] = [];

  const block = await provider.getBlock(inception);

  const start = moment
    .unix(block.timestamp)
    .set("minute", 0)
    .set("second", 0)
    .add(1, "hour");
  const end = moment(start).add(4, "year");

  const sweep = moment(start);
  while (sweep.isSameOrBefore(end)) {
    result.push(sweep.toISOString());
    sweep.add(frequency, "minutes");
  }

  return result;
}
