import { BigNumber, BigNumberish } from "ethers";
import Safe from "@gnosis.pm/safe-core-sdk";
import {
  SafeTransaction,
  SafeTransactionDataPartial,
} from "@gnosis.pm/safe-core-sdk-types";

import {
  MerkleDistro__factory,
  VestingPool__factory,
  ERC20__factory,
  OmniMediator__factory,
} from "../../typechain";
import { AddressConfig } from "../types";
import assert from "assert";

type MainnetArgs = {
  distroAddressMainnet: string;
  distroAddressGnosis: string;
  vestingId: string;
  amountToClaim: BigNumber;
  amountToFund: BigNumber;
  amountToBridge: BigNumber;
  nextMerkleRoot: string;
};

export async function createDistributeTxMainnet(
  safeSdk: Safe,
  addresses: AddressConfig,
  {
    distroAddressMainnet,
    distroAddressGnosis,
    vestingId,
    amountToClaim,
    amountToFund,
    amountToBridge,
    nextMerkleRoot,
  }: MainnetArgs,
): Promise<SafeTransaction> {
  const safeAddress = await safeSdk.getAddress();

  assert(amountToClaim.eq(amountToFund.add(amountToBridge)));

  // encode as multisend
  return safeSdk.createTransaction({
    safeTransactionData: [
      encodeClaim(
        addresses.mainnet.vestingPool,
        vestingId,
        safeAddress,
        amountToClaim,
      ),
      encodeFundDistroMainnet(
        addresses.mainnet.token,
        distroAddressMainnet,
        amountToFund,
      ),
      ...encodeFundDistroGnosis(
        addresses.mainnet.token,
        addresses.mainnet.omniMediator,
        distroAddressGnosis,
        amountToBridge,
      ),
      encodeSetMerkleRoot(distroAddressMainnet, nextMerkleRoot),
    ],
  });
}

export async function createDistributeTxGC(
  safeSdk: Safe,
  merkleDistroAddress: string,
  nextMerkleRoot: string,
): Promise<SafeTransaction> {
  return safeSdk.createTransaction({
    safeTransactionData: encodeSetMerkleRoot(
      merkleDistroAddress,
      nextMerkleRoot,
    ),
  });
}

function encodeClaim(
  vestingPoolAddress: string,
  vestingId: string,
  safeAddress: string,
  amountToClaim: BigNumberish,
): SafeTransactionDataPartial {
  const iface = VestingPool__factory.createInterface();

  return {
    to: vestingPoolAddress,
    data: iface.encodeFunctionData("claimVestedTokens", [
      vestingId,
      safeAddress,
      amountToClaim,
    ]),
    value: "0",
  };
}

function encodeFundDistroMainnet(
  safeTokenAddress: string,
  merkleDistroAddress: string,
  amount: BigNumberish,
): SafeTransactionDataPartial {
  const iface = ERC20__factory.createInterface();

  return {
    to: safeTokenAddress,
    data: iface.encodeFunctionData("transfer", [merkleDistroAddress, amount]),
    value: "0",
  };
}

function encodeSetMerkleRoot(
  merkleDistroAddress: string,
  nextMerkleRoot: string,
): SafeTransactionDataPartial {
  const iface = MerkleDistro__factory.createInterface();
  return {
    to: merkleDistroAddress,
    data: iface.encodeFunctionData("setMerkleRoot", [nextMerkleRoot]),
    value: "0",
  };
}

function encodeFundDistroGnosis(
  safeTokenAddress: string,
  omniMediatorAddress: string,
  merkleDistroAddress: string,
  amount: BigNumberish,
): SafeTransactionDataPartial[] {
  const ifaceToken = ERC20__factory.createInterface();
  const ifaceMediator = OmniMediator__factory.createInterface();

  return [
    {
      to: safeTokenAddress,
      data: ifaceToken.encodeFunctionData("approve", [
        omniMediatorAddress,
        amount,
      ]),
      value: "0",
    },
    {
      to: omniMediatorAddress,
      data: ifaceMediator.encodeFunctionData("relayTokens", [
        safeTokenAddress,
        merkleDistroAddress,
        amount,
      ]),
      value: "0",
    },
  ];
}
