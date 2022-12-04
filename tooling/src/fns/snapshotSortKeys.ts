import { Snapshot } from "../types";

export default function snapshotSortKeys(s: Snapshot): Snapshot {
  const keys = Object.keys(s).sort();

  const result: Snapshot = {};
  for (const key in keys) {
    result[key] = s[key];
  }

  return result;
}
