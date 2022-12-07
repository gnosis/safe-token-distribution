import assert from "assert";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import EthersAdapter from "@gnosis.pm/safe-ethers-lib";
import SafeServiceClient from "@gnosis.pm/safe-service-client";
import Safe from "@gnosis.pm/safe-core-sdk";
import { ProviderConfig } from "./types";

/*
 *
 * TokenLock open timestamp is the same for both mainnet and gc
 *
 * Mainnet:
 * (0x4f8ad938eba0cd19155a835f617317a6e788c868).depositDeadline() +
 * (0x4f8ad938eba0cd19155a835f617317a6e788c868).lockDuration()
 * 1644944444 + 31536000
 *
 * Gnosis-chain:
 * (0xd4Ca39f78Bf14BfaB75226AC833b1858dB16f9a1).depositDeadline() +
 * (0xd4Ca39f78Bf14BfaB75226AC833b1858dB16f9a1).lockDuration()
 * 1644944444 + 31536000
 */
export const TOKEN_LOCK_OPEN_TIMESTAMP = 1644944444 + 31536000;

export const SNAPSHOT_FREQUENCY_IN_MINUTES = 60 * 24; // once a day

export const VESTING_ID =
  "0x12c1ee9f9b122fa7a0e7a6a733f6e07d30affb7fac1ca061325b11d9ba677382";
export const VESTING_CREATION_BLOCK = 15582160;

export const MERKLE_DISTRO_DEPLOYMENT_SALT =
  "0x0000000000000000000000000000000000000000000000000000000000badfed";

export const addresses = {
  mainnet: {
    token: "0x5aFE3855358E112B5647B952709E6165e1c1eEEe",
    omniMediator: "0x88ad09518695c6c3712ac10a214be5109a655671",
    treasurySafe: "0x849D52316331967b6fF1198e5E32A0eB168D039d",
    vestingPool: "0x96b71e2551915d98d22c448b040a3bc4801ea4ff",
  },
  gnosis: {
    omniMediator: "0xf6A78083ca3e2a662D6dd1703c939c8aCE2e268d",
    treasurySafe: "0x458cD345B4C05e8DF39d0A07220feb4Ec19F5e6f",
  },
};

export async function getSafeClients(
  safeAddressMainnet: string,
  safeAddressGC: string,
  hre: HardhatRuntimeEnvironment,
) {
  assert(process.env.MNEMONIC);

  const delegate = hre.ethers.Wallet.fromMnemonic(process.env.MNEMONIC);

  const providers = getProviders(hre);

  const ethAdapterMainnet = new EthersAdapter({
    ethers: hre.ethers,
    signerOrProvider: delegate.connect(providers.mainnet),
  });

  const ethAdapterGC = new EthersAdapter({
    ethers: hre.ethers,
    signerOrProvider: delegate.connect(providers.gnosis),
  });

  const serviceClientMainnet = new SafeServiceClient({
    txServiceUrl: "https://safe-transaction-mainnet.safe.global/",
    ethAdapter: ethAdapterMainnet,
  });

  const serviceClientGC = new SafeServiceClient({
    txServiceUrl: "https://safe-transaction-gnosis-chain.safe.global/",
    ethAdapter: ethAdapterGC,
  });

  const safeSdkMainnet = await Safe.create({
    ethAdapter: ethAdapterMainnet,
    safeAddress: safeAddressMainnet,
  });

  const safeSdkGC = await Safe.create({
    ethAdapter: ethAdapterGC,
    safeAddress: safeAddressGC,
  });

  return {
    safeSdkMainnet,
    safeSdkGC,
    serviceClientMainnet,
    serviceClientGC,
    delegate,
  };
}

export function getProviders(hre: HardhatRuntimeEnvironment): ProviderConfig {
  const mainnet = new hre.ethers.providers.JsonRpcProvider(
    `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
  );

  const gnosis = new hre.ethers.providers.JsonRpcProvider(
    `https://rpc.gnosischain.com `,
  );

  return { mainnet, gnosis };
}
