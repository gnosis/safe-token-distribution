import assert from "assert";
import { BigNumber } from "ethers";

import { Snapshot, merge, sum } from "../snapshot";

export function allocate(
  balances: Snapshot,
  amountToAllocate: BigNumber,
): Snapshot {
  if (amountToAllocate.eq(0)) {
    return {};
  }

  const { allocations, remainder } = calculate(balances, amountToAllocate);

  return merge(allocations, allocate(balances, remainder));
}

function calculate(balances: Snapshot, amountToAllocate: BigNumber) {
  const holderCount = Object.keys(balances).length;
  const isMicroPeanuts = amountToAllocate.lte(holderCount);

  return !isMicroPeanuts
    ? calculateWeighted(balances, amountToAllocate)
    : calculatePeanuts(balances, amountToAllocate);
}

function calculateWeighted(balances: Snapshot, amountToAllocate: BigNumber) {
  const totalBalances = sum(balances);
  const allocations = Object.keys(balances)
    .map((address) => ({
      address,
      amount: balances[address].mul(amountToAllocate).div(totalBalances),
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
    remainder: amountToAllocate.sub(totalAllocated),
  };
}

function calculatePeanuts(balances: Snapshot, dust: BigNumber) {
  const holderCount = Object.keys(balances).length;

  assert(dust.toNumber() <= holderCount);

  const allocations = Object.keys(balances)
    .map((address) => ({ address, amount: balances[address] }))
    .sort((a, b) => (a.amount.gt(b.amount) ? -1 : 1))
    .slice(0, dust.toNumber())
    .reduce(
      (result, { address }) => ({ ...result, [address]: BigNumber.from(1) }),
      {},
    );

  return { allocations, remainder: BigNumber.from(0) };
}
