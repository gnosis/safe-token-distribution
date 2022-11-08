import { MerkleDistro } from "../typechain";
import { SafeToken, VestingPool } from "../typechain/contracts/typings";
import Safe from "@gnosis.pm/safe-core-sdk";
import { SafeTransactionDataPartial } from "@gnosis.pm/safe-core-sdk-types";
import assert from "assert";
import { BigNumber, BigNumberish } from "ethers";

export default async function createClaimTransaction(
  safeSdk: Safe,
  contracts: {
    safeToken: SafeToken;
    vestingPool: VestingPool;
    merkleDistro: MerkleDistro;
  },
  args: {
    vestingId: string;
    amountToClaim: BigNumberish;
    nextMerkleRoot: string;
  },
) {
  const { vestingPool, merkleDistro, safeToken } = contracts;
  const { vestingId, amountToClaim, nextMerkleRoot } = args;
  const beneficiary = await safeSdk.getAddress();

  // encodes as multisend
  return safeSdk.createTransaction({
    safeTransactionData: [
      await encodeClaim(vestingPool, vestingId, beneficiary, amountToClaim),
      await encodeTransfer(safeToken, merkleDistro, amountToClaim),
      await encodeSetMerkleRoot(merkleDistro, nextMerkleRoot),
    ],
  });
}

export async function encodeClaim(
  vestingPool: VestingPool,
  id: string,
  beneficiary: string,
  amountToClaim: BigNumberish,
): Promise<SafeTransactionDataPartial> {
  const { data } = await vestingPool.populateTransaction.claimVestedTokens(
    id,
    beneficiary,
    amountToClaim,
  );

  assert(data);

  return {
    to: vestingPool.address,
    data,
    value: "0",
  };
}

export async function encodeTransfer(
  safeToken: SafeToken,
  merkleDistro: MerkleDistro,
  amount: BigNumberish,
): Promise<SafeTransactionDataPartial> {
  const { data } = await safeToken.populateTransaction.transfer(
    merkleDistro.address,
    amount,
  );

  assert(data);

  return {
    to: safeToken.address,
    data,
    value: "0",
  };
}

export async function encodeSetMerkleRoot(
  merkleDistro: MerkleDistro,
  nextMerkleRoot: string,
): Promise<SafeTransactionDataPartial> {
  const { data } = await merkleDistro.populateTransaction.setMerkleRoot(
    nextMerkleRoot,
  );

  assert(data);

  return {
    to: merkleDistro.address,
    data,
    value: "0",
  };
}

export async function queryAmountToClaim(
  vestingPool: VestingPool,
  vestingId: string,
): Promise<BigNumber> {
  const {
    vestedAmount,
    claimedAmount,
  }: { vestedAmount: BigNumber; claimedAmount: BigNumber } =
    await vestingPool.calculateVestedAmount(vestingId);

  return vestedAmount.sub(claimedAmount);
}
