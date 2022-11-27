import { createMerkleTree } from "../domain/checkpoint";

import { loadAllocation, loadSchedule, saveCheckpoint } from "../persistence";
import { Snapshot, merge } from "../snapshot";
import { task } from "hardhat/config";

task("checkpoint:generate", "").setAction(async () => {
  const log = (text: string) => console.info(`checkpoint:generate ${text}`);

  const schedule = loadSchedule();

  log("Starting");

  let checkpointMainnet: Snapshot = {};
  let checkpointGC: Snapshot = {};

  for (const entry of schedule) {
    const allocationMainnet = loadAllocation(
      "mainnet",
      entry.mainnet.blockNumber,
    );
    const allocationGC = loadAllocation("gc", entry.gc.blockNumber);

    if (!allocationMainnet) {
      throw new Error(
        `Mainnet Allocation Not Calculated ${entry.mainnet.blockNumber}`,
      );
    }

    if (!allocationGC) {
      throw new Error(`GC Allocation Not Calculated ${entry.gc.blockNumber}`);
    }

    checkpointMainnet = merge(checkpointMainnet, allocationMainnet);
    checkpointGC = merge(checkpointGC, allocationGC);
  }

  const treeMainnet = createMerkleTree(checkpointMainnet);
  const treeGC = createMerkleTree(checkpointGC);

  saveCheckpoint(checkpointMainnet, treeMainnet);
  saveCheckpoint(checkpointGC, treeGC);

  return [treeMainnet.root, treeGC.root];
});

// async function ensureScheduleIsFresh(
//   inception: number,
//   frequency: number,
//   schedule: any[],
//   provider: Provider,
// ) {
//   const intervals = generateIntervals(
//     await provider.getBlock(inception),
//     frequency,
//   ).filter(isPastInterval);

//   validateShallow(intervals, schedule);
//   if (intervals.length !== schedule.length) {
//     throw new Error(
//       "The schedule found in Disk is valid, but should be expanded further",
//     );
//   }
// }
