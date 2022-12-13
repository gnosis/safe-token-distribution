import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { getProviders } from "../config";

task(
  "distribute",
  "Creates a new checkpoint, calculates claim amounts, and updates distro setup enabling new claimers on both networks",
).setAction(async (_, hre: HardhatRuntimeEnvironment) => {
  const providers = getProviders(hre);

  const log = (text: string) => console.info(`Task distribute -> ${text}`);

  const {
    isTokenReady,
    areDistrosReady,
    distroAddressMainnet,
    distroAddressGnosis,
  } = await hre.run("status", { silent: true });

  if (!isTokenReady || !areDistrosReady) {
    log("Setup not ready for Distribution. Skipping...");
    return;
  }

  await hre.run("harvest");

  const { merkleRootMainnet, merkleRootGnosis } = await hre.run("checkpoint");

  await hre.run("propose", {
    distroAddressMainnet,
    distroAddressGnosis,
    merkleRootMainnet,
    merkleRootGnosis,
  });
});
