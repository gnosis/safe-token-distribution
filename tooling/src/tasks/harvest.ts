import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

task(
  "harvest",
  "Tries to expand the schedule and calculate any missing allocations",
).setAction(async (_, hre: HardhatRuntimeEnvironment) => {
  await hre.run("schedule:validate", { deep: false, frozen: false });

  await hre.run("schedule:expand");

  await hre.run("schedule:validate", { deep: false, frozen: true });

  await hre.run("allocate:all");
});
