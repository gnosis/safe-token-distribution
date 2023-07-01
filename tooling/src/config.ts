import assert from "assert";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import SafeApiKit from "@safe-global/api-kit";
import Safe, { EthersAdapter } from "@safe-global/protocol-kit";

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
export const GNO_LOCK_OPEN_TIMESTAMP = 1644944444 + 31536000;

export const ALLOCATION_FREQUENCY_IN_MINUTES = 60 * 24; // once a day

export const VESTING_ID =
  "0x12c1ee9f9b122fa7a0e7a6a733f6e07d30affb7fac1ca061325b11d9ba677382";

// created @ blockNumber: 15582160  blockTimestamp: 1663768259,
export const VESTING_CREATION_BLOCK_NUMBER = 15582160;
export const VESTING_CREATION_TIMESTAMP = 1663768259;

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

export async function getClients(
  safeAddressMainnet: string,
  safeAddressGnosis: string,
  hre: HardhatRuntimeEnvironment,
) {
  assert(process.env.MNEMONIC);

  const delegate = hre.ethers.Wallet.fromMnemonic(process.env.MNEMONIC);

  const providers = getProviders(hre);

  const ethAdapterMainnet = new EthersAdapter({
    ethers: hre.ethers,
    signerOrProvider: delegate.connect(providers.mainnet),
  });

  const ethAdapterGnosis = new EthersAdapter({
    ethers: hre.ethers,
    signerOrProvider: delegate.connect(providers.gnosis),
  });

  const { mainnet: serviceClientMainnet, gnosis: serviceClientGnosis } =
    getServiceClients(ethAdapterMainnet, ethAdapterGnosis);

  const safeMainnet = await Safe.create({
    ethAdapter: ethAdapterMainnet,
    safeAddress: safeAddressMainnet,
  });

  const safeGnosis = await Safe.create({
    ethAdapter: ethAdapterGnosis,
    safeAddress: safeAddressGnosis,
  });

  return {
    safeMainnet,
    safeGnosis,
    serviceClientMainnet,
    serviceClientGnosis,
    delegate,
  };
}

export function getProviders(hre: HardhatRuntimeEnvironment): ProviderConfig {
  const mainnet = new hre.ethers.providers.JsonRpcProvider(
    `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
  );

  const gnosis = new hre.ethers.providers.JsonRpcProvider(
    `https://rpc.gnosischain.com`,
  );

  return { mainnet, gnosis };
}

export function getServiceClients(
  ethAdapterMainnet: EthersAdapter,
  ethAdapterGnosis: EthersAdapter,
) {
  return {
    mainnet: new SafeApiKit({
      txServiceUrl: "https://safe-transaction-mainnet.safe.global/",
      ethAdapter: ethAdapterMainnet,
    }),
    gnosis: new SafeApiKit({
      txServiceUrl: "https://safe-transaction-gnosis-chain.safe.global/",
      ethAdapter: ethAdapterGnosis,
    }),
  };
}
