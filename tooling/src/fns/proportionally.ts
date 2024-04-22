import assert from "assert";
import { BigNumber } from "ethers";

import balancemapMerge from "./balancemapMerge";
import balancemapSum from "./balancemapSum";

import { BalanceMap } from "../types";

export default function proportionally(
  weights: BalanceMap,
  amountToDivide: BigNumber,
): BalanceMap {
  if (amountToDivide.lte(Object.keys(weights).length)) {
    return divideDust(weights, amountToDivide);
  }

  const { result, rest } = divideWeighted(weights, amountToDivide);

  return balancemapMerge(result, proportionally(weights, rest));
}

function divideWeighted(weights: BalanceMap, amountToDivide: BigNumber) {
  const allWeight = balancemapSum(weights);
  const result = Object.keys(weights)
    .map((address) => ({
      address,
      amount: weights[address].mul(amountToDivide).div(allWeight),
    }))
    .reduce(
      (prev, { address, amount }) => ({ ...prev, [address]: amount }),
      {},
    );

  const total = balancemapSum(result);
  assert(total.gt(0), "Unexpected Standstill");

  return {
    result,
    rest: amountToDivide.sub(total),
  };
}

function divideDust(balances: BalanceMap, dust: BigNumber): BalanceMap {
  if (dust.eq(0)) {
    return {};
  }

  const holderCount = Object.keys(balances).length;
  assert(dust.toNumber() <= holderCount);

  return Object.keys(balances)
    .map((address) => address)
    .sort((a, b) => (a < b ? -1 : 1))
    .slice(0, dust.toNumber())
    .reduce(
      (result, address) => ({ ...result, [address]: BigNumber.from(1) }),
      {},
    );
}
