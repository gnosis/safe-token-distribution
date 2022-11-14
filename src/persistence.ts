import path from "path";
import {
  Snapshot,
  write as writeSnapshot,
  load as loadSnapshot,
} from "./snapshot";

export function loadAllocationMainnet(block: number): Snapshot | null {
  return loadSnapshot(allocationFilePath(`mainnet.${block}.json`));
}

export function loadAllocationGC(block: number): Snapshot | null {
  return loadSnapshot(allocationFilePath(`gc.${block}.json`));
}

export function saveAllocationMainnet(block: number, allocations: Snapshot) {
  writeSnapshot(allocationFilePath(`mainnet.${block}.json`), allocations);
}

export function saveAllocationGC(block: number, allocations: Snapshot) {
  writeSnapshot(allocationFilePath(`gc.${block}.json`), allocations);
}

export function allocationFilePath(end: string) {
  return path.resolve(
    path.join(__dirname, "..", "..", "snapshots", "allocations", `${end}`),
  );
}
