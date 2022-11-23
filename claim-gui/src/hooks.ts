import { BigNumber } from "ethers";
import { useContractRead } from "wagmi";
import merkleDistroContract from "./merkleDistroContract";

export function useAmountClaimed(account: string | undefined) {
  const result = useContractRead({
    address: merkleDistroContract.address,
    abi: merkleDistroContract.abi,
    functionName: "claimed",
    args: [account],
    enabled: !!account,
  });

  return {
    refetch: result.refetch,
    amountClaimed: result?.data || BigNumber.from(0),
  };
}

export function useMerkleRoot() {
  const result = useContractRead({
    address: merkleDistroContract.address,
    abi: merkleDistroContract.abi,
    functionName: "merkleRoot",
    args: [],
  });
  return result?.data || null;
}
