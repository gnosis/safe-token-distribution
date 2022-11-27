import hre from "hardhat";

import SafeServiceClient from "@gnosis.pm/safe-service-client";
import EthersAdapter from "@gnosis.pm/safe-ethers-lib";
import Safe from "@gnosis.pm/safe-core-sdk";
import { BigNumberish } from "ethers";
import { SafeTransactionDataPartial } from "@gnosis.pm/safe-core-sdk-types";
import { ERC20__factory } from "../typechain";
import { parseUnits } from "ethers/lib/utils";

export async function addDelegate() {
  const [owner, delegate] = await hre.ethers.getSigners();

  const safeAddress = "0x6FF8D97548058759FF8E4dacfD67Dd8229890eEE";

  const ethAdapter = new EthersAdapter({
    ethers: hre.ethers,
    signerOrProvider: owner,
  });

  const serviceClient = new SafeServiceClient({
    txServiceUrl: "https://safe-transaction-goerli.safe.global/",
    ethAdapter,
  });

  await serviceClient.addSafeDelegate({
    safe: safeAddress,
    delegate: delegate.address,
    label: "A TEST DEL",
    signer: owner,
  });
}

export async function listDelegates() {
  const [signer] = await hre.ethers.getSigners();

  const safeAddress = "0x6FF8D97548058759FF8E4dacfD67Dd8229890eEE";

  const ethAdapter = new EthersAdapter({
    ethers: hre.ethers,
    signerOrProvider: signer,
  });

  const serviceClient = new SafeServiceClient({
    txServiceUrl: "https://safe-transaction-goerli.safe.global/",
    ethAdapter,
  });

  const result = await serviceClient.getSafeDelegates(safeAddress);

  console.log(result);
}

export async function proposeTransaction() {
  const [_, delegate] = await hre.ethers.getSigners();

  const safeAddress = "0x6FF8D97548058759FF8E4dacfD67Dd8229890eEE";

  const ethAdapter = new EthersAdapter({
    ethers: hre.ethers,
    signerOrProvider: delegate,
  });

  const serviceClient = new SafeServiceClient({
    txServiceUrl: "https://safe-transaction-goerli.safe.global/",
    ethAdapter,
  });

  const safeSdk = await Safe.create({
    ethAdapter: new EthersAdapter({
      ethers: hre.ethers,
      signerOrProvider: delegate,
    }),
    safeAddress,
  });

  const safeTransaction = await safeSdk.createTransaction({
    safeTransactionData: encodeTransfer(
      "0xdc31Ee1784292379Fbb2964b3B9C4124D8F89C60",
      delegate.address,
      parseUnits("1000", 18),
    ),
  });

  const safeTxHash = await safeSdk.getTransactionHash(safeTransaction);
  const senderSignature = await safeSdk.signTransactionHash(safeTxHash);

  await serviceClient.proposeTransaction({
    safeAddress,
    safeTransactionData: safeTransaction.data,
    safeTxHash,
    senderAddress: delegate.address,
    senderSignature: senderSignature.data,
  });
}

function encodeTransfer(
  tokenAddress: string,
  beneficiaryAddress: string,
  amount: BigNumberish,
): SafeTransactionDataPartial {
  const iface = ERC20__factory.createInterface();

  const data = iface.encodeFunctionData("transfer", [
    beneficiaryAddress,
    amount,
  ]);

  return {
    to: tokenAddress,
    data,
    value: "0",
  };
}

// listDelegates();
// addDelegate();
//proposeTransaction();
