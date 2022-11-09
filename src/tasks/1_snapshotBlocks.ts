import moment from "moment";
import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { queryClosestBlock } from "../queries/queryBlocks";
import {
  loadBlocks,
  loadSchedule,
  scheduleFilePath,
  writeBlocks,
} from "../persistence";

task(
  "snapshot:blocks",
  "Finds the closest block (Mainnet and GC) for each timestamp",
)
  .addOptionalParam(
    "schedule",
    "Input file with the timestamp schedule",
    scheduleFilePath(),
    types.inputFile,
  )
  .addOptionalParam(
    "lazy",
    "Don't recalculate if result is found on disk",
    true,
    types.boolean,
  )
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    console.log("Starting snapshot:blocks...");
    const schedule = createSchedule(taskArgs.schedule);
    const blocks = loadBlocks();

    const mainnetProvider = new hre.ethers.providers.JsonRpcProvider(
      `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
    );

    const gcProvider = new hre.ethers.providers.JsonRpcProvider(
      `https://rpc.gnosischain.com `,
    );

    for (const entry of schedule) {
      if (taskArgs.lazy === false || !blocks[entry.iso]) {
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
