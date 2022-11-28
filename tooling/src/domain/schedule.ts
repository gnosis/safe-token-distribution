import assert from "assert";

import { Provider } from "@ethersproject/providers";
import { Interval } from "../intervals";
import { Schedule, ScheduleEntry } from "../persistence";

export async function assignRandomBlocks(
  intervals: Interval[],
  provider: Provider,
  floor?: number,
  ceiling?: number,
): Promise<ScheduleEntry[]> {
  if (intervals.length === 0) {
    return [];
  }

  floor = floor || 0;
  ceiling = ceiling || (await provider.getBlockNumber());

  const block = await provider.getBlock(randomBlockNumber(floor, ceiling));
  const index = intervals.findIndex(
    (entry) => entry.left <= block.timestamp && block.timestamp < entry.right,
  );

  if (index === -1) {
    // narrow down and try again
    const left = intervals[0].left;
    const right = intervals[intervals.length - 1].right;
    return assignRandomBlocks(
      intervals,
      provider,
      block.timestamp < left ? block.number : floor,
      block.timestamp > right ? block.number : ceiling,
    );
  }

  // divide and conquer
  return [
    ...(await assignRandomBlocks(
      intervals.slice(0, index),
      provider,
      floor,
      block.number,
    )),
    { blockNumber: block.number, timestamp: block.timestamp },
    ...(await assignRandomBlocks(
      intervals.slice(index + 1),
      provider,
      block.number,
      ceiling,
    )),
  ];
}

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

function randomBlockNumber(floor: number, ceiling: number) {
  const result = floor + Math.floor(Math.random() * (ceiling - floor + 1));

  assert(result >= floor);
  assert(result <= ceiling);
  return result;
}
