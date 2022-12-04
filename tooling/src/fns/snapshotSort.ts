import { Snapshot } from "../types";

export default function snapshotSort(s: Snapshot): Snapshot {
  const keys = Object.keys(s).sort();

  const result: Snapshot = {};
  for (const key of keys) {
    result[key] = s[key];
  }

  return result;
}
