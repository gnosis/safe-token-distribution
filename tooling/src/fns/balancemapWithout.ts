import { getAddress } from "ethers/lib/utils";
import { BalanceMap } from "../types";

export default function balancemapWithout(
  map: BalanceMap,
  toRemove: string[],
): BalanceMap {
  toRemove = toRemove.map((address) => getAddress(address));

  const addresses = Object.keys(map).filter(
    (address) => !toRemove.includes(getAddress(address)),
  );

  const nextMap: BalanceMap = {};
  for (const address of addresses) {
    nextMap[address] = map[address];
  }
  return nextMap;
}
