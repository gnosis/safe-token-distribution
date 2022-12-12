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
import { useEffect, useState } from "react";

type Props = {
  proof: readonly `0x${string}`[];
  amount: BigNumber;
  onProgress?: (next: ClaimStage) => void;
};

export enum ClaimStage {
  Idle,
  Signing,
  Transacting,
  Success,
  Error,
}

const ClaimButton: React.FC<Props> = ({ proof, amount, onProgress }: Props) => {
  const network = useNetwork();
  const { isDistroEnabled, distroAddress } = distroSetup(network);
  const [isSigning, setIsSigning] = useState<boolean>(false);

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
      onProgress?.(ClaimStage.Error);
    },
  });

  useWaitForTransaction({
    hash: data?.hash,
    confirmations: 1,
    onSuccess() {
      onProgress?.(ClaimStage.Success);
    },
    onError() {
      onProgress?.(ClaimStage.Error);
    },
  });

  useEffect(() => {
    if (isSigning && !!data?.hash) {
      setIsSigning(false);
      onProgress?.(ClaimStage.Transacting);
    }
  }, [isSigning, data?.hash, onProgress]);

  return (
    <Button
      primary
      onClick={() => {
        setIsSigning(true);
        write?.();
        onProgress?.(ClaimStage.Signing);
      }}
    >
      Claim
    </Button>
  );
};

export default ClaimButton;
