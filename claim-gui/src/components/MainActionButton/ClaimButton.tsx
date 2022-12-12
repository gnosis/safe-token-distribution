import { BigNumber } from "ethers";
import {
  useContractWrite,
  useNetwork,
  usePrepareContractWrite,
  useWaitForTransaction,
} from "wagmi";

import Button from "../Button";

import MerkleDistroABI from "../../abis/MerkleDistro";
import { distroSetup } from "../../config";

type Props = {
  proof: readonly `0x${string}`[];
  amount: BigNumber;
  onStart?: () => void;
  onSuccess?: () => void;
  onError?: (e: Error) => void;
};

const ClaimButton: React.FC<Props> = ({
  proof,
  amount,
  onStart,
  onSuccess,
  onError,
}: Props) => {
  const network = useNetwork();
  const { isDistroEnabled, distroAddress } = distroSetup(network);

  const { config } = usePrepareContractWrite({
    address: distroAddress,
    abi: MerkleDistroABI,
    functionName: "claim",
    args: [proof, amount],
    enabled: isDistroEnabled,
  });

  const { data, write } = useContractWrite({
    ...config,
    onError(err) {
      console.error(err);
    },
  });

  useWaitForTransaction({
    hash: data?.hash,
    // should wait when connected to a testnet
    confirmations: 1,
    onSuccess(data) {
      onSuccess?.();
    },
    onError(err) {
      onError?.(err);
    },
  });

  return (
    <Button
      primary
      onClick={() => {
        onStart?.();
        write?.();
      }}
    >
      Claim
    </Button>
  );
};

export default ClaimButton;
