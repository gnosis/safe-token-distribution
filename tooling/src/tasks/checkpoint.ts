import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { BigNumber } from "ethers";
import { task } from "hardhat/config";

import { loadAllocation, loadSchedule, saveCheckpoint } from "../persistence";
import { Snapshot, merge } from "../snapshot";

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

function createMerkleTree(
  snapshot: Snapshot,
): StandardMerkleTree<(string | BigNumber)[]> {
  const leaves = Object.keys(snapshot).map((address) => [
    address,
    snapshot[address],
  ]);

  return StandardMerkleTree.of(leaves, ["address", "uint256"]);
}
