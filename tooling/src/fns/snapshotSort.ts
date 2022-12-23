import { BalanceMap } from "../types";

export default function snapshotSort(s: BalanceMap): BalanceMap {
  const keys = Object.keys(s).sort();

  const result: BalanceMap = {};
  for (const key of keys) {
    result[key] = s[key];
  }

  return result;
}
