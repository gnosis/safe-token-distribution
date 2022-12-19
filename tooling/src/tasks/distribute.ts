import assert from "assert";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { queryAmountToClaim } from "../queries/queryVestingPool";
import calculateFundingBreakdown from "../fns/calculateFundingBreakdown";

import {
  checkpointCount,
  checkpointExists,
  loadSchedule,
} from "../persistence";
import { Schedule } from "../types";
import { addresses, getProviders, VESTING_ID } from "../config";

task(
  "distribute:prepare",
  "Creates a new checkpoint, and persists it to the repo",
).setAction(async (_, hre: HardhatRuntimeEnvironment) => {
  const log = (text: string) => console.info(`Task distribute -> ${text}`);

  log("Starting...");
  const { isReady } = await hre.run("status", { silent: true });
  if (!isReady) {
    log("Setup not ready for Distribution. Skipping...");
    return;
  }

  await hre.run("harvest");

  await hre.run("schedule:validate", { frozen: true });

  await hre.run("checkpoint", { persist: true });

  log("Done");
});

task(
  "distribute:apply",
  "Calculate funding amounts, and posts two transactions that will eventually update the Distribution setup and enable new claimers",
).setAction(async (_, hre: HardhatRuntimeEnvironment) => {
  const log = (text: string) =>
    console.info(`Task distribute:apply -> ${text}`);

  const { isReady, distroAddressMainnet, distroAddressGnosis } = await hre.run(
    "status",
    { silent: true },
  );

  if (!isReady) {
    log("Setup not ready for Distribution. Skipping...");
    return;
  }

  const schedule = loadSchedule();
  const preCount = checkpointCount();
  const { merkleRootMainnet, merkleRootGnosis } = await hre.run("checkpoint", {
    persist: false,
  });
  const postCount = checkpointCount();
  // its important to ensure that checkpoint:apply is running
  // on artifacts previously calculated and committed
  assert(
    preCount === postCount,
    "Checkpoint task with ‘persist=false’ should not be writing",
  );

  if (!checkpointExists(merkleRootMainnet)) {
    throw new Error(`Checkpoints for (mainnet) ${merkleRootMainnet} not found`);
  }

  if (!checkpointExists(merkleRootGnosis)) {
    throw new Error(`Checkpoints for (gnosis) ${merkleRootGnosis} not found`);
  }

  const { amountToClaim, amountToFundMainnet, amountToFundGnosis } =
    await fundingAmounts(schedule, hre);

  await hre.run("propose", {
    distroAddressMainnet,
    distroAddressGnosis,
    merkleRootMainnet,
    merkleRootGnosis,
    amountToClaim,
    amountToFundMainnet,
    amountToFundGnosis,
  });
});

async function fundingAmounts(
  schedule: Schedule,
  hre: HardhatRuntimeEnvironment,
) {
  const providers = getProviders(hre);

  const lastEntry = schedule[schedule.length - 1];

  const amountToClaim = await queryAmountToClaim(
    addresses.mainnet.vestingPool,
    VESTING_ID,
    lastEntry.mainnet,
    providers.mainnet,
  );

  const { amountToFundMainnet, amountToFundGnosis } = calculateFundingBreakdown(
    schedule,
    amountToClaim,
  );

  return {
    amountToClaim,
    amountToFundMainnet,
    amountToFundGnosis,
  };
}
