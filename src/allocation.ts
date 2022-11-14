import assert from "assert";
import { BigNumber } from "ethers";

import { Snapshot, merge, sum } from "./snapshot";

export function calculate(
  balances: Snapshot,
  totalToAllocate: BigNumber,
): Snapshot {
  if (totalToAllocate.eq(0)) {
    return {};
  }

  const { allocations, remainder } = distribute(balances, totalToAllocate);
  const result = merge(allocations, calculate(balances, remainder));
  return result;
}

function distribute(balances: Snapshot, totalToAllocate: BigNumber) {
  const holderCount = Object.keys(balances).length;
  const isMicroPeanuts = totalToAllocate.lte(holderCount);

  return isMicroPeanuts
    ? distributeSettle(balances, totalToAllocate)
    : distributeByRatio(balances, totalToAllocate);
}

function distributeByRatio(balances: Snapshot, totalToAllocate: BigNumber) {
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

function distributeSettle(balances: Snapshot, dust: BigNumber) {
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

export function toAllocateBreakdown(
  balances: Snapshot,
  balancesGC: Snapshot,
  totalToAllocate: BigNumber,
) {
  const balanceSumMainnet = sum(balances);
  const balanceSumGC = sum(balancesGC);
  const balanceSum = balanceSumMainnet.add(balanceSumGC);

  const toAllocateMainnet = balanceSumMainnet
    .mul(totalToAllocate)
    .div(balanceSum);

  const toAllocateGC = totalToAllocate.sub(toAllocateMainnet);

  return { toAllocateMainnet, toAllocateGC };
}
