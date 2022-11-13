import { BigNumber } from "ethers";
import fs from "fs-extra";

export type Snapshot = {
  [key: string]: BigNumber;
};

export function sum(snapshot: Snapshot): BigNumber {
  return Object.keys(snapshot).reduce(
    (result, key) => result.add(snapshot[key]),
    BigNumber.from(0),
  );
}

export function merge(s1: Snapshot, s2: Snapshot): Snapshot {
  return Object.keys(s1).reduce(
    (result, key) => ({
      ...result,
      [key]: s1[key].add(s2[key] || 0),
    }),
    s2,
  );
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
  return Object.keys(map).reduce(
    (prev, key) => ({
      ...prev,
      [key]: BigNumber.from(map[key]),
    }),
    {},
  );
}

function valuesToString(map: Snapshot): StringMap {
  return Object.keys(map).reduce(
    (prev, key) => ({
      ...prev,
      [key]: map[key].toString(),
    }),
    {},
  );
}
