import { BigNumber, Signer } from "ethers";
import { isAddress, isHexString } from "ethers/lib/utils";

import Safe from "@safe-global/protocol-kit";
import SafeServiceClient from "@safe-global/api-kit";
import { SafeTransaction } from "@safe-global/safe-core-sdk-types";

import { subtask, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import {
  createDistributeTxGC,
  createDistributeTxMainnet,
} from "../fns/createDistributeTx";

import { addresses, getClients, VESTING_ID } from "../config";
import { isBigNumberish } from "@ethersproject/bignumber/lib/bignumber";

type TaskArgs = {
  distroAddressMainnet: string;
  distroAddressGnosis: string;
  merkleRootMainnet: string;
  merkleRootGnosis: string;
  amountToClaim: BigNumber;
  amountToFundMainnet: BigNumber;
  amountToFundGnosis: BigNumber;
};

subtask(
  "propose",
  "Updates the distribution setup, by unlocking tokens and uploading new proofs to the distribution contracts",
)
  .addParam("distroAddressMainnet", "", undefined, types.string)
  .addParam("distroAddressGnosis", "", undefined, types.string)
  .addParam("merkleRootMainnet", "", undefined, types.string)
  .addParam("merkleRootGnosis", "", undefined, types.string)
  .addParam("amountToClaim", "", undefined, types.any)
  .addParam("amountToFundMainnet", "", undefined, types.any)
  .addParam("amountToFundGnosis", "", undefined, types.any)
  .setAction(async (taskArgs: TaskArgs, hre: HardhatRuntimeEnvironment) => {
    const {
      distroAddressMainnet,
      distroAddressGnosis,
      merkleRootMainnet,
      merkleRootGnosis,
      amountToClaim,
      amountToFundMainnet,
      amountToFundGnosis,
    } = validateTaskArgs(taskArgs);

    const {
      delegate,
      safeMainnet,
      safeGnosis,
      serviceClientMainnet,
      serviceClientGnosis,
    } = await getClients(
      addresses.mainnet.treasurySafe,
      addresses.gnosis.treasurySafe,
      hre,
    );

    const txMainnet = await createDistributeTxMainnet(safeMainnet, addresses, {
      distroAddressMainnet,
      distroAddressGnosis,
      vestingId: VESTING_ID,
      amountToClaim,
      amountToFund: amountToFundMainnet,
      amountToBridge: amountToFundGnosis,
      nextMerkleRoot: merkleRootMainnet,
    });

    const txGC = await createDistributeTxGC(
      safeGnosis,
      distroAddressGnosis,
      merkleRootGnosis,
    );

    await Promise.all([
      propose(safeMainnet, serviceClientMainnet, delegate, txMainnet),
      propose(safeGnosis, serviceClientGnosis, delegate, txGC),
    ]);
  });

async function propose(
  safe: Safe,
  client: SafeServiceClient,
  delegate: Signer,
  tx: SafeTransaction,
) {
  const safeTxHash = await safe.getTransactionHash(tx);
  const senderSignature = await safe.signTransactionHash(safeTxHash);
  const senderAddress = await delegate.getAddress();

  await client.proposeTransaction({
    safeAddress: await safe.getAddress(),
    safeTransactionData: tx.data,
    safeTxHash,
    senderAddress,
    senderSignature: senderSignature.data,
  });
}

function validateTaskArgs(taskArgs: TaskArgs): TaskArgs {
  const {
    distroAddressMainnet,
    distroAddressGnosis,
    merkleRootMainnet,
    merkleRootGnosis,
    amountToClaim,
    amountToFundMainnet,
    amountToFundGnosis,
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

  if (!isBigNumberish(amountToClaim)) {
    throw new Error("Arg amountToClaim, is not a BigNumber");
  }

  if (!isBigNumberish(amountToFundMainnet)) {
    throw new Error("Arg amountToFundMainnet, is not a BigNumber");
  }

  if (!isBigNumberish(amountToFundGnosis)) {
    throw new Error("Arg amountToFundGnosis, is not a BigNumber");
  }

  if (
    !BigNumber.from(amountToClaim).eq(
      BigNumber.from(amountToFundMainnet).add(amountToFundGnosis),
    )
  ) {
    throw new Error("Funding amounts don't add up to claim amount");
  }

  return {
    distroAddressMainnet,
    distroAddressGnosis,
    merkleRootMainnet,
    merkleRootGnosis,
    amountToClaim: BigNumber.from(amountToClaim),
    amountToFundMainnet: BigNumber.from(amountToFundMainnet),
    amountToFundGnosis: BigNumber.from(amountToFundGnosis),
  };
}

function isHexBytes32(s: string) {
  return isHexString(s) && s.length === 66;
}
