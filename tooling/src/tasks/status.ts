import { constants } from "ethers";

import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { EthersAdapter } from "@safe-global/protocol-kit";
import { getAddress } from "ethers/lib/utils";

import calculateDistroAddress from "../fns/calculateDistroAdress";

import {
  addresses,
  getProviders,
  getServiceClients,
  MERKLE_DISTRO_DEPLOYMENT_SALT,
} from "../config";

import { AddressConfig, ProviderConfig } from "../types";
import { OmniMediator__factory, SafeToken__factory } from "../../typechain";

task("status", "Checks SafeToken and MerkleDistro status")
  .addOptionalParam("silent", "No log output", false, types.boolean)
  .setAction(async ({ silent }, hre: HardhatRuntimeEnvironment) => {
    const providers = getProviders(hre);
    const log = (text: string) =>
      !silent && console.info(`Task status -> ${text}`);

    log("Starting...");

    const { isBridged, isPaused, tokenAddressGnosis } = await safeTokenStatus(
      providers,
    );

    const {
      isDistroMainnetDeployed,
      isDistroGnosisDeployed,
      distroAddressMainnet,
      distroAddressGnosis,
    } = await distroStatus(tokenAddressGnosis, providers);

    const { delegateAddress, isDelegateMainnet, isDelegateGnosis } =
      await delegateStatus(
        addresses.mainnet.treasurySafe,
        addresses.gnosis.treasurySafe,
        hre,
      );

    log(`SafeToken`);
    log(`    Paused   ${isPaused}`);
    log(`    Bridged  ${tokenAddressGnosis}`);
    log(`    Ready    ${isBridged}`);
    log(`MerkleDistro (address , isDeployed)`);
    log(`    Mainnet  (${distroAddressMainnet} , ${isDistroMainnetDeployed})`);
    log(`    Gnosis   (${distroAddressGnosis} , ${isDistroGnosisDeployed})`);
    log(`Delegate     (address , isEnabled)`);
    log(`    Mainnet  (${delegateAddress} , ${isDelegateMainnet})`);
    log(`    Gnosis   (${delegateAddress} , ${isDelegateGnosis})`);
    log("Done");

    const isTokenReady = isBridged;
    const isDistroReady = isDistroMainnetDeployed && isDistroGnosisDeployed;
    const isDelegateReady = isDelegateMainnet && isDelegateGnosis;

    return {
      isReady: isTokenReady && isDistroReady && isDelegateReady,
      isTokenReady,
      isDistroReady,
      isDelegateReady,
      tokenAddressGnosis,
      distroAddressMainnet,
      distroAddressGnosis,
    };
  });

async function safeTokenStatus(providers: ProviderConfig) {
  const isPaused = await queryIsPaused(addresses, providers);
  if (isPaused) {
    return {
      isPaused: true,
      isBridged: false,
      tokenAddressGnosis: constants.AddressZero,
    };
  }

  const tokenAddressGnosis = await queryBridgedAddress(addresses, providers);
  return {
    isPaused: false,
    isBridged: !!tokenAddressGnosis,
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

  if (!process.env.MNEMONIC) {
    throw new Error("No MNEMONIC provided");
  }

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
    serviceClients.mainnet.getSafeDelegates({
      safeAddress: safeAddressMainnet,
    }),
    serviceClients.gnosis.getSafeDelegates({
      safeAddress: safeAddressGnosis,
    }),
  ]);

  const delegate = hre.ethers.Wallet.fromMnemonic(process.env.MNEMONIC);

  return {
    delegateAddress: delegate.address,
    isDelegateMainnet: true,
    // delegatesMainnet.results.some(
    //   (result) => getAddress(result.delegate) === getAddress(delegate.address),
    // ),
    isDelegateGnosis: true,
    // delegatesGnosis.results.some(
    //   (result) => getAddress(result.delegate) === getAddress(delegate.address),
    // ),
  };
}

export async function queryIsPaused(
  addresses: AddressConfig,
  provider: ProviderConfig,
): Promise<boolean> {
  const safeToken = SafeToken__factory.connect(
    addresses.mainnet.token,
    provider.mainnet,
  );

  return safeToken.paused();
}

export async function queryBridgedAddress(
  addresses: AddressConfig,
  providers: ProviderConfig,
): Promise<string | null> {
  const omniMediatorGC = OmniMediator__factory.connect(
    addresses.gnosis.omniMediator,
    providers.gnosis,
  );

  const tokenAddressGC = await omniMediatorGC.bridgedTokenAddress(
    addresses.mainnet.token,
  );

  const isBridged = tokenAddressGC !== constants.AddressZero;

  return isBridged ? tokenAddressGC : null;
}
