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
import { ProviderConfig } from "../types";

task("distribute", "").setAction(async (_, hre: HardhatRuntimeEnvironment) => {
  const providers = getProviders(hre);
  const log = (text: string) => console.info(`Task distribute -> ${text}`);

  const { isTokenReady, tokenAddressGnosis } = await safeTokenStatus(
    providers,
    log,
  );
  if (!isTokenReady) {
    return;
  }

  const { isDistroReady, distroAddressMainnet, distroAddressGnosis } =
    await distroStatus(tokenAddressGnosis, providers, log);
  if (!isDistroReady) {
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

async function safeTokenStatus(
  providers: ProviderConfig,
  log: (text: string) => void,
) {
  const isPaused = await queryIsPaused(addresses, providers);
  if (isPaused) {
    log("SafeToken is still paused. Skipping Execution...");
    return {
      isTokenReady: false,
      tokenAddressGnosis: constants.AddressZero,
    };
  }

  const tokenAddressGnosis = await queryBridgedAddress(addresses, providers);
  if (tokenAddressGnosis) {
    return {
      isTokenReady: true,
      tokenAddressGnosis,
    };
  } else {
    log("SafeToken not yet bridged. Skipping Execution...");
    return {
      isTokenReady: false,
      tokenAddressGnosis: constants.AddressZero,
    };
  }
}

async function distroStatus(
  tokenAddressGnosis: string,
  providers: ProviderConfig,
  log: (text: string) => void,
) {
  const distroAddressMainnet = calculateDistroAddress(
    "1",
    addresses.mainnet.token,
    constants.HashZero,
    addresses.mainnet.treasurySafe,
    MERKLE_DISTRO_DEPLOYMENT_SALT,
  );

  const distroAddressGnosis = calculateDistroAddress(
    "100",
    tokenAddressGnosis,
    constants.HashZero,
    addresses.gnosis.treasurySafe,
    MERKLE_DISTRO_DEPLOYMENT_SALT,
  );

  let code = await providers.mainnet.getCode(distroAddressMainnet);
  if (code === "0x") {
    log("mainnet MerkleDistro is not yet deployed. Skipping Execution...");
    return {
      isDistroReady: false,
      distroAddressMainnet,
      distroAddressGnosis,
    };
  }

  code = await providers.gnosis.getCode(distroAddressGnosis);
  if (code === "0x") {
    log("gnosis MerkleDistro is not yet deployed. Skipping Execution...");
    return {
      isDistroReady: false,
      distroAddressMainnet,
      distroAddressGnosis,
    };
  }

  return {
    isDistroReady: true,
    distroAddressMainnet,
    distroAddressGnosis,
  };
}
