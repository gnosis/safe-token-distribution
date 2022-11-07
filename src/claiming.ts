import { VESTING_CONTRACT } from "./constants";
import { Provider } from "@ethersproject/providers";
import { SafeTransactionDataPartial } from "@gnosis.pm/safe-core-sdk-types";
import assert from "assert";
import { Contract, BigNumber, BigNumberish } from "ethers";

export async function encodeClaim(
  vestingContract: string,
  vestingId: string,
  vestingBeneficiary: string,
  tokensToClaim: BigNumberish,
): Promise<SafeTransactionDataPartial> {
  const vesting = new Contract(vestingContract, VESTING_CONTRACT.abi);

  const { data } = await vesting.populateTransaction.claimVestedTokens(
    vestingId,
    vestingBeneficiary,
    tokensToClaim,
  );

  assert(data);

  return {
    to: vestingContract,
    data,
    value: "0",
  };
}

export async function queryTokensToClaim(
  vestingContract: string,
  vestingId: string,
  provider: Provider,
): Promise<BigNumber> {
  const vesting = new Contract(vestingContract, VESTING_CONTRACT.abi, provider);

  const {
    vestedAmount,
    claimedAmount,
  }: { vestedAmount: BigNumber; claimedAmount: BigNumber } =
    await vesting.calculateVestedAmount(vestingId);

  return vestedAmount.sub(claimedAmount);
}
