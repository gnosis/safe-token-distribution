import { BigNumber, constants } from "ethers";
import { useContractRead, useNetwork } from "wagmi";

import { distroSetup } from "../config";

import MerkleDistroABI from "../abis/MerkleDistro";

export default function useAmountClaimed(account: `0x${string}` | undefined) {
  const network = useNetwork();
  const { isDistroEnabled, distroAddress } = distroSetup(network);

  const isEnabled = isDistroEnabled && !!account;
  account = account || constants.AddressZero;

  const result = useContractRead({
    address: distroAddress,
    abi: MerkleDistroABI,
    functionName: "claimed",
    args: [account],
    enabled: isEnabled,
    watch: true,
  });

  return (result?.data as BigNumber) || BigNumber.from(0);
}
