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
    await hre.run("harvest:blocks", { lazy: taskArgs.lazy });
    await hre.run("harvest:balances", { lazy: taskArgs.lazy });
    await hre.run("harvest:totalvested", { lazy: taskArgs.lazy });
    //await hre.run("harvest:allocation", { lazy: taskArgs.lazy });
  });
