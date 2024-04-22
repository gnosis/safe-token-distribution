import { BigNumber } from "ethers";
import fs from "fs-extra";
import path from "path";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

import { BalanceMap } from "./types";

export function loadAllocation(
  chain: "mainnet" | "gnosis",
  name: string,
): BalanceMap | null {
  const filePath = allocationFilePath(chain, name);
  return loadSnapshot(filePath);
}

export function saveAllocation(
  chain: "mainnet" | "gnosis",
  name: string,
  allocation: BalanceMap,
) {
  const filePath = allocationFilePath(chain, name);
  fs.ensureDirSync(path.dirname(filePath));
  writeSnapshot(filePath, allocation);
}

export const ALLOCATIONS_DIR = path.resolve(
  path.join(__dirname, "..", "_harvest", "allocations"),
);

export function allocationFilePath(chain: "mainnet" | "gnosis", name: string) {
  return path.resolve(
    path.join(
      __dirname,
      "..",
      "_harvest",
      "allocations",
      `${chain}.${name}.json`,
    ),
  );
}

export function saveCheckpoint(
  checkpoint: BalanceMap,
  tree: StandardMerkleTree<(string | BigNumber)[]>,
) {
  const dirPath = checkpointDirPath();
  fs.ensureDirSync(dirPath);

  const checkpointPath = path.join(dirPath, `${tree.root}.json`);
  const treePath = path.join(dirPath, `${tree.root}.tree.json`);

  writeSnapshot(checkpointPath, checkpoint);
  fs.writeFileSync(treePath, JSON.stringify(tree.dump(), null, 2), "utf8");
}

export function checkpointExists(id: string) {
  const dirPath = checkpointDirPath();
  fs.ensureDirSync(dirPath);

  const checkpointPath = path.join(dirPath, `${id}.json`);
  const treePath = path.join(dirPath, `${id}.tree.json`);

  return fs.existsSync(checkpointPath) && fs.existsSync(treePath);
}

export function checkpointCount() {
  const dirPath = checkpointDirPath();
  fs.ensureDirSync(dirPath);
  return fs.readdirSync(dirPath).length;
}

function checkpointDirPath() {
  return path.resolve(path.join(__dirname, "..", "_harvest", "checkpoints"));
}

export function loadSnapshot(filePath: string): BalanceMap | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return valuesToBigNumber(JSON.parse(fs.readFileSync(filePath, "utf8")));
}

function writeSnapshot(filePath: string, map: BalanceMap) {
  fs.writeFileSync(
    filePath,
    JSON.stringify(valuesToString(map), null, 2),
    "utf8",
  );
}

type StringMap = {
  [key: string]: string;
};

function valuesToBigNumber(map: StringMap): BalanceMap {
  // !!this is (catastrophically) MUCH slower!!
  // return Object.keys(map).reduce(
  //   (prev, key) => ({
  //     ...prev,
  //     [key]: BigNumber.from(map[key]),
  //   }),
  //   {},
  // );
  // this is faster
  const result: BalanceMap = {};
  for (const key of Object.keys(map).sort()) {
    result[key] = BigNumber.from(map[key]);
  }
  return result;
}

function valuesToString(map: BalanceMap): StringMap {
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
  for (const key of Object.keys(map).sort()) {
    result[key] = map[key].toString();
  }
  return result;
}
