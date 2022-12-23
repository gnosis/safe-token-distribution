import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import balancemapSum from "../fns/balancemapSum";

import { loadSchedule, loadAllocation } from "../persistence";
import { addresses, getProviders, VESTING_ID } from "../config";
import { BigNumber } from "ethers";
import { queryAmountVested } from "../queries/queryVestingPool";

task(
  "audit",
  "Verifies that the sum of all allocations snapshots adds up to the raw amount out of VestingPool",
).setAction(async (_, hre: HardhatRuntimeEnvironment) => {
  const log = (text: string) => console.info(`Task audit -> ${text}`);

  const providers = getProviders(hre);
  const schedule = loadSchedule();

  log("Starting");

  let result = BigNumber.from(0);
  for (const entry of schedule) {
    const allocationsMainnet = loadAllocation("mainnet", entry.mainnet);
    const allocationsGC = loadAllocation("gnosis", entry.gnosis);

    if (!allocationsMainnet || !allocationsGC) {
      throw new Error(
        `No allocations found for ${entry.mainnet}/${entry.gnosis}`,
      );
    }

    result = result
      .add(balancemapSum(allocationsMainnet))
      .add(balancemapSum(allocationsGC));
  }

  const lastEntry = schedule[schedule.length - 1];
  const amountVested = await queryAmountVested(
    addresses.mainnet.vestingPool,
    VESTING_ID,
    lastEntry.mainnet,
    providers.mainnet,
  );

  if (amountVested.eq(result)) {
    log("OK & Done");
  } else {
    throw new Error("Allocation sum doesn't add up to VestingPool numbers.");
  }
});
