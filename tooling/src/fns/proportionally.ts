import assert from "assert";
import { BigNumber } from "ethers";

import balancemapMerge from "./balancemapMerge";
import balancemapSum from "./balancemapSum";

import { BalanceMap } from "../types";

export default function proportionally(
  weights: BalanceMap,
  amount: BigNumber,
): BalanceMap {
  if (amount.eq(0)) {
    return {};
  }

  const { allocation, remainder } = divide(weights, amount);

  return balancemapMerge(allocation, proportionally(weights, remainder));
}

function divide(balances: BalanceMap, amountToAllocate: BigNumber) {
  const holderCount = Object.keys(balances).length;
  const isMicroPeanuts = amountToAllocate.lte(holderCount);
  return !isMicroPeanuts
    ? divideWeighted(balances, amountToAllocate)
    : dividePeanuts(balances, amountToAllocate);
}

function divideWeighted(balances: BalanceMap, amountToAllocate: BigNumber) {
  const totalBalances = balancemapSum(balances);
  const allocation = Object.keys(balances)
    .map((address) => ({
      address,
      amount: balances[address].mul(amountToAllocate).div(totalBalances),
    }))
    .reduce(
      (prev, { address, amount }) => ({ ...prev, [address]: amount }),
      {},
    );

  const totalAllocated = balancemapSum(allocation);

  assert(totalAllocated.gt(0), "Unexpected Standstill");

  return {
    allocation,
    remainder: amountToAllocate.sub(totalAllocated),
  };
}

function dividePeanuts(balances: BalanceMap, dust: BigNumber) {
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
