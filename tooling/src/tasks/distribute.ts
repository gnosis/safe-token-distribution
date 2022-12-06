import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

task("distribute", "")
  // .addOptionalParam(
  //   "safeMainnet",
  //   "Safe Address in Mainnet",
  //   undefined,
  //   types.string,
  // )
  // .addOptionalParam(
  //   "safeGC",
  //   "Safe Address in Gnosis Chain",
  //   undefined,
  //   types.string,
  // )
  // .addOptionalParam(
  //   "vestingId",
  //   "The vestingId on the VestingPool contract",
  //   VESTING_ID,
  //   types.string,
  // )
  .setAction(async (_, hre: HardhatRuntimeEnvironment) => {
    await hre.run("schedule:validate");

    await hre.run("schedule:expand");

    await hre.run("allocate:write-all");

    const [merkleRootMainnet, merkleRootGC] = await hre.run(
      "checkpoint:generate",
    );

    await hre.run("propose", { merkleRootMainnet, merkleRootGC });
  });
