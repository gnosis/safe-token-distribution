import assert from "assert";
import { task, types } from "hardhat/config";
import moment from "moment";
import {
  loadBalancesGC,
  loadBalancesMainnet,
  loadDateToBlockMap,
  writeBalancesGC,
  writeBalancesMainnet,
} from "../persistence";
import {
  queryBalancesGC,
  queryBalancesMainnet,
} from "../queries/queryBalances";

task(
  "harvest:balances",
  "For every blockHeight in schedule fetches a balance snapshot (mainnet and gc)",
)
  .addOptionalParam(
    "lazy",
    "Don't recalculate if result is found on disk",
    true,
    types.boolean,
  )
  .setAction(async (taskArgs) => {
    console.log("Starting harvest:balances...");

    const dateToBlock = loadDateToBlockMap();
    const entries = Object.keys(dateToBlock);

    sanityCheck(entries);

    for (const iso of entries) {
      const blockNumber = dateToBlock[iso].mainnet.blockNumber;
      let balancesMainnet = loadBalancesMainnet(blockNumber);
      if (taskArgs.lazy === false || balancesMainnet === null) {
        console.log(`querying mainnet balances for ${blockNumber}...`);
        balancesMainnet = await queryBalancesMainnet(blockNumber);
        writeBalancesMainnet(blockNumber, balancesMainnet);
      }

      /*
       * note: we load the balances using the GC blockNumber
       * but we persist it under the mainnet file path
       * both are to be loaded at the same, and the reference is the mainnet block
       */
      const blockNumberGC = dateToBlock[iso].gc.blockNumber;
      // load using mainnet block
      let balancesGC = loadBalancesGC(blockNumber);
      if (taskArgs.lazy === false || balancesGC === null) {
        console.log(`querying gc balances for ${blockNumberGC}...`);
        // query using gc
        balancesGC = await queryBalancesGC(blockNumberGC);
        // load using mainnet block
        writeBalancesGC(blockNumber, balancesGC);
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
