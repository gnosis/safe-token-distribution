import { BalanceMap } from "../types";

export default function snapshotMerge(
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

  const dest = { ...m1 };
  const src = m2;

  for (const key in src) {
    dest[key] = src[key].add(dest[key] || 0);
  }
  return dest;
}
