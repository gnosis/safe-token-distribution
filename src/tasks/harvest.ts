import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

task("harvest", "")
  .addOptionalParam(
    "lazy",
    "Don't recalculate if result is found on disk",
    true,
    types.boolean,
  )
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    await hre.run("snapshot:blocks", { lazy: taskArgs.lazy });
    await hre.run("snapshot:balances");
    await hre.run("snapshot:totalvested", { lazy: taskArgs.lazy });
  });
