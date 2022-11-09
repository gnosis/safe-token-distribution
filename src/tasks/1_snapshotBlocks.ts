import fs from "fs";
import path from "path";

import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import moment from "moment";

import { queryClosestBlock } from "../queries/queryBlocks";

task("snapshotBlocks", "Finds the closest blocks for each timestamp")
  .addOptionalParam(
    "timestamps",
    "Input file with the list of snapshot timestamps",
    `${__dirname}/../../harvest/timestamps.json`,
    types.inputFile,
  )
  .setAction(async (_taskArgs, hre: HardhatRuntimeEnvironment) => {
    const slices = loadSlices();
    const schedule = loadSchedule();

    const mainnetProvider = new hre.ethers.providers.JsonRpcProvider(
      `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
    );
    //const mainnetProvider = hre.ethers.providers.getDefaultProvider(1);

    const gcProvider = new hre.ethers.providers.JsonRpcProvider(
      `https://rpc.gnosischain.com `,
    );

    for (const slice of slices) {
      if (!schedule[slice.iso]) {
        const mainnetBlock = await queryClosestBlock(
          slice.timestamp,
          mainnetProvider,
        );

        const gcBlock = await queryClosestBlock(slice.timestamp, gcProvider);

        schedule[slice.iso] = {
          mainnet: {
            blockNumber: mainnetBlock.number,
            timestamp: mainnetBlock.timestamp,
            iso: moment.unix(mainnetBlock.timestamp).toISOString(),
          },
          gc: {
            blockNumber: gcBlock.number,
            timestamp: gcBlock.timestamp,
            iso: moment.unix(gcBlock.timestamp).toISOString(),
          },
        };
        writeSchedule(schedule);
      }
    }
  });

type Slice = {
  timestamp: number;
  iso: string;
};

type Schedule = {
  [key: string]: {
    mainnet: { blockNumber: number; timestamp: number; iso: string };
    gc: { blockNumber: number; timestamp: number; iso: string };
  };
};

function loadSlices(): Slice[] {
  const rawTimestamps = JSON.parse(
    fs.readFileSync(
      path.resolve(
        path.join(__dirname, "..", "..", "harvest", "timestamps.json"),
      ),
      "utf8",
    ),
  ) as string[];

  const now = moment();
  return rawTimestamps
    .map((rawTimestamp) => moment(rawTimestamp))
    .filter((date) => date.isBefore(now))
    .map((date) => ({
      timestamp: date.unix(),
      iso: date.toISOString(),
    }));
}

function loadSchedule(): Schedule {
  const file = filePath();

  return fs.existsSync(file)
    ? (JSON.parse(fs.readFileSync(file, "utf8")) as Schedule)
    : {};
}

function writeSchedule(schedule: Schedule) {
  fs.writeFileSync(filePath(), JSON.stringify(schedule, null, 2), "utf8");
}

function filePath() {
  return path.resolve(
    path.join(__dirname, "..", "..", "harvest", "schedule.json"),
  );
}
