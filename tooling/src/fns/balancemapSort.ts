import { BalanceMap } from "../types";

export default function balancemapSort(map: BalanceMap): BalanceMap {
  const result: BalanceMap = {};
  for (const key of Object.keys(map).sort()) {
    result[key] = map[key];
  }

  return result;
}
