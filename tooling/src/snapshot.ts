import fs from "fs";
import { BigNumber } from "ethers";

export type Snapshot = {
  [key: string]: BigNumber;
};

export function sum(snapshot: Snapshot): BigNumber {
  return Object.keys(snapshot).reduce(
    (result, address) => result.add(snapshot[address]),
    BigNumber.from(0),
  );
}

export function without(snapshot: Snapshot, toRemove: string[]): Snapshot {
  const addresses = Object.keys(snapshot).filter(
    (address) => !toRemove.includes(address),
  );

  const nextSnapshot: Snapshot = {};
  for (const address of addresses) {
    nextSnapshot[address] = snapshot[address];
  }
  return nextSnapshot;
}

export function merge(s1: Snapshot, s2: Snapshot): Snapshot {
  // !!this is MUCH slower!!
  // return Object.keys(s1).reduce(
  //   (result, key) => ({
  //     ...result,
  //     [key]: s1[key].add(s2[key] || 0),
  //   }),
  //   s2,
  // );

  //this is faster
  const [dest, src] =
    Object.keys(s1).length > Object.keys(s2).length
      ? [{ ...s1 }, s2]
      : [{ ...s2 }, s1];

  for (const key in src) {
    dest[key] = src[key].add(dest[key] || 0);
  }
  return dest;
}

export function load(filePath: string): Snapshot | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return valuesToBigNumber(JSON.parse(fs.readFileSync(filePath, "utf8")));
}

export function write(filePath: string, map: Snapshot) {
  fs.writeFileSync(
    filePath,
    JSON.stringify(valuesToString(map), null, 2),
    "utf8",
  );
}

type StringMap = {
  [key: string]: string;
};

function valuesToBigNumber(map: StringMap): Snapshot {
  // !!this is (catastrophically) MUCH slower!!
  // return Object.keys(map).reduce(
  //   (prev, key) => ({
  //     ...prev,
  //     [key]: BigNumber.from(map[key]),
  //   }),
  //   {},
  // );
  // this is faster
  const result: Snapshot = {};
  for (const key in map) {
    result[key] = BigNumber.from(map[key]);
  }
  return result;
}

function valuesToString(map: Snapshot): StringMap {
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
  for (const key in map) {
    result[key] = map[key].toString();
  }
  return result;
}
