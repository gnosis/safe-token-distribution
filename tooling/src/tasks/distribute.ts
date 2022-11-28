import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { loadSchedule } from "../persistence";

import {
  calculateAmountToBridge,
  createDistributeTxGC,
  createDistributeTxMainnet,
} from "../domain/distribution";

import {
  getAddressConfig,
  getSafes,
  SAFE_ADDRESS_GC,
  SAFE_ADDRESS_MAINNET,
  VESTING_ID,
} from "../config";
import Safe from "@gnosis.pm/safe-core-sdk";
import SafeServiceClient from "@gnosis.pm/safe-service-client";
import { SafeTransaction } from "@gnosis.pm/safe-core-sdk-types";
import { Signer } from "ethers";

task("distribute", "")
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
  .setAction(async (taskArgs: any, hre: HardhatRuntimeEnvironment) => {
    await hre.run("schedule:validate");

    await hre.run("schedule:expand");

    await hre.run("allocation:write-all");

    const [merkleRootMainnet, merkleRootGC] = await hre.run(
      "checkpoint:generate",
    );

    const {
      safeToken: safeTokenAddress,
      vestingPool: vestingPoolAddress,
      omniMediatorMainnet: omniMediatorAddress,
      distroMainnet: distroMainnetAddress,
      distroGC: distroGCAddress,
    } = await getAddressConfig(hre);

    const { amountToClaim, amountToBridge } = await calculateAmountToBridge(
      loadSchedule(),
      hre,
    );

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
      amountToBridge,
      nextMerkleRoot: merkleRootMainnet,
    });

    const txGC = await createDistributeTxGC(safeSdkGC, {
      distroAddress: distroGCAddress,
      nextMerkleRoot: merkleRootGC,
    });

    // Post To Safes
    await propose(safeSdkMainnet, serviceClientMainnet, delegate, txMainnet);
    await propose(safeSdkGC, serviceClientGC, delegate, txGC);
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
