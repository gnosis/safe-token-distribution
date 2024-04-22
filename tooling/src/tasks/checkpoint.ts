import { task } from "hardhat/config";

import createMerkleTree from "../fns/createMerkleTree";
import balancemapMerge from "../fns/balancemapMerge";
import balancemapSort from "../fns/balancemapSort";

import { ALLOCATIONS_DIR, loadSnapshot, saveCheckpoint } from "../persistence";

import { BalanceMap } from "../types";
import { readdirSync } from "fs";
import path from "path";
import assert from "assert";

task(
  "checkpoint",
  "Reduces through past allocation files, consolidates it in a BalanceMap and persists it as a MerkleTree",
).setAction(async () => {
  const log = (text: string) => console.info(`Task checkpoint -> ${text}`);

  log("Starting");

  let checkpointMainnet: BalanceMap = {};
  let checkpointGnosis: BalanceMap = {};

  for (const fileName of readdirSync(ALLOCATIONS_DIR)) {
    const filePath = path.join(ALLOCATIONS_DIR, fileName);

    if (fileName.startsWith("gnosis")) {
      log(`Factoring in ${fileName}`);
      const allocation = loadSnapshot(filePath);
      assert(allocation);
      checkpointMainnet = balancemapMerge(checkpointMainnet, allocation);
    }

    if (fileName.startsWith("mainnet")) {
      log(`Factoring in ${fileName}`);
      const allocation = loadSnapshot(filePath);
      assert(allocation);
      checkpointGnosis = balancemapMerge(checkpointGnosis, allocation);
    }
  }

  const treeMainnet = createMerkleTree(checkpointMainnet);
  const treeGnosis = createMerkleTree(checkpointGnosis);

  log(`Saved checkpoint ${treeMainnet.root} (Mainnet)`);
  saveCheckpoint(balancemapSort(checkpointMainnet), treeMainnet);
  log(`Saved checkpoint ${treeGnosis.root} (Gnosis)`);
  saveCheckpoint(balancemapSort(checkpointGnosis), treeGnosis);

  log("Done");

  return {
    merkleRootMainnet: treeMainnet.root,
    merkleRootGnosis: treeGnosis.root,
  };
});
