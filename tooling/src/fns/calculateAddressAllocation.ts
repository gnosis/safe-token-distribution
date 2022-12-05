import assert from "assert";
import { BigNumber } from "ethers";

import snapshotMerge from "./snapshotMerge";
import snapshotSum from "./snapshotSum";

import { Snapshot } from "../types";

export default function calculate(
  balances: Snapshot,
  amountToAllocate: BigNumber,
): Snapshot {
  if (amountToAllocate.eq(0)) {
    return {};
  }

  const { allocation, remainder } = divide(balances, amountToAllocate);

  return snapshotMerge(allocation, calculate(balances, remainder));
}

function divide(balances: Snapshot, amountToAllocate: BigNumber) {
  const holderCount = Object.keys(balances).length;
  const isMicroPeanuts = amountToAllocate.lte(holderCount);
  return !isMicroPeanuts
    ? divideWeighted(balances, amountToAllocate)
    : dividePeanuts(balances, amountToAllocate);
}

function divideWeighted(balances: Snapshot, amountToAllocate: BigNumber) {
  const totalBalances = snapshotSum(balances);
  const allocation = Object.keys(balances)
    .map((address) => ({
      address,
      amount: balances[address].mul(amountToAllocate).div(totalBalances),
    }))
    .reduce(
      (prev, { address, amount }) => ({ ...prev, [address]: amount }),
      {},
    );

  const totalAllocated = snapshotSum(allocation);

  assert(totalAllocated.gt(0), "Unexpected Standstill");

  return {
    allocation,
    remainder: amountToAllocate.sub(totalAllocated),
  };
}

function dividePeanuts(balances: Snapshot, dust: BigNumber) {
  const holderCount = Object.keys(balances).length;

  assert(dust.toNumber() <= holderCount);

  const allocation = Object.keys(balances)
    .map((address) => ({ address, amount: balances[address] }))
    .sort((a, b) => (a.address < b.address ? -1 : 1))
    .slice(0, dust.toNumber())
    .reduce(
      (result, { address }) => ({ ...result, [address]: BigNumber.from(1) }),
      {},
    );

  return { allocation, remainder: BigNumber.from(0) };
}
