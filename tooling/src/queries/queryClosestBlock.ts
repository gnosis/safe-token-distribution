import { Provider } from "@ethersproject/providers";
import assert from "assert";

export default async function queryClosestBlock(
  timestamp: number,
  provider: Provider,
  leftBlockNumber?: number,
  rightBlockNumber?: number,
) {
  leftBlockNumber = leftBlockNumber || 0;
  rightBlockNumber = rightBlockNumber || (await provider.getBlockNumber());

  let block;
  while (leftBlockNumber <= rightBlockNumber) {
    block = await provider.getBlock(
      Math.floor((leftBlockNumber + rightBlockNumber) / 2),
    );

    if (block.timestamp === timestamp) {
      break;
    }

    if (block.timestamp < timestamp) {
      leftBlockNumber = block.number + 1;
    } else if (block.timestamp > timestamp) {
      rightBlockNumber = block.number - 1;
    }
  }

  assert(block);
  if (block.timestamp > timestamp) {
    block = await provider.getBlock(block.number - 1);
  }

  const nextBlock = await provider.getBlock(block.number + 1);
  assert(
    timestamp >= block.timestamp && timestamp < nextBlock.timestamp,
    "Closest Block Query: Fatal",
  );

  return block;
}
