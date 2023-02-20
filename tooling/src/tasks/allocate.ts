import assert from "assert";
import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { BigNumber } from "ethers";
import { parseUnits } from "ethers/lib/utils";

import { queryAllocationSetup } from "../queries/queryAllocationSetup";
import calculateAllocation from "../fns/calculateAllocation";
import calculateAllocationBreakdown from "../fns/calculateAllocationBreakdown";
import sort from "../fns/balancemapSort";
import sum from "../fns/balancemapSum";

import { loadSchedule, loadAllocation, saveAllocation } from "../persistence";
import {
  addresses,
  getProviders,
  GNO_LOCK_OPEN_TIMESTAMP,
  VESTING_ID,
  VESTING_CREATION_BLOCK_NUMBER,
} from "../config";
import { BalanceMap, Schedule, VestingSlice } from "../types";

task(
  "allocate",
  "Calculates and persists one allocation file per VestingSlice entry in the schedule",
)
  .addOptionalParam(
    "lazy",
    "Don't recalculate an allocation entry if already in disk",
    true,
    types.boolean,
  )
  .addOptionalPositionalParam(
    "blockNumber",
    "Calculate for one VestingSlice, the one closest to block number",
    undefined,
    types.int,
  )
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const log = (text: string) => console.info(`Task allocate -> ${text}`);

    const providers = getProviders(hre);
    const schedule = loadSchedule();

    log("Starting");

    const slices = slicesInScope(schedule, taskArgs.blockNumber);

    for (const slice of slices) {
      const allocationsMainnet = taskArgs.lazy
        ? loadAllocation("mainnet", slice.mainnet)
        : null;
      const allocationsGC = taskArgs.lazy
        ? loadAllocation("gnosis", slice.gnosis)
        : null;

      if (allocationsMainnet && allocationsGC) continue;
      const blockMainnet = slice.mainnet;
      const blockGnosis = slice.gnosis;

      log(`mainnet block#${blockMainnet} gnosis block#${blockGnosis}`);
      const { balancesMainnet, balancesGC, amountVested } =
        await queryAllocationSetup(
          slice,
          addresses,
          VESTING_ID,
          GNO_LOCK_OPEN_TIMESTAMP,
          providers,
          log,
        );

      stats(balancesMainnet, balancesGC, amountVested, log);

      const { allocatedToMainnet, allocatedToGnosis } =
        calculateAllocationBreakdown(balancesMainnet, balancesGC, amountVested);

      const allocationMainnet = calculateAllocation(
        balancesMainnet,
        allocatedToMainnet,
      );
      assert(sum(allocationMainnet).eq(allocatedToMainnet));

      const allocationGnosis = calculateAllocation(
        balancesGC,
        allocatedToGnosis,
      );
      assert(sum(allocationGnosis).eq(allocatedToGnosis));

      saveAllocation("mainnet", blockMainnet, sort(allocationMainnet));
      saveAllocation("gnosis", blockGnosis, sort(allocationGnosis));
    }

    log("Done");
  });

function stats(
  balancesMainnet: BalanceMap,
  balancesGC: BalanceMap,
  amountVested: BigNumber,
  log: (t: string) => void,
) {
  const totalGNOMainnet = sum(balancesMainnet)
    .div(parseUnits("1", 18))
    .toNumber();
  const totalGNOGnosis = sum(balancesGC).div(parseUnits("1", 18)).toNumber();
  const totalGNO = totalGNOMainnet + totalGNOGnosis;
  const totalVested = amountVested.div(parseUnits("1", 18)).toNumber();

  log(
    `Eligible: ${totalGNO} GNO (mainnet ${totalGNOMainnet} GNO gnosis ${totalGNOGnosis} GNO)`,
  );

  log(`Distributed: ${totalVested} SAFE`);
}

function slicesInScope(
  schedule: Schedule,
  blockNumber: number | undefined,
): VestingSlice[] {
  if (!blockNumber) {
    return schedule;
  }

  if (blockNumber < VESTING_CREATION_BLOCK_NUMBER) {
    throw new Error(
      `Distribution hadn't started at block ${blockNumber} - too early`,
    );
  }

  const entry = schedule.find((entry) => blockNumber <= entry.mainnet);
  if (!entry) {
    throw new Error(
      `Distribution not yet scheduled for block ${blockNumber} - too late`,
    );
  }
  return [entry];
}
