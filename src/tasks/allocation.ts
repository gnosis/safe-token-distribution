import path from "path";
import assert from "assert";
import { Provider } from "@ethersproject/providers";
import { task, types } from "hardhat/config";

import {
  Snapshot,
  sum,
  write as writeSnapshot,
  load as loadSnapshot,
} from "../snapshot";

import { BridgedSchedule, load as loadSchedule } from "../schedule";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  queryBalancesGC,
  queryBalancesMainnet,
} from "../queries/queryBalances";

import { VESTING_ID, VESTING_POOL_ADDRESS } from "../config";
import queryVestedInInterval from "../queries/queryVestedInInterval";
import { calculate } from "../allocation";

task("allocation:calculate", "")
  .addOptionalParam(
    "lazy",
    "Don't recalculate if result is found on disk",
    true,
    types.boolean,
  )
  .setAction(async ({ lazy }, hre: HardhatRuntimeEnvironment) => {
    await hre.run("schedule:validate");

    const log = (text: string) => console.info(`allocation:calculate ${text}`);

    const schedule = loadSchedule();
    const providers = getProviders(hre);

    log("Starting");

    for (const entry of schedule) {
      let allocationsMainnet = loadMainnet(entry.mainnet.blockNumber);
      let allocationsGC = loadGC(entry.gc.blockNumber);

      if (lazy === false || !allocationsMainnet || !allocationsGC) {
        log(`mainnet ${entry.mainnet.blockNumber} gc ${entry.gc.blockNumber}`);
        const { balances, toAllocate } = await fetchBalancesAndTotals(
          entry,
          VESTING_POOL_ADDRESS,
          VESTING_ID,
          providers.mainnet,
        );

        allocationsMainnet = calculate(balances.mainnet, toAllocate.mainnet);
        assert(sum(allocationsMainnet).eq(toAllocate.mainnet));

        allocationsGC = calculate(balances.gc, toAllocate.gc);
        assert(sum(allocationsGC).eq(toAllocate.gc));

        saveMainnet(entry.mainnet.blockNumber, allocationsMainnet);
        saveGC(entry.gc.blockNumber, allocationsGC);
      }
    }
  });

async function fetchBalancesAndTotals(
  entry: BridgedSchedule,
  vestingContract: string,
  vestingId: string,
  provider: Provider,
) {
  const [balancesMainnet, balancesGC, totalVestedInInterval] =
    await Promise.all([
      queryBalancesMainnet(entry.mainnet.blockNumber),
      queryBalancesGC(entry.gc.blockNumber),
      queryVestedInInterval(
        vestingContract,
        vestingId,
        entry.mainnet.blockNumber,
        provider,
      ),
    ]);

  const toAllocate = calculate(
    { mainnet: sum(balancesMainnet), gc: sum(balancesGC) },
    totalVestedInInterval,
  );

  assert(toAllocate.mainnet.add(toAllocate.gc).eq(totalVestedInInterval));

  return {
    balances: { mainnet: balancesMainnet, gc: balancesGC },
    toAllocate,
  };
}

function loadMainnet(block: number): Snapshot | null {
  return loadSnapshot(filePath(`mainnet.${block}.json`));
}

function loadGC(block: number): Snapshot | null {
  return loadSnapshot(filePath(`gc.${block}.json`));
}

function saveMainnet(block: number, allocations: Snapshot) {
  writeSnapshot(filePath(`mainnet.${block}.json`), allocations);
}

function saveGC(block: number, allocations: Snapshot) {
  writeSnapshot(filePath(`gc.${block}.json`), allocations);
}

function filePath(end: string) {
  return path.resolve(
    path.join(__dirname, "..", "..", "snapshots", "allocations", `${end}`),
  );
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
