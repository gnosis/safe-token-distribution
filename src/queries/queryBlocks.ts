import { Provider } from "@ethersproject/providers";

export async function queryClosestBlock(timestamp: number, provider: Provider) {
  let minBlockNumber = 0;
  let maxBlockNumber = await provider.getBlockNumber();
  let closestBlockNumber = Math.floor((maxBlockNumber + minBlockNumber) / 2);
  let closestBlock = await provider.getBlock(closestBlockNumber);

  console.log(`Query    T ${timestamp}`);

  while (minBlockNumber <= maxBlockNumber) {
    console.log(
      `Drilling T ${closestBlock.timestamp} N ${closestBlock.number}...`,
    );
    if (closestBlock.timestamp === timestamp) {
      break;
    } else if (closestBlock.timestamp > timestamp) {
      maxBlockNumber = closestBlockNumber - 1;
    } else {
      minBlockNumber = closestBlockNumber + 1;
    }

    closestBlockNumber = Math.floor((maxBlockNumber + minBlockNumber) / 2);
    closestBlock = await provider.getBlock(closestBlockNumber);
  }

  const previousBlockNumber = closestBlockNumber - 1;
  const previousBlock = await provider.getBlock(previousBlockNumber);
  const nextBlockNumber = closestBlockNumber + 1;
  const nextBlock = await provider.getBlock(nextBlockNumber);

  if (closestBlock.timestamp === timestamp) {
    console.log(`Bingo    T ${timestamp} N ${closestBlock.number}`);
  } else {
    console.log(`Query    T ${timestamp}`);
    console.log(
      `Settled  T ${closestBlock.timestamp} N ${closestBlock.number}`,
    );
    console.log(
      `Prev     T ${previousBlock.timestamp} N ${previousBlock.number}`,
    );
    console.log(`Next     T ${nextBlock.timestamp} N ${nextBlock.number}`);
  }

  return closestBlock;
}
