import { BigNumber } from "ethers";
import fs from "fs-extra";
import path from "path";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

import { Schedule, Snapshot } from "./types";

export function loadSchedule(filePath?: string): Schedule {
  return JSON.parse(fs.readFileSync(filePath || scheduleFilePath(), "utf8"));
}

export function saveSchedule(schedule: Schedule, filePath?: string) {
  fs.writeFileSync(
    filePath || scheduleFilePath(),
    JSON.stringify(schedule, null, 2),
    "utf8",
  );
}

function scheduleFilePath() {
  return path.resolve(path.join(__dirname, "..", "_harvest", "schedule.json"));
}

export function loadAllocation(
  chain: "mainnet" | "gnosis",
  block: number,
): Snapshot | null {
  const filePath = allocationFilePath(chain, block);
  return loadSnapshot(filePath);
}

export function saveAllocation(
  chain: "mainnet" | "gnosis",
  block: number,
  allocation: Snapshot,
) {
  const filePath = allocationFilePath(chain, block);
  fs.ensureDirSync(path.dirname(filePath));
  writeSnapshot(filePath, allocation);
}

export function allocationFilePath(chain: "mainnet" | "gnosis", block: number) {
  return path.resolve(
    path.join(
      __dirname,
      "..",
      "_harvest",
      "allocations",
      `${chain}.${block}.json`,
    ),
  );
}

export function saveCheckpoint(
  checkpoint: Snapshot,
  tree: StandardMerkleTree<(string | BigNumber)[]>,
  dirPath?: string,
) {
  dirPath = dirPath || checkpointDirPath();
  fs.ensureDirSync(dirPath);

  const checkpointPath = path.join(dirPath, `${tree.root}.json`);
  const treePath = path.join(dirPath, `${tree.root}.tree.json`);

  fs.writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2), "utf8");
  fs.writeFileSync(treePath, JSON.stringify(tree.dump(), null, 2), "utf8");
}

export function loadCheckpoint(treeRoot: string): Snapshot {
  const dirPath = checkpointDirPath();

  const filePath = path.join(dirPath, `${treeRoot}.json`);

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function checkpointDirPath() {
  return path.resolve(path.join(__dirname, "..", "_harvest", "checkpoints"));
}

function loadSnapshot(filePath: string): Snapshot | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return valuesToBigNumber(JSON.parse(fs.readFileSync(filePath, "utf8")));
}

function writeSnapshot(filePath: string, map: Snapshot) {
  fs.writeFileSync(
    filePath,
    JSON.stringify(valuesToString(map), null, 2),
    "utf8",
  );
}

type StringMap = {
  [key: string]: string;
};

function valuesToBigNumber(map: StringMap): Snapshot {
  // !!this is (catastrophically) MUCH slower!!
  // return Object.keys(map).reduce(
  //   (prev, key) => ({
  //     ...prev,
  //     [key]: BigNumber.from(map[key]),
  //   }),
  //   {},
  // );
  // this is faster
  const result: Snapshot = {};
  for (const key in map) {
    result[key] = BigNumber.from(map[key]);
  }
  return result;
}

function valuesToString(map: Snapshot): StringMap {
  // !!this is MUCH slower!!
  // return Object.keys(map).reduce(
  //   (prev, key) => ({
  //     ...prev,
  //     [key]: map[key].toString(),
  //   }),
  //   {},
  // );

  // this is faster
  const result: StringMap = {};
  for (const key in map) {
    result[key] = map[key].toString();
  }
  return result;
}
