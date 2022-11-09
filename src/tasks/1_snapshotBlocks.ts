import fs from "fs";
import moment from "moment";
import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { queryClosestBlock } from "../queries/queryBlocks";
import { loadBlocks, loadSchedule, writeBlocks } from "../persistance";

task(
  "snapshot:blocks",
  "Finds the closest block (Mainnet and GC) for each timestamp",
)
  .addOptionalParam(
    "schedule",
    "Input file with the timestamp schedule",
    `${__dirname}/../../harvest/schedule.json`,
    types.inputFile,
  )
  .setAction(async (_taskArgs, hre: HardhatRuntimeEnvironment) => {
    const schedule = createSchedule(_taskArgs.schedule);
    const blocks = loadBlocks();

    const mainnetProvider = new hre.ethers.providers.JsonRpcProvider(
      `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
    );

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

type ScheduleEntry = {
  timestamp: number;
  iso: string;
};

function createSchedule(filePath: string): ScheduleEntry[] {
  const rawTimestamps = loadSchedule(filePath);

  const now = moment();
  return rawTimestamps
    .map((rawTimestamp) => moment(rawTimestamp))
    .filter((date) => date.isBefore(now))
    .map((date) => ({
      timestamp: date.unix(),
      iso: date.toISOString(),
    }));
}
