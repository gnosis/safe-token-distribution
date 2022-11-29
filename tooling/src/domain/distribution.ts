import assert from "assert";
import { BigNumber, BigNumberish } from "ethers";
import Safe from "@gnosis.pm/safe-core-sdk";
import {
  SafeTransaction,
  SafeTransactionDataPartial,
} from "@gnosis.pm/safe-core-sdk-types";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { loadAllocation, Schedule } from "../persistence";
import { sum } from "../snapshot";

import { queryAmountToClaim } from "../queries/queryVestingPool";

import { getProviders, VESTING_ID, VESTING_POOL_ADDRESS } from "../config";
import {
  MerkleDistro__factory,
  VestingPool__factory,
  ERC20__factory,
  OmniMediator__factory,
} from "../../typechain";

export async function calculateAmountToBridge(
  schedule: Schedule,
  hre: HardhatRuntimeEnvironment,
) {
  const providers = getProviders(hre);

  const lastEntry = schedule[schedule.length - 1].mainnet;
  const amountToClaim = await queryAmountToClaim(
    VESTING_POOL_ADDRESS,
    VESTING_ID,
    lastEntry.blockNumber,
    providers.mainnet,
  );

  const reversedSchedule = [...schedule].reverse();
  let amountMainnet = BigNumber.from(0);
  let amountGC = BigNumber.from(0);

  for (const { mainnet, gc } of reversedSchedule) {
    const allocationMainnet = loadAllocation("mainnet", mainnet.blockNumber);
    assert(!!allocationMainnet);

    const allocationGC = loadAllocation("gc", gc.blockNumber);
    assert(!!allocationGC);

    amountMainnet = amountMainnet.add(sum(allocationMainnet));
    amountGC = amountGC.add(sum(allocationGC));

    const total = amountMainnet.add(amountGC);

    if (total.gt(amountToClaim)) {
      throw new Error("!!!Accounting Overflow Panic!!!");
    }

    if (total.eq(amountToClaim)) {
      return { amountToClaim, amountToBridge: amountGC };
    }
  }

  throw new Error("!!!Accounting Underflow Panic!!!");
}

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
      encodeTransfer(safeTokenAddress, distroMainnetAddress, amountToClaim),
      ...encodeBridgeSafeTokens(
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

function encodeTransfer(
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

function encodeBridgeSafeTokens(
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
