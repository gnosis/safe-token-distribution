import { Provider } from "@ethersproject/providers";
import { Schedule } from "../persistence";

import { Interval } from "../types";

export default async function (
  intervals: Interval[],
  schedule: Schedule,
  deep: boolean,
  providers: { mainnet: Provider; gc: Provider },
  log?: (l: string) => void,
) {
  for (let i = 0; i < schedule.length; i++) {
    const entry = schedule[i];
    const interval = intervals[i];

    const [timestampMainnet, timestampGC] = deep
      ? await Promise.all([
          providers.mainnet
            .getBlock(entry.mainnet.blockNumber)
            .then(({ timestamp }) => timestamp),
          providers.gc
            .getBlock(entry.gnosis.blockNumber)
            .then(({ timestamp }) => timestamp),
        ])
      : [entry.mainnet.timestamp, entry.gnosis.timestamp];

    if (
      !(interval.left <= timestampMainnet && timestampMainnet <= interval.right)
    ) {
      throw new Error(
        `Mainnet block ${entry.mainnet.blockNumber} in schedule at position ${i} does not match interval`,
      );
    }

    if (!(interval.left <= timestampGC && timestampGC <= interval.right)) {
      throw new Error(
        `GC block ${entry.gnosis.blockNumber} in schedule at position ${i} does not match interval`,
      );
    }

    log?.(`${i}: OK`);
  }
}
