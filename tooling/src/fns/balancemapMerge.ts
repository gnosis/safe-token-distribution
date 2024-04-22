import { BigNumber } from "ethers";
import { BalanceMap } from "../types";

const Zero = BigNumber.from(0);

export default function balancemapMerge(
  m1: BalanceMap,
  m2: BalanceMap,
): BalanceMap {
  // !!this is MUCH slower!!
  // return Object.keys(s1).reduce(
  //   (result, key) => ({
  //     ...result,
  //     [key]: s1[key].add(s2[key] || 0),
  //   }),
  //   s2,
  // );

  const keys = Array.from(
    new Set([...Object.keys(m1), ...Object.keys(m2)]),
  ).sort();

  return Object.fromEntries(
    keys.map((key) => [key, (m1[key] || Zero).add(m2[key] || Zero)]),
  );
}
