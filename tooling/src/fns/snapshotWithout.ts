import { getAddress } from "ethers/lib/utils";
import { BalanceMap } from "../types";

export default function snapshotWithout(
  snapshot: BalanceMap,
  toRemove: string[],
): BalanceMap {
  toRemove = toRemove.map((address) => getAddress(address));

  const addresses = Object.keys(snapshot).filter(
    (address) => !toRemove.includes(getAddress(address)),
  );

  const nextSnapshot: BalanceMap = {};
  for (const address of addresses) {
    nextSnapshot[address] = snapshot[address];
  }
  return nextSnapshot;
}
