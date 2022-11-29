import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

task(
  "harvest",
  "Expands the current schedule, and calculates and persists any missing allocations",
).setAction(async (_, hre: HardhatRuntimeEnvironment) => {
  await hre.run("schedule:validate", { deep: false, frozen: false });

  await hre.run("schedule:expand");

  await hre.run("schedule:validate", { deep: false, frozen: false });

  await hre.run("allocate:write-all");
});
