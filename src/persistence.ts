import { BigNumber } from "ethers";
import fs from "fs-extra";
import path from "path";

export type Schedule = { blockNumber: number; timestamp: number };

export type Balances = {
  [key: string]: BigNumber;
};

export type TotalsVested = {
  [key: string]: BigNumber;
};

export type JSONMap = {
  [key: string]: string;
};

export function loadBalancesMainnet(block: number): Balances | null {
  return loadBalances(block, "balances.mainnet.json");
}

export function loadBalancesGC(block: number): Balances | null {
  return loadBalances(block, "balances.gc.json");
}

function loadBalances(block: number, name: string): Balances | null {
  const filePath = snapshotFilePath(block, name);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const map = JSON.parse(fs.readFileSync(filePath, "utf8")) as JSONMap;
  return mapValuesToBigNumber(map);
}

export function writeAllocationsMainnet(block: number, allocations: Balances) {
  writeBalances(block, "allocations.mainnet.json", allocations);
}

export function writeAllocationsGC(block: number, allocations: Balances) {
  writeBalances(block, "allocations.gc.json", allocations);
}

function writeBalances(block: number, name: string, balances: Balances) {
  const filePath = snapshotFilePath(block, name);
  const map = mapValuesToString(balances);

  fs.writeFileSync(filePath, JSON.stringify(map, null, 2), "utf8");
}

function snapshotFilePath(block: number, name: string) {
  const dirName = path.resolve(
    path.join(__dirname, "..", "data", "snapshots", String(block)),
  );
  fs.ensureDirSync(dirName);
  return path.resolve(path.join(dirName, name));
}

function mapValuesToString(map: Balances): JSONMap {
  return Object.keys(map).reduce(
    (prev, next) => ({
      ...prev,
      [next]: map[next as unknown as number].toString(),
    }),
    {},
  );
}

function mapValuesToBigNumber(map: JSONMap): Balances {
  return Object.keys(map).reduce(
    (prev, key) => ({
      ...prev,
      [key]: BigNumber.from(map[key]),
    }),
    {},
  );
}
