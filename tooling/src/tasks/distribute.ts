import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { SAFE_ADDRESS_GC, SAFE_ADDRESS_MAINNET, VESTING_ID } from "../config";

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

    await hre.run("allocate:write-all");

    const [merkleRootMainnet, merkleRootGC] = await hre.run(
      "checkpoint:generate",
    );

    await hre.run("propose", { merkleRootMainnet, merkleRootGC });
  });
