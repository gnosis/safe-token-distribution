import assert from "assert";
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

export async function createDistributeTxMainnet(
  safeSdk: Safe,
  config: {
    safeTokenAddress: string;
    vestingPoolAddress: string;
    omniMediatorAddress: string;
    distroMainnetAddress: string;
    distroGCAddress: string;
    vestingId: string;
    amountToClaim: BigNumber;
    amountToBridge: BigNumber;
    nextMerkleRoot: string;
  },
): Promise<SafeTransaction> {
  const {
    safeTokenAddress,
    vestingPoolAddress,
    omniMediatorAddress,
    distroMainnetAddress,
    distroGCAddress,
    vestingId,
    amountToClaim,
    amountToBridge,
    nextMerkleRoot,
  } = config;

  const safeAddress = await safeSdk.getAddress();

  // encode as multisend
  return safeSdk.createTransaction({
    safeTransactionData: [
      encodeClaim(vestingPoolAddress, vestingId, safeAddress, amountToClaim),
      encodeFundDistroMainnet(
        safeTokenAddress,
        distroMainnetAddress,
        amountToClaim,
      ),
      ...encodeFundDistroGC(
        safeTokenAddress,
        omniMediatorAddress,
        distroGCAddress,
        amountToBridge,
      ),
      encodeSetMerkleRoot(distroMainnetAddress, nextMerkleRoot),
    ],
  });
}

export async function createDistributeTxGC(
  safeSdk: Safe,
  config: {
    distroAddress: string;
    nextMerkleRoot: string;
  },
): Promise<SafeTransaction> {
  const { distroAddress, nextMerkleRoot } = config;

  return safeSdk.createTransaction({
    safeTransactionData: encodeSetMerkleRoot(distroAddress, nextMerkleRoot),
  });
}

function encodeClaim(
  vestingPoolAddress: string,
  vestingId: string,
  safeAddress: string,
  amountToClaim: BigNumberish,
): SafeTransactionDataPartial {
  const iface = VestingPool__factory.createInterface();

  const data = iface.encodeFunctionData("claimVestedTokens", [
    vestingId,
    safeAddress,
    amountToClaim,
  ]);

  return {
    to: vestingPoolAddress,
    data,
    value: "0",
  };
}

function encodeFundDistroMainnet(
  safeTokenAddress: string,
  merkleDistroAddress: string,
  amount: BigNumberish,
): SafeTransactionDataPartial {
  const iface = ERC20__factory.createInterface();

  const data = iface.encodeFunctionData("transfer", [
    merkleDistroAddress,
    amount,
  ]);

  return {
    to: safeTokenAddress,
    data,
    value: "0",
  };
}

function encodeSetMerkleRoot(
  merkleDistroAddress: string,
  nextMerkleRoot: string,
): SafeTransactionDataPartial {
  const iface = MerkleDistro__factory.createInterface();

  const data = iface.encodeFunctionData("setMerkleRoot", [nextMerkleRoot]);

  return {
    to: merkleDistroAddress,
    data,
    value: "0",
  };
}

function encodeFundDistroGC(
  safeTokenAddress: string,
  omniMediatorAddress: string,
  merkleDistroGCAddress: string,
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
        merkleDistroGCAddress,
        amount,
      ]),
      value: "0",
    },
  ];
}
