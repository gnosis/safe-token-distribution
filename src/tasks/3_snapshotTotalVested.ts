import assert from "assert";
import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import moment from "moment";
import { VESTING_ID, VESTING_POOL_ADDRESS } from "../config";
import {
  loadBlocks,
  loadTotalsVested,
  writeTotalsVested,
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
    const blocks = loadBlocks();
    const entries = Object.keys(blocks);
    sanityCheck(entries);

    const totalsVested = loadTotalsVested();

    for (const iso of entries) {
      const blockNumber = blocks[iso].mainnet.blockNumber;
      if (taskArgs.lazy === false || !totalsVested[blockNumber]) {
        console.log(`Querying totalVested at block ${blockNumber}`);
        totalsVested[blockNumber] = await queryTotalVested(
          hre,
          blockNumber,
          taskArgs.vestingPool,
          taskArgs.vestingId,
        );

        writeTotalsVested(totalsVested);
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
