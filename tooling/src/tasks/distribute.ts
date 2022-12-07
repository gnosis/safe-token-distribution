import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

task("distribute", "").setAction(async (_, hre: HardhatRuntimeEnvironment) => {
  await hre.run("harvest");

  const [merkleRootMainnet, merkleRootGC] = await hre.run("checkpoint");

  await hre.run("propose", { merkleRootMainnet, merkleRootGC });
});
