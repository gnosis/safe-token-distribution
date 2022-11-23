import {
  Snapshot,
  write as writeSnapshot,
  load as loadSnapshot,
} from "./snapshot";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { BigNumber } from "ethers";
import fs from "fs-extra";
import path from "path";

export type Schedule = { blockNumber: number; timestamp: number };
export type BridgedSchedule = { mainnet: Schedule; gc: Schedule };

export function loadSchedule(filePath?: string): BridgedSchedule[] {
  return JSON.parse(fs.readFileSync(filePath || scheduleFilePath(), "utf8"));
}

export function saveSchedule(schedule: BridgedSchedule[], filePath?: string) {
  fs.writeFileSync(
    filePath || scheduleFilePath(),
    JSON.stringify(schedule, null, 2),
    "utf8",
  );
}

function scheduleFilePath() {
  return path.resolve(
    path.join(__dirname, "..", "harvesting", "schedule.json"),
  );
}

export function loadAllocation(
  chain: "mainnet" | "gc",
  block: number,
): Snapshot | null {
  const filePath = allocationFilePath(chain, block);
  return loadSnapshot(filePath);
}

export function saveAllocation(
  chain: "mainnet" | "gc",
  block: number,
  allocation: Snapshot,
) {
  const filePath = allocationFilePath(chain, block);
  fs.ensureDirSync(path.dirname(filePath));
  writeSnapshot(filePath, allocation);
}

export function allocationFilePath(chain: "mainnet" | "gc", block: number) {
  return path.resolve(
    path.join(
      __dirname,
      "..",
      "harvesting",
      "allocations",
      `${chain}.${block}.json`,
    ),
  );
}

export function saveCheckpoint(
  checkpoint: Snapshot,
  tree: StandardMerkleTree<(string | BigNumber)[]>,
) {
  const dirPath = checkpointDirPath();
  fs.ensureDirSync(dirPath);

  const checkpointPath = path.join(dirPath, `${tree.root}.json`);
  const treePath = path.join(dirPath, `${tree.root}.tree.json`);

  fs.writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2), "utf8");
  fs.writeFileSync(treePath, JSON.stringify(tree.dump(), null, 2), "utf8");
}

function checkpointDirPath() {
  return path.resolve(path.join(__dirname, "..", "harvesting", "checkpoints"));
}
