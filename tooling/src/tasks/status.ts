import { constants } from "ethers";
import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { queryBridgedAddress, queryIsPaused } from "../queries/queryToken";
import calculateDistroAddress from "../fns/calculateDistroAdress";

import {
  addresses,
  getProviders,
  getServiceClients,
  MERKLE_DISTRO_DEPLOYMENT_SALT,
} from "../config";

import { ProviderConfig } from "../types";
import EthersAdapter from "@gnosis.pm/safe-ethers-lib";
import { getAddress } from "ethers/lib/utils";

task("status", "Checks SafeToken and MerkleDistro status")
  .addOptionalParam("silent", "No log output", false, types.boolean)
  .setAction(async ({ silent }, hre: HardhatRuntimeEnvironment) => {
    const providers = getProviders(hre);
    const log = (text: string) =>
      !silent && console.info(`Task status -> ${text}`);

    log("Starting...");

    const { isTokenReady, isBridged, isPaused, tokenAddressGnosis } =
      await safeTokenStatus(providers);

    const {
      areDistrosReady,
      isDistroMainnetDeployed,
      isDistroGnosisDeployed,
      distroAddressMainnet,
      distroAddressGnosis,
    } = await distroStatus(tokenAddressGnosis, providers);

    const { isDelegateMainnet, isDelegateGnosis } = await delegateStatus(
      addresses.mainnet.treasurySafe,
      addresses.gnosis.treasurySafe,
      hre,
    );

    log(`SafeToken Paused   ${isPaused}`);
    log(`SafeToken Bridged  ${isBridged}`);
    log(`SafeToken Ready    ${isTokenReady}`);
    log(`Distro Mainnet     ${isDistroMainnetDeployed}`);
    log(`Distro Gnosis      ${isDistroGnosisDeployed}`);
    log(`Distros Ready      ${areDistrosReady}`);
    log(`Delegate Mainnet   ${isDelegateMainnet}`);
    log(`Delegate Gnosis    ${isDelegateGnosis}`);

    log("Done");
    return {
      isTokenReady,
      isTokenPaused: isPaused,
      isTokenBridged: isBridged,
      tokenAddressGnosis,
      areDistrosReady,
      isDistroMainnetDeployed,
      isDistroGnosisDeployed,
      distroAddressMainnet,
      distroAddressGnosis,
      isDelegateMainnet,
      isDelegateGnosis,
    };
  });

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

async function delegateStatus(
  safeAddressMainnet: string,
  safeAddressGnosis: string,
  hre: HardhatRuntimeEnvironment,
) {
  const providers = getProviders(hre);

  const [delegate] = await hre.ethers.getSigners();

  const ethAdapterMainnet = new EthersAdapter({
    ethers: hre.ethers,
    signerOrProvider: providers.mainnet,
  });

  const ethAdapterGC = new EthersAdapter({
    ethers: hre.ethers,
    signerOrProvider: providers.gnosis,
  });

  const serviceClients = getServiceClients(ethAdapterMainnet, ethAdapterGC);

  const [delegatesMainnet, delegatesGnosis] = await Promise.all([
    serviceClients.mainnet.getSafeDelegates(safeAddressMainnet),
    serviceClients.gnosis.getSafeDelegates(safeAddressGnosis),
  ]);

  return {
    isDelegateMainnet: delegatesMainnet.results.some(
      (result) => getAddress(result.delegate) === getAddress(delegate.address),
    ),
    isDelegateGnosis: delegatesGnosis.results.some(
      (result) => getAddress(result.delegate) === getAddress(delegate.address),
    ),
  };
}
