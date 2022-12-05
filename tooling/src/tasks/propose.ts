import { Signer } from "ethers";
import Safe from "@gnosis.pm/safe-core-sdk";
import SafeServiceClient from "@gnosis.pm/safe-service-client";
import { SafeTransaction } from "@gnosis.pm/safe-core-sdk-types";

import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { loadSchedule } from "../persistence";

import { queryAmountToClaim } from "../queries/queryVestingPool";
import calculateClaimBreakdown from "../fns/calculateClaimBreakdown";
import {
  createDistributeTxGC,
  createDistributeTxMainnet,
} from "../fns/createDistributeTx";

import {
  getAddressConfig,
  getProviders,
  getSafes,
  SAFE_ADDRESS_GC,
  SAFE_ADDRESS_MAINNET,
  VESTING_ID,
  VESTING_POOL_ADDRESS,
} from "../config";
import { assert } from "console";

task("propose", "")
  .addOptionalParam(
    "safeMainnet",
    "Safe Address in Mainnet",
    SAFE_ADDRESS_MAINNET,
    types.string,
  )
  .addOptionalParam(
    "safeGC",
    "Safe Address in Gnosis Chain",
    SAFE_ADDRESS_GC,
    types.string,
  )
  .addOptionalParam(
    "vestingId",
    "The vestingId on the VestingPool contract",
    VESTING_ID,
    types.string,
  )
  .addParam("merkleRootMainnet", "", undefined, types.string)
  .addParam("merkleRootGC", "", undefined, types.string)
  .setAction(async (taskArgs: any, hre: HardhatRuntimeEnvironment) => {
    const providers = getProviders(hre);
    const schedule = loadSchedule();
    const lastEntry = schedule[schedule.length - 1];

    const amountToClaim = await queryAmountToClaim(
      VESTING_POOL_ADDRESS,
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
      safeToken: safeTokenAddress,
      vestingPool: vestingPoolAddress,
      omniMediatorMainnet: omniMediatorAddress,
      distroMainnet: distroMainnetAddress,
      distroGC: distroGCAddress,
    } = await getAddressConfig(hre);

    const {
      delegate,
      safeSdkMainnet,
      safeSdkGC,
      serviceClientMainnet,
      serviceClientGC,
    } = await getSafes(taskArgs.safeMainnet, taskArgs.safeGC, hre);

    const txMainnet = await createDistributeTxMainnet(safeSdkMainnet, {
      safeTokenAddress,
      vestingPoolAddress,
      omniMediatorAddress,
      distroMainnetAddress,
      distroGCAddress,
      vestingId: taskArgs.vestingId,
      amountToClaim,
      amountToBridge: amountForGC,
      nextMerkleRoot: taskArgs.merkleRootMainnet,
    });

    const txGC = await createDistributeTxGC(safeSdkGC, {
      distroAddress: distroGCAddress,
      nextMerkleRoot: taskArgs.merkleRootGC,
    });

    await sanityCheck();

    await Promise.all([
      propose(safeSdkMainnet, serviceClientMainnet, delegate, txMainnet),
      propose(safeSdkGC, serviceClientGC, delegate, txGC),
    ]);
  });

async function sanityCheck() {
  // check MerkleDistros are deployed
  // check delegate is enabled in both safes
}

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
