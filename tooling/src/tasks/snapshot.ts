import { VESTING_ID, VESTING_POOL_ADDRESS } from "../config";
import { calculate } from "../domain/allocation";
import {
  BridgedSchedule,
  loadSchedule,
  loadAllocation,
  saveAllocation,
} from "../persistence";
import {
  queryBalancesGC,
  queryBalancesMainnet,
} from "../queries/queryBalances";
import queryVestedInInterval from "../queries/queryVestedInInterval";
import { sum } from "../snapshot";
import { Provider } from "@ethersproject/providers";
import assert from "assert";
import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

task("snapshot:write-all-missing", "")
  .addOptionalParam(
    "lazy",
    "Don't recalculate if result is found on disk",
    true,
    types.boolean,
  )
  .setAction(async ({ lazy }, hre: HardhatRuntimeEnvironment) => {
    await hre.run("schedule:validate");

    const log = (text: string) => console.info(`snapshot:write ${text}`);

    const schedule = loadSchedule();
    const providers = getProviders(hre);

    log("Starting");

    for (const entry of schedule) {
      let allocationsMainnet = loadAllocation(
        "mainnet",
        entry.mainnet.blockNumber,
      );
      let allocationsGC = loadAllocation("gc", entry.gc.blockNumber);

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

        saveAllocation(
          "mainnet",
          entry.mainnet.blockNumber,
          allocationsMainnet,
        );
        saveAllocation("gc", entry.gc.blockNumber, allocationsGC);
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

function getProviders(hre: HardhatRuntimeEnvironment) {
  const mainnet = new hre.ethers.providers.JsonRpcProvider(
    `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
  );

  const gc = new hre.ethers.providers.JsonRpcProvider(
    `https://rpc.gnosischain.com `,
  );

  return { mainnet, gc };
}
