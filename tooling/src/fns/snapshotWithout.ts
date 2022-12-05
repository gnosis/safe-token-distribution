import { getAddress } from "ethers/lib/utils";
import { Snapshot } from "../types";

export default function snapshotWithout(
  snapshot: Snapshot,
  toRemove: string[],
): Snapshot {
  toRemove = toRemove.map((address) => getAddress(address));

  const addresses = Object.keys(snapshot).filter(
    (address) => !toRemove.includes(getAddress(address)),
  );

  const nextSnapshot: Snapshot = {};
  for (const address of addresses) {
    nextSnapshot[address] = snapshot[address];
  }
  return nextSnapshot;
}
