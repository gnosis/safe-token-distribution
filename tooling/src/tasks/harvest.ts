import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

task(
  "harvest",
  "Tries to expand the schedule and calculate any missing allocations",
).setAction(async (_, hre: HardhatRuntimeEnvironment) => {
  await hre.run("schedule:expand");
  await hre.run("allocate");
});
