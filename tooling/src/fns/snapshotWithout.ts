import { Snapshot } from "../types";

export default function snapshotWithout(
  snapshot: Snapshot,
  toRemove: string[],
): Snapshot {
  const addresses = Object.keys(snapshot).filter(
    (address) => !toRemove.includes(address),
  );

  const nextSnapshot: Snapshot = {};
  for (const address of addresses) {
    nextSnapshot[address] = snapshot[address];
  }
  return nextSnapshot;
}
