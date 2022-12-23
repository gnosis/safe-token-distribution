import { BalanceMap } from "../types";

export default function balancemapSort(map: BalanceMap): BalanceMap {
  const keys = Object.keys(map).sort();

  const result: BalanceMap = {};
  for (const key of keys) {
    result[key] = map[key];
  }

  return result;
}
