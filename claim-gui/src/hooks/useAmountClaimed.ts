import { BigNumber, constants } from "ethers";
import { useReadContract } from "wagmi";

import useDistroSetup from "./useDistroSetup";

import MerkleDistroABI from "../abis/MerkleDistro";

export default function useAmountClaimed(account: `0x${string}` | undefined) {
  const { distroAddress } = useDistroSetup();

  account = account || constants.AddressZero;

  const result = useReadContract({
    address: distroAddress,
    abi: MerkleDistroABI,
    functionName: "claimed",
    args: [account],
  });

  return result?.data ? BigNumber.from(result.data) : BigNumber.from(0);
}
