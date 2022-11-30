import { Provider } from "@ethersproject/providers";
import { Schedule } from "../persistence";

import { Interval } from "../types";

export function validateShallow(intervals: Interval[], schedule: Schedule) {
  for (let i = 0; i < schedule.length; i++) {
    const { mainnet, gc } = schedule[i];
    const interval = intervals[i];
    if (
      !(
        mainnet.timestamp >= interval.left &&
        mainnet.timestamp <= interval.right
      )
    ) {
      console.log(mainnet.timestamp, interval);
      throw new Error(
        `Mainnet block ${mainnet.blockNumber} in schedule at position ${i} does not match interval`,
      );
    }

    if (!(gc.timestamp >= interval.left && gc.timestamp <= interval.right)) {
      throw new Error(
        `GC block ${gc.blockNumber} in schedule at position ${i} does not match interval`,
      );
    }
  }
}

export async function validateDeep(
  intervals: Interval[],
  schedule: Schedule,
  providers: { mainnet: Provider; gc: Provider },
  log?: (l: string) => void,
) {
  for (let i = 0; i < schedule.length; i++) {
    const { mainnet, gc } = schedule[i];
    const interval = intervals[i];

    const [mainnetBlock, gcBlock] = await Promise.all([
      providers.mainnet.getBlock(mainnet.blockNumber),
      providers.gc.getBlock(gc.blockNumber),
    ]);

    if (
      !(
        mainnetBlock.timestamp >= interval.left &&
        mainnetBlock.timestamp <= interval.right
      )
    ) {
      throw new Error(
        `Mainnet block ${mainnet.blockNumber} in schedule at position ${i} does not match interval`,
      );
    }

    if (
      !(
        gcBlock.timestamp >= interval.left &&
        gcBlock.timestamp <= interval.right
      )
    ) {
      throw new Error(
        `GC block ${gc.blockNumber} in schedule at position ${i} does not match interval`,
      );
    }

    log?.(`${i}: OK`);
  }
}
