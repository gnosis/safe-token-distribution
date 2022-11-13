import assert from "assert";
import { BigNumber } from "ethers";
import { task, types } from "hardhat/config";
import { merge, Snapshot, sum } from "../snapshot";

import {
  loadBalancesGC,
  loadBalancesMainnet,
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
  .setAction(async () => {
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
        const result = allocate(balancesMainnet, totalToAllocate);
        assert(totalToAllocate.eq(sum(result)), "Mistmatch in allocation math");
        writeAllocationsMainnet(blockNumber, result);
      }

      const blockNumberGC = dateToBlock[iso].gc.blockNumber;
      const balancesGC = loadBalancesGC(blockNumber);
      if (balancesGC && totalToAllocate) {
        console.log(`calculating gc allocations for ${blockNumberGC}...`);
        const result = allocate(balancesGC, totalToAllocate);
        assert(totalToAllocate.eq(sum(result)), "Mistmatch in allocation math");
        writeAllocationsGC(blockNumber, result);
      }
    }
  });

function allocate(balances: Snapshot, totalToAllocate: BigNumber): Snapshot {
  if (totalToAllocate.eq(0)) {
    return {};
  }

  const { allocations, remainder } = calculate(balances, totalToAllocate);

  return merge(allocations, allocate(balances, remainder));
}

function calculate(balances: Snapshot, totalToAllocate: BigNumber) {
  const holderCount = Object.keys(balances).length;
  const isDusty = totalToAllocate.lte(holderCount);

  return isDusty
    ? calculateSpread(balances, totalToAllocate)
    : calculateRatio(balances, totalToAllocate);
}

function calculateRatio(balances: Snapshot, totalToAllocate: BigNumber) {
  const totalBalances = sum(balances);
  const allocations = Object.keys(balances)
    .map((address) => ({
      address,
      amount: balances[address].mul(totalToAllocate).div(totalBalances),
    }))
    .filter(({ amount }) => amount.gt(0))
    .reduce(
      (prev, { address, amount }) => ({ ...prev, [address]: amount }),
      {},
    );

  const totalAllocated = sum(allocations);

  assert(totalAllocated.gt(0), "Unexpected Standstill");

  return {
    allocations,
    remainder: totalToAllocate.sub(totalAllocated),
  };
}

function calculateSpread(balances: Snapshot, totalToAllocate: BigNumber) {
  const holderCount = Object.keys(balances).length;
  const dust = totalToAllocate.toNumber();
  assert(dust <= holderCount);

  const allocations = Object.keys(balances)
    .map((address) => ({ address, amount: balances[address] }))
    .sort((a, b) => (a.amount.gt(b.amount) ? -1 : 1))
    .slice(0, dust)
    .reduce(
      (result, { address }) => ({ ...result, [address]: BigNumber.from(1) }),
      {},
    );

  return { allocations, remainder: BigNumber.from(0) };
}
