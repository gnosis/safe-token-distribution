import assert from "assert";
import { readdirSync } from "fs";
import path from "path";

import { task } from "hardhat/config";

import createMerkleTree from "../fns/createMerkleTree";
import merge from "../fns/balancemapMerge";

import { ALLOCATIONS_DIR, loadSnapshot, saveCheckpoint } from "../persistence";

import { BalanceMap } from "../types";

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
      checkpointMainnet = merge(checkpointMainnet, allocation);
    }

    if (fileName.startsWith("mainnet")) {
      log(`Factoring in ${fileName}`);
      const allocation = loadSnapshot(filePath);
      assert(allocation);
      checkpointGnosis = merge(checkpointGnosis, allocation);
    }
  }

  const treeMainnet = createMerkleTree(checkpointMainnet);
  const treeGnosis = createMerkleTree(checkpointGnosis);

  log(`Saved checkpoint ${treeMainnet.root} (Mainnet)`);
  saveCheckpoint(checkpointMainnet, treeMainnet);
  log(`Saved checkpoint ${treeGnosis.root} (Gnosis)`);
  saveCheckpoint(checkpointGnosis, treeGnosis);

  log("Done");

  return {
    merkleRootMainnet: treeMainnet.root,
    merkleRootGnosis: treeGnosis.root,
  };
});
