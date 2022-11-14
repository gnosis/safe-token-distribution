import path from "path";
import fs from "fs-extra";
import { BigNumber } from "ethers";

import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

import {
  Snapshot,
  write as writeSnapshot,
  load as loadSnapshot,
} from "./snapshot";

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
  return path.resolve(path.join(__dirname, "..", "snapshots", "schedule.json"));
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
      "snapshots",
      "allocations",
      `${chain}.${block}.json`,
    ),
  );
}

export function saveDistribution(
  tree: StandardMerkleTree<(string | BigNumber)[]>,
) {
  const filePath = distributionFilePath(tree.root);
  fs.ensureDirSync(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(tree.dump(), null, 2), "utf8");
}

export function distributionExists(root: string): boolean {
  const filePath = distributionFilePath(root);
  return fs.existsSync(filePath);
}

function distributionFilePath(rootHash: string) {
  return path.resolve(
    path.join(
      __dirname,
      "..",
      "snapshots",
      "distributions",
      `${rootHash}.json`,
    ),
  );
}
