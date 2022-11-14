import path from "path";
import assert from "assert";
import { BigNumber } from "ethers";
import { task, types } from "hardhat/config";
import {
  Snapshot,
  merge,
  sum,
  write as writeSnapshot,
  load as loadSnapshot,
} from "../snapshot";

import { DualSchedule, load as loadSchedule } from "../schedule";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  queryBalancesGC,
  queryBalancesMainnet,
} from "../queries/queryBalances";
import { queryTotalVested } from "../queries/queryTotalVested";
import { Provider } from "@ethersproject/providers";
import { VESTING_ID, VESTING_POOL_ADDRESS } from "../config";

task("allocation:calculate", "")
  .addOptionalParam(
    "lazy",
    "Don't recalculate if result is found on disk",
    true,
    types.boolean,
  )
  .setAction(async ({ lazy }, hre: HardhatRuntimeEnvironment) => {
    await hre.run("schedule:validate");

    console.log("allocations:calculate Starting");
    const schedule = loadSchedule();
    const providers = getProviders(hre);

    for (let i = 0; i < schedule.length; i++) {
      const entry = schedule[i];
      const prevEntry = i === 0 ? null : schedule[i - 1];
      const blockNumber = entry.mainnet.blockNumber;
      const blockNumberGC = entry.gc.blockNumber;
      let allocations = loadAllocationsMainnet(blockNumber);
      let allocationsGC = loadAllocationsGC(blockNumber);

      if (lazy === false || allocations === null || allocationsGC === null) {
        console.log(`allocations:calculate Calculating for ${blockNumber} `);
        const {
          balances,
          balancesGC,
          totalToAllocate,
          toAllocateMainnet,
          toAllocateGC,
        } = await fetch(
          entry,
          prevEntry,
          VESTING_POOL_ADDRESS,
          VESTING_ID,
          providers.mainnet,
        );
        console.log(`calculating mainnet allocations for ${blockNumber}...`);
        allocations = allocate(balances, toAllocateMainnet);
        assert(
          toAllocateMainnet.eq(sum(allocations)),
          "Mistmatch in mainnet allocation math",
        );

        console.log(`calculating gc allocations for ${blockNumberGC}...`);
        allocationsGC = allocate(balancesGC, toAllocateGC);
        assert(
          toAllocateGC.eq(sum(allocationsGC)),
          "Mistmatch in GC allocation math",
        );

        assert(
          sum(allocations).add(sum(allocationsGC)).eq(totalToAllocate),
          "Mistmatch in total allocation math",
        );

        writeAllocationsMainnet(blockNumber, allocations);
        writeAllocationsGC(blockNumber, allocationsGC);
      }
    }
  });

async function fetch(
  entry: DualSchedule,
  prevEntry: DualSchedule | null,
  vestingContract: string,
  vestingId: string,
  provider: Provider,
) {
  const [balances, balancesGC, totalVested, prevTotalVested] =
    await Promise.all([
      queryBalancesMainnet(entry.mainnet.blockNumber),
      queryBalancesGC(entry.gc.blockNumber),
      queryTotalVested(
        vestingContract,
        vestingId,
        entry.mainnet.blockNumber,
        provider,
      ),
      prevEntry
        ? queryTotalVested(
            vestingContract,
            vestingId,
            prevEntry.mainnet.blockNumber,
            provider,
          )
        : 0,
    ]);

  assert(totalVested.gt(prevTotalVested));

  const totalToAllocate = totalVested.sub(prevTotalVested);

  return {
    balances,
    balancesGC,
    totalToAllocate,
    ...toAllocateBreakdown(balances, balancesGC, totalToAllocate),
  };
}

export function allocate(
  balances: Snapshot,
  totalToAllocate: BigNumber,
): Snapshot {
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

function toAllocateBreakdown(
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

function loadAllocationsMainnet(block: number): Snapshot | null {
  return loadSnapshot(filePath(`mainnet.${block}.json`));
}

function loadAllocationsGC(block: number): Snapshot | null {
  return loadSnapshot(filePath(`gc.${block}.json`));
}

function writeAllocationsMainnet(block: number, allocations: Snapshot) {
  writeSnapshot(filePath(`mainnet.${block}.json`), allocations);
}

function writeAllocationsGC(block: number, allocations: Snapshot) {
  writeSnapshot(filePath(`gc.${block}.json`), allocations);
}

function filePath(end: string) {
  return path.resolve(path.join(__dirname, "..", "..", "snapshots", `${end}`));
}

function getProviders(hre: HardhatRuntimeEnvironment) {
  const mainnet = new hre.ethers.providers.JsonRpcProvider(
    `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
  );

  const gc = new hre.ethers.providers.JsonRpcProvider(
    `https://rpc.gnosischain.com `,
  );

  return { mainnet, gc };
}
