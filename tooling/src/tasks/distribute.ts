import { constants } from "ethers";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { queryBridgedAddress, queryIsPaused } from "../queries/queryToken";
import calculateDistroAddress from "../fns/calculateDistroAdress";

import {
  addresses,
  getProviders,
  MERKLE_DISTRO_DEPLOYMENT_SALT,
} from "../config";

task("distribute", "").setAction(async (_, hre: HardhatRuntimeEnvironment) => {
  const log = (text: string) => console.info(`distribute ${text}`);

  const { proceed, distroAddressMainnet, distroAddressGC } =
    await tokenAndDistrosStatus(hre, log);

  if (proceed) {
    await hre.run("harvest");

    const [merkleRootMainnet, merkleRootGC] = await hre.run("checkpoint");

    await hre.run("propose", {
      distroAddressMainnet,
      distroAddressGC,
      merkleRootMainnet,
      merkleRootGC,
    });
  }
});

async function tokenAndDistrosStatus(
  hre: HardhatRuntimeEnvironment,
  log: (text: string) => void,
) {
  const providers = getProviders(hre);

  const isPaused = await queryIsPaused(addresses, providers);
  if (isPaused) {
    log("SafeToken is still paused. Skipping Execution...");
    return {
      proceed: false,
      distroAddressMainnet: constants.AddressZero,
      distroAddressGC: constants.AddressZero,
    };
  }

  const tokenAddressGC = await queryBridgedAddress(addresses, providers);
  if (!tokenAddressGC) {
    log("SafeToken not yet bridged. Skipping Execution...");
    return {
      proceed: false,
      distroAddressMainnet: constants.AddressZero,
      distroAddressGC: constants.AddressZero,
    };
  }

  const distroAddressMainnet = calculateDistroAddress(
    "1",
    addresses.mainnet.token,
    constants.HashZero,
    addresses.mainnet.treasurySafe,
    MERKLE_DISTRO_DEPLOYMENT_SALT,
  );

  const distroAddressGC = calculateDistroAddress(
    "100",
    tokenAddressGC,
    constants.HashZero,
    addresses.gnosis.treasurySafe,
    MERKLE_DISTRO_DEPLOYMENT_SALT,
  );

  let code = await providers.mainnet.getCode(distroAddressMainnet);
  if (code === "0x") {
    log("Mainnet MerkleDistro is not yet deployed. Skipping Execution...");
    return {
      proceed: false,
      distroAddressMainnet,
      distroAddressGC,
    };
  }

  code = await providers.mainnet.getCode(distroAddressGC);
  if (code === "0x") {
    log("Gnosis-chain MerkleDistro is not yet deployed. Skipping Execution...");
    return {
      proceed: false,
      distroAddressMainnet,
      distroAddressGC,
    };
  }

  return {
    proceed: true,
    distroAddressMainnet,
    distroAddressGC,
  };
}
