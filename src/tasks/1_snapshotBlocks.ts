import fs from "fs";
import path from "path";

import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import moment from "moment";

import { queryClosestBlock } from "../queries/queryBlocks";

task("snapshot:blocks", "Finds the closest blocks for each timestamp")
  .addOptionalParam(
    "timestamps",
    "Input file with the list of snapshot timestamps",
    `${__dirname}/../../harvest/timestamps.json`,
    types.inputFile,
  )
  .setAction(async (_taskArgs, hre: HardhatRuntimeEnvironment) => {
    const schedule = loadSchedule();
    const blocks = loadBlocks();

    const mainnetProvider = new hre.ethers.providers.JsonRpcProvider(
      `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
    );
    //const mainnetProvider = hre.ethers.providers.getDefaultProvider(1);

    const gcProvider = new hre.ethers.providers.JsonRpcProvider(
      `https://rpc.gnosischain.com `,
    );

    for (const entry of schedule) {
      if (!blocks[entry.iso]) {
        const mainnetBlock = await queryClosestBlock(
          entry.timestamp,
          mainnetProvider,
        );

        const gcBlock = await queryClosestBlock(entry.timestamp, gcProvider);

        blocks[entry.iso] = {
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
        writeBlocks(blocks);
      } else {
        console.log(
          `Already determined blocks for ${entry.iso} -> ${
            blocks[entry.iso].mainnet.blockNumber
          }`,
        );
      }
    }
  });

type Slice = {
  timestamp: number;
  iso: string;
};

export type Blocks = {
  [key: string]: {
    mainnet: { blockNumber: number; timestamp: number; iso: string };
    gc: { blockNumber: number; timestamp: number; iso: string };
  };
};

function loadSchedule(): Slice[] {
  const rawTimestamps = JSON.parse(
    fs.readFileSync(
      path.resolve(
        path.join(__dirname, "..", "..", "harvest", "schedule.json"),
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

function loadBlocks(): Blocks {
  const file = filePath();

  return fs.existsSync(file)
    ? (JSON.parse(fs.readFileSync(file, "utf8")) as Blocks)
    : {};
}

function writeBlocks(data: Blocks) {
  fs.writeFileSync(filePath(), JSON.stringify(data, null, 2), "utf8");
}

function filePath() {
  return path.resolve(
    path.join(__dirname, "..", "..", "harvest", "blocks.json"),
  );
}
