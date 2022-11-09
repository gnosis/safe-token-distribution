import assert from "assert";
import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import moment from "moment";
import { VESTING_ID, VESTING_POOL_ADDRESS } from "../config";
import {
  loadBlockToVestedMap,
  loadDateToBlockMap,
  writeBlockToVestedMap,
} from "../persistence";
import { queryTotalVested } from "../queries/queryTotalVested";

task(
  "snapshot:totalvested",
  "Calculated the total vested for every vesting slice",
)
  .addOptionalParam(
    "lazy",
    "Don't recalculate if result is found on disk",
    true,
    types.boolean,
  )
  .addOptionalParam("vestingPool", "", VESTING_POOL_ADDRESS, types.string)
  .addOptionalParam("vestingId", "", VESTING_ID, types.string)
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    console.log("Starting snapshot:totalVested...");

    const dateToBlock = loadDateToBlockMap();
    const entries = Object.keys(dateToBlock);
    sanityCheck(entries);

    const blockToTotalVested = loadBlockToVestedMap();

    for (const iso of entries) {
      const blockNumber = dateToBlock[iso].mainnet.blockNumber;
      if (taskArgs.lazy === false || !blockToTotalVested[blockNumber]) {
        console.log(`querying totalVested at block ${blockNumber}...`);
        blockToTotalVested[blockNumber] = await queryTotalVested(
          hre,
          blockNumber,
          taskArgs.vestingPool,
          taskArgs.vestingId,
        );

        writeBlockToVestedMap(blockToTotalVested);
      }
    }
  });

function sanityCheck(schedule: string[]) {
  assert(
    schedule
      .map((entry) => moment(entry))
      .every(
        (entry, index, entries) =>
          index === 0 || entries[index - 1].isBefore(entry),
      ),
  );
}
