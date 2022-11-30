import { Signer } from "ethers";
import Safe from "@gnosis.pm/safe-core-sdk";
import SafeServiceClient from "@gnosis.pm/safe-service-client";
import { SafeTransaction } from "@gnosis.pm/safe-core-sdk-types";

import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { loadSchedule } from "../persistence";

import {
  createDistributeTxGC,
  createDistributeTxMainnet,
} from "../fns/createDistributeTx";

import {
  getAddressConfig,
  getSafes,
  SAFE_ADDRESS_GC,
  SAFE_ADDRESS_MAINNET,
  VESTING_ID,
  VESTING_POOL_ADDRESS,
} from "../config";
import { queryAmountToClaim } from "../queries/queryVestingPool";

task("distribute", "")
  .addOptionalParam(
    "safeMainnet",
    "Safe Address in Mainnet",
    SAFE_ADDRESS_MAINNET,
    types.string,
  )
  .addOptionalParam(
    "safeGC",
    "Safe Address in Gnosis Chain",
    SAFE_ADDRESS_GC,
    types.string,
  )
  .addOptionalParam(
    "vestingId",
    "The vestingId on the VestingPool contract",
    VESTING_ID,
    types.string,
  )
  .setAction(async (taskArgs: any, hre: HardhatRuntimeEnvironment) => {
    await hre.run("schedule:validate");

    await hre.run("schedule:expand");

    await hre.run("allocation:write-all");

    const [merkleRootMainnet, merkleRootGC] = await hre.run(
      "checkpoint:generate",
    );

    await hre.run("propose", { merkleRootMainnet, merkleRootGC });
  });
