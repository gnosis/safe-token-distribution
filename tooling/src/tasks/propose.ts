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

task("propose", "")
  .addParam("distroAddressMainnet", "", undefined, types.string)
  .addParam("distroAddressGC", "", undefined, types.string)
  .addParam("merkleRootMainnet", "", undefined, types.string)
  .addParam("merkleRootGC", "", undefined, types.string)
  .setAction(async (taskArgs: any, hre: HardhatRuntimeEnvironment) => {
    const {
      distroAddressMainnet,
      distroAddressGC,
      merkleRootMainnet,
      merkleRootGC,
    } = taskArgs;

    if (!isAddress(distroAddressMainnet)) {
      throw new Error("Arg distroAddressMainnet is not an address");
    }

    if (!isAddress(distroAddressGC)) {
      throw new Error("Arg distroAddressMainnet is not an address");
    }

    if (!isHexBytes32(merkleRootMainnet)) {
      throw new Error("Arg MerkleRootMainnet is not 32 bytes hex");
    }

    if (!isHexBytes32(merkleRootGC)) {
      throw new Error("Arg MerkleRootGC is not 32 bytes hex");
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
      distroAddressGC,
      VESTING_ID,
      amountToClaim,
      amountForGC,
      merkleRootMainnet,
    );

    const txGC = await createDistributeTxGC(
      safeSdkGC,
      distroAddressGC,
      merkleRootGC,
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
