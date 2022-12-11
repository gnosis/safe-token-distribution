import assert from "assert";
import { Signer } from "ethers";
import { isAddress, isHexString } from "ethers/lib/utils";

import Safe from "@gnosis.pm/safe-core-sdk";
import SafeServiceClient from "@gnosis.pm/safe-service-client";
import { SafeTransaction } from "@gnosis.pm/safe-core-sdk-types";

import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { queryAmountToClaim } from "../queries/queryVestingPool";
import calculateClaimBreakdown from "../fns/calculateClaimBreakdown";
import {
  createDistributeTxGC,
  createDistributeTxMainnet,
} from "../fns/createDistributeTx";

import { loadSchedule } from "../persistence";

import { addresses, getProviders, getSafeClients, VESTING_ID } from "../config";

type TaskArgs = {
  distroAddressMainnet: string;
  distroAddressGnosis: string;
  merkleRootMainnet: string;
  merkleRootGnosis: string;
};

task(
  "propose",
  "It updates the distribution setup, by unlocking tokens and uploading new proofs to the distribution contracts",
)
  .addParam("distroAddressMainnet", "", undefined, types.string)
  .addParam("distroAddressGnosis", "", undefined, types.string)
  .addParam("merkleRootMainnet", "", undefined, types.string)
  .addParam("merkleRootGnosis", "", undefined, types.string)
  .setAction(async (taskArgs: TaskArgs, hre: HardhatRuntimeEnvironment) => {
    const {
      distroAddressMainnet,
      distroAddressGnosis,
      merkleRootMainnet,
      merkleRootGnosis,
    } = taskArgs;

    if (!isAddress(distroAddressMainnet)) {
      throw new Error("Arg distroAddressMainnet is not an address");
    }

    if (!isAddress(distroAddressGnosis)) {
      throw new Error("Arg distroAddressGnosis is not an address");
    }

    if (!isHexBytes32(merkleRootMainnet)) {
      throw new Error("Arg MerkleRootMainnet is not 32 bytes hex");
    }

    if (!isHexBytes32(merkleRootGnosis)) {
      throw new Error("Arg MerkleRootGnosis is not 32 bytes hex");
    }

    const providers = getProviders(hre);
    const schedule = loadSchedule();

    const lastEntry = schedule[schedule.length - 1];

    const amountToClaim = await queryAmountToClaim(
      addresses.mainnet.vestingPool,
      VESTING_ID,
      lastEntry.mainnet.blockNumber,
      providers.mainnet,
    );

    const { amountForMainnet, amountForGC } = await calculateClaimBreakdown(
      schedule,
      amountToClaim,
    );

    assert(amountForMainnet.add(amountForGC).eq(amountToClaim));

    const {
      delegate,
      safeSdkMainnet,
      safeSdkGC,
      serviceClientMainnet,
      serviceClientGC,
    } = await getSafeClients(
      addresses.mainnet.treasurySafe,
      addresses.gnosis.treasurySafe,
      hre,
    );

    const txMainnet = await createDistributeTxMainnet(
      safeSdkMainnet,
      addresses,
      distroAddressMainnet,
      distroAddressGnosis,
      VESTING_ID,
      amountToClaim,
      amountForGC,
      merkleRootMainnet,
    );

    const txGC = await createDistributeTxGC(
      safeSdkGC,
      distroAddressGnosis,
      merkleRootGnosis,
    );

    await Promise.all([
      propose(safeSdkMainnet, serviceClientMainnet, delegate, txMainnet),
      propose(safeSdkGC, serviceClientGC, delegate, txGC),
    ]);
  });

async function propose(
  safeSdk: Safe,
  client: SafeServiceClient,
  delegate: Signer,
  tx: SafeTransaction,
) {
  const safeTxHash = await safeSdk.getTransactionHash(tx);
  const senderSignature = await safeSdk.signTransactionHash(safeTxHash);
  const senderAddress = await delegate.getAddress();

  await client.proposeTransaction({
    safeAddress: safeSdk.getAddress(),
    safeTransactionData: tx.data,
    safeTxHash,
    senderAddress,
    senderSignature: senderSignature.data,
  });
}

function isHexBytes32(s: string) {
  return isHexString(s) && s.length === 66;
}
