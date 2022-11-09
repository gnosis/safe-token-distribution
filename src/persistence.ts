import { BigNumber } from "ethers";
import fs from "fs-extra";
import path from "path";

export type Blocks = {
  [key: string]: {
    mainnet: { blockNumber: number; timestamp: number; iso: string };
    gc: { blockNumber: number; timestamp: number; iso: string };
  };
};

export type Balances = {
  [key: number]: BigNumber;
};

export function loadSchedule(filePath?: string): string[] {
  return JSON.parse(
    fs.readFileSync(filePath || scheduleFilePath(), "utf8"),
  ) as string[];
}

export function writeSchedule(timestamps: any, filePath?: string) {
  fs.writeFileSync(
    filePath || scheduleFilePath(),
    JSON.stringify(timestamps, null, 2),
    "utf8",
  );
}

export function loadBlocks(filePath?: string): Blocks {
  const file = filePath || blocksFilePath();

  return fs.existsSync(file)
    ? (JSON.parse(fs.readFileSync(file, "utf8")) as Blocks)
    : {};
}

export function writeBlocks(data: Blocks, filePath?: string) {
  fs.writeFileSync(
    filePath || blocksFilePath(),
    JSON.stringify(data, null, 2),
    "utf8",
  );
}

export function loadBalancesMainnet(block: number): Balances | null {
  return loadBalances(block, "balances.mainnet.json");
}

export function loadBalancesGC(block: number): Balances | null {
  return loadBalances(block, "balances.gc.json");
}

function loadBalances(block: number, name: string): Balances | null {
  const filePath = balancesFilePath(block, name);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function writeBalancesMainnet(block: number, balances: Balances) {
  writeBalances(block, "balances.gc.json", balances);
}

export function writeBalancesGC(block: number, balances: Balances) {
  writeBalances(block, "balances.mainnet.json", balances);
}

function writeBalances(block: number, name: string, balances: Balances) {
  const filePath = balancesFilePath(block, name);
  console.log(filePath);
  fs.writeFileSync(filePath, JSON.stringify(balances, null, 2), "utf8");
}

function scheduleFilePath() {
  return path.resolve(path.join(__dirname, "..", "data", "schedule.json"));
}

function blocksFilePath() {
  return path.resolve(
    path.join(__dirname, "..", "data", "scheduleToBlocks.json"),
  );
}

function balancesFilePath(block: number, name: string) {
  const dirName = path.resolve(
    path.join(__dirname, "..", "data", "snapshots", String(block)),
  );
  fs.ensureDirSync(dirName);
  return path.resolve(path.join(dirName, name));
}
