import assert from "assert";
import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { queryAllocationSetup } from "../queries/queryAllocationSetup";
import scheduleFind from "../fns/scheduleFind";
import snapshotSum from "../fns/snapshotSum";

import { loadSchedule, loadAllocation } from "../persistence";
import {
  addresses,
  getProviders,
  GNO_LOCK_OPEN_TIMESTAMP,
  VESTING_ID,
} from "../config";
import { BigNumber } from "ethers";
import { queryAmountVested } from "../queries/queryVestingPool";

task("audit", "").setAction(async (_, hre: HardhatRuntimeEnvironment) => {
  const log = (text: string) => console.info(`Task audit -> ${text}`);

  const providers = getProviders(hre);
  const schedule = loadSchedule();

  log("Starting");

  let result = BigNumber.from(0);
  for (const entry of schedule) {
    const allocationsMainnet = loadAllocation(
      "mainnet",
      entry.mainnet.blockNumber,
    );

    const allocationsGC = loadAllocation("gnosis", entry.gnosis.blockNumber);

    if (!allocationsMainnet || !allocationsGC) {
      throw new Error(
        `No allocations found for ${entry.mainnet.blockNumber}/${entry.gnosis.blockNumber}`,
      );
    }

    const { prevEntry } = scheduleFind(schedule, entry.mainnet.blockNumber);
    assert(
      prevEntry === null ||
        schedule.indexOf(prevEntry) + 1 == schedule.indexOf(entry),
    );

    result = result
      .add(snapshotSum(allocationsMainnet))
      .add(snapshotSum(allocationsGC));
  }

  const lastEntry = schedule[schedule.length - 1];

  const amountVested = await queryAmountVested(
    addresses.mainnet.vestingPool,
    VESTING_ID,
    lastEntry.mainnet.blockNumber,
    providers.mainnet,
  );

  if (amountVested.eq(result)) {
    log("OK & Done");
  } else {
    throw new Error("Allocation amounts don't add up to VestingPool numbers.");
  }
});
