import { BigNumber } from "ethers";
import { BalanceMap } from "../types";
import { getAddress } from "ethers/lib/utils";

const Zero = BigNumber.from(0);

export function sum(bag: BalanceMap): BigNumber {
  return Object.keys(bag).reduce(
    (result, address) => result.add(bag[address]),
    BigNumber.from(0),
  );
}

export function merge(b1: BalanceMap, b2: BalanceMap): BalanceMap {
  const keys = Array.from(
    new Set([...Object.keys(b1), ...Object.keys(b2)]),
  ).sort();

  return Object.fromEntries(
    keys.map((key) => [key, (b1[key] || Zero).add(b2[key] || Zero)]),
  );
}

export function without(bag: BalanceMap, toRemove: string[]): BalanceMap {
  toRemove = toRemove.map((address) => getAddress(address));

  const addresses = Object.keys(bag)
    .filter((address) => !toRemove.includes(getAddress(address)))
    .sort();

  return Object.fromEntries(addresses.map((a) => [a, bag[a]]));
}
