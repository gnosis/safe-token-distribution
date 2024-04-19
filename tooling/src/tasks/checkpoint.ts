import { task, types } from "hardhat/config";

import createMerkleTree from "../fns/createMerkleTree";
import balancemapMerge from "../fns/balancemapMerge";
import balancemapSort from "../fns/balancemapSort";

import { loadAllocation, loadSchedule, saveCheckpoint } from "../persistence";

import { BalanceMap, Schedule } from "../types";

task(
  "checkpoint",
  "Reduces through past allocation files, consolidates it in a BalanceMap and persists it as a MerkleTree",
)
  .addOptionalParam(
    "persist",
    "Should the output files be persisted to the repo?",
    true,
    types.boolean,
  )
  .addOptionalParam(
    "blockNumber",
    "Block number to apply until",
    undefined,
    types.int,
  )
  .setAction(async ({ persist, blockNumber }) => {
    const log = (text: string) => console.info(`Task checkpoint -> ${text}`);

    log("Starting");

    const schedule = filterSchedule(loadSchedule(), blockNumber);
    log(
      `Calculating checkpoint until slice ${
        schedule[schedule.length - 1].mainnet
      }`,
    );

    let checkpointMainnet: BalanceMap = {};
    let checkpointGnosis: BalanceMap = {};

    for (const slice of schedule) {
      const allocationMainnet = loadAllocation("mainnet", slice.mainnet);
      const allocationGnosis = loadAllocation("gnosis", slice.gnosis);

      if (!allocationMainnet) {
        throw new Error(
          `Mainnet allocation not yet calculated ${slice.mainnet}`,
        );
      }

      if (!allocationGnosis) {
        throw new Error(`Gnosis allocation not yet calculated ${slice.gnosis}`);
      }

      checkpointMainnet = balancemapMerge(checkpointMainnet, allocationMainnet);
      checkpointGnosis = balancemapMerge(checkpointGnosis, allocationGnosis);
    }

    const treeMainnet = createMerkleTree(checkpointMainnet);
    const treeGnosis = createMerkleTree(checkpointGnosis);

    if (persist) {
      log(`Saved checkpoint ${treeMainnet.root} (Mainnet)`);
      saveCheckpoint(balancemapSort(checkpointMainnet), treeMainnet);
      log(`Saved checkpoint ${treeGnosis.root} (Gnosis)`);
      saveCheckpoint(balancemapSort(checkpointGnosis), treeGnosis);
    }

    log("Done");

    return {
      merkleRootMainnet: treeMainnet.root,
      merkleRootGnosis: treeGnosis.root,
    };
  });

function filterSchedule(schedule: Schedule, blockNumber: number | undefined) {
  if (blockNumber) {
    schedule = schedule.filter((slice) => slice.mainnet <= blockNumber);
    if (schedule.length === 0) {
      throw new Error(`No Schedule slices matching block ${blockNumber}`);
    }
  }
  return schedule;
}
