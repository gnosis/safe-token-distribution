import assert from "assert";
import { Block, Provider } from "@ethersproject/providers";

import { Interval } from "../types";

export default async function intervalsToBlocks(
  intervals: Interval[],
  provider: Provider,
  floor?: number,
  ceiling?: number,
): Promise<Block[]> {
  if (intervals.length === 0) {
    return [];
  }

  floor = floor || 0;
  ceiling = ceiling || (await provider.getBlockNumber());

  const block = await provider.getBlock(randomInteger(floor, ceiling));
  const index = intervals.findIndex(
    (entry) => entry.left <= block.timestamp && block.timestamp < entry.right,
  );

  if (index === -1) {
    // narrow down and try again
    const left = intervals[0].left;
    const right = intervals[intervals.length - 1].right;
    return intervalsToBlocks(
      intervals,
      provider,
      block.timestamp < left ? block.number : floor,
      block.timestamp > right ? block.number : ceiling,
    );
  }

  // divide and conquer
  return [
    ...(await intervalsToBlocks(
      intervals.slice(0, index),
      provider,
      floor,
      block.number,
    )),
    block,
    ...(await intervalsToBlocks(
      intervals.slice(index + 1),
      provider,
      block.number,
      ceiling,
    )),
  ];
}

function randomInteger(floor: number, ceiling: number) {
  const result = floor + Math.floor(Math.random() * (ceiling - floor + 1));

  assert(result >= floor);
  assert(result <= ceiling);
  return result;
}
