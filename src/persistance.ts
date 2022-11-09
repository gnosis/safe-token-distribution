import fs from "fs";
import path from "path";

export type Blocks = {
  [key: string]: {
    mainnet: { blockNumber: number; timestamp: number; iso: string };
    gc: { blockNumber: number; timestamp: number; iso: string };
  };
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

function scheduleFilePath() {
  return path.resolve(path.join(__dirname, "..", "harvest", "schedule.json"));
}

function blocksFilePath() {
  return path.resolve(path.join(__dirname, "..", "harvest", "blocks.json"));
}
