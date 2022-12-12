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

task("status", "Checks SafeToken and MerkleDistro status").setAction(
  async (_, hre: HardhatRuntimeEnvironment) => {
    const providers = getProviders(hre);
    const log = (text: string) => console.info(`Task status -> ${text}`);

    log("Starting...");

    const { isTokenReady, isBridged, isPaused, tokenAddressGnosis } =
      await safeTokenStatus(providers);

    if (isPaused) {
      log(`SafeToken is still paused`);
    }

    if (!isBridged) {
      log(`SafeToken is not yet bridged`);
    }

    log(`SafeToken ready: ${isTokenReady}`);

    const {
      areDistrosReady,
      isDistroMainnetDeployed,
      isDistroGnosisDeployed,
      distroAddressMainnet,
      distroAddressGnosis,
    } = await distroStatus(tokenAddressGnosis, providers);

    if (!isDistroMainnetDeployed) {
      log(`MerkleDistroMainnet not yet deployed`);
    }

    if (!isDistroGnosisDeployed) {
      log(`MerkleDistroGnosis not yet deployed`);
    }

    log(`Are MerkleDistros ready: ${areDistrosReady}`);

    log("Done");
    return {
      isTokenReady,
      areDistrosReady,
      tokenAddressGnosis,
      distroAddressMainnet,
      distroAddressGnosis,
    };
  },
);

async function safeTokenStatus(providers: ProviderConfig) {
  const isPaused = await queryIsPaused(addresses, providers);
  if (isPaused) {
    return {
      isPaused: true,
      isBridged: false,
      isTokenReady: false,
      tokenAddressGnosis: constants.AddressZero,
    };
  }

  const tokenAddressGnosis = await queryBridgedAddress(addresses, providers);
  return {
    isPaused: false,
    isBridged: !!tokenAddressGnosis,
    isTokenReady: !!tokenAddressGnosis,
    tokenAddressGnosis: tokenAddressGnosis || constants.AddressZero,
  };
}

async function distroStatus(
  tokenAddressGnosis: string,
  providers: ProviderConfig,
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

  const [codeMainnet, codeGnosis] = await Promise.all([
    providers.mainnet.getCode(distroAddressMainnet),
    providers.gnosis.getCode(distroAddressGnosis),
  ]);

  return {
    areDistrosReady: codeMainnet !== "0x" && codeGnosis !== "0x",
    isDistroMainnetDeployed: codeMainnet !== "0x",
    isDistroGnosisDeployed: codeGnosis !== "0x",
    distroAddressMainnet,
    distroAddressGnosis,
  };
}
