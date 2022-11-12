import assert from "assert";
import { BigNumber } from "ethers";
import { task, types } from "hardhat/config";

import {
  Balances,
  loadBalancesGC,
  loadBalancesMainnet,
  loadBlockToVestedMap,
  loadDateToBlockMap,
  writeAllocationsGC,
  writeAllocationsMainnet,
} from "../persistence";

task("harvest:allocation", "")
  .addOptionalParam(
    "lazy",
    "Don't recalculate if result is found on disk",
    true,
    types.boolean,
  )
  .setAction(async (taskArgs) => {
    console.log("Starting harvest:allocation...");

    const dateToBlock = loadDateToBlockMap();
    const totalVestedMap = loadBlockToVestedMap();
    const entries = Object.keys(dateToBlock);

    for (const iso of entries) {
      const blockNumber = dateToBlock[iso].mainnet.blockNumber;
      const totalToAllocate = totalVestedMap[blockNumber];
      const balancesMainnet = loadBalancesMainnet(blockNumber);
      if (balancesMainnet && totalToAllocate) {
        console.log(`calculating mainnet allocations for ${blockNumber}...`);
        const result = distribute(balancesMainnet, totalToAllocate);
        console.log(totalToAllocate.toString());
        console.log(sum(result).toString());
        writeAllocationsMainnet(blockNumber, result);
      }

      /*
       * note: we load the balances using the GC blockNumber
       * but we persist it under the mainnet file path
       * both are to be loaded at the same, and the reference is the mainnet block
       */
      const blockNumberGC = dateToBlock[iso].gc.blockNumber;
      // load using mainnet block
      const balancesGC = loadBalancesGC(blockNumber);
      if (balancesGC && totalToAllocate) {
        console.log(`calculating gc allocations for ${blockNumberGC}...`);
        const result = distribute(balancesGC, totalToAllocate);
        console.log(totalToAllocate.toString());
        console.log(sum(result).toString());
        writeAllocationsGC(blockNumber, result);
      }
    }
  });

function distribute(balances: Balances, totalToAllocate: BigNumber): Balances {
  const isDusty = totalToAllocate.lte(Object.keys(balances).length);

  if (isDusty) {
    return distributeDust(balances, totalToAllocate.toNumber());
  }

  const totalBalances = sum(balances);

  const allocations = Object.keys(balances)
    .map((address) => ({
      address,
      amount: balances[address].mul(totalToAllocate).div(totalBalances),
    }))
    .filter(({ amount }) => amount.gt(0))
    .reduce(
      (prev, { address, amount }) => ({
        ...prev,
        [address]: amount,
      }),
      {},
    );

  assert(
    Object.keys(allocations).length > 0,
    "Unexpected Distribution Standstill",
  );

  const remainder = totalToAllocate.sub(sum(allocations));
  return merge(allocations, distribute(balances, remainder));
}

function distributeDust(balances: Balances, dust: number) {
  assert(dust <= Object.keys(balances).length);

  return Object.keys(balances)
    .map((address) => ({
      address,
      amount: balances[address],
    }))
    .sort((a, b) => (a.amount.gt(b.amount) ? -1 : 1))
    .slice(0, dust)
    .reduce(
      (result, { address }) => ({ ...result, [address]: BigNumber.from("1") }),
      {},
    );
}

function sum(bag: Balances) {
  return Object.keys(bag).reduce(
    (prev, next) => prev.add(bag[next]),
    BigNumber.from("0"),
  );
}

function merge(b1: Balances, b2: Balances): Balances {
  return Object.keys(b2).reduce(
    (result, key) => ({
      ...result,
      [key]: (result[key] || BigNumber.from(0)).add(b2[key]),
    }),
    b1,
  );
}
