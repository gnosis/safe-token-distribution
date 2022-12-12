import { BigNumber } from "ethers";
import { useEffect, useState } from "react";

import {
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction,
} from "wagmi";

import Button from "../Button";

import useDistroSetup from "../../hooks/useDistroSetup";
import MerkleDistroABI from "../../abis/MerkleDistro";

import classes from "./style.module.css";

type Props = {
  proof: readonly `0x${string}`[];
  amount: BigNumber;
};

export enum ClaimStage {
  Idle,
  Signing,
  Transacting,
  Success,
  UserRejected,
  Error,
}

const ClaimButton: React.FC<Props> = ({ proof, amount }: Props) => {
  const { isDistroEnabled, distroAddress } = useDistroSetup();
  const [isSigning, setIsSigning] = useState<boolean>(false);
  const [claimStage, setClaimStage] = useState<ClaimStage>(ClaimStage.Idle);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | undefined;
    if (
      claimStage === ClaimStage.Error ||
      claimStage === ClaimStage.UserRejected ||
      claimStage === ClaimStage.Success
    ) {
      timeoutId = setTimeout(() => setClaimStage(ClaimStage.Idle), 3000);
    }
    return () => {
      clearTimeout(timeoutId);
    };
  }, [claimStage]);
  const { config } = usePrepareContractWrite({
    address: distroAddress,
    abi: MerkleDistroABI,
    functionName: "claim",
    args: [proof, amount],
    enabled: isDistroEnabled,
  });

  const { data, write } = useContractWrite({
    ...config,
    onError(err: any) {
      setClaimStage(
        err.code === "ACTION_REJECTED"
          ? ClaimStage.UserRejected
          : ClaimStage.Error,
      );
    },
  });

  useWaitForTransaction({
    hash: data?.hash,
    confirmations: 1,
    onSuccess() {
      setClaimStage(ClaimStage.Success);
    },
    onError(err) {
      setClaimStage(ClaimStage.Error);
    },
  });

  useEffect(() => {
    if (isSigning && !!data?.hash) {
      setIsSigning(false);
      setClaimStage(ClaimStage.Transacting);
    }
  }, [isSigning, data?.hash]);

  return (
    <div className={classes.claimContainer}>
      <Button
        primary
        onClick={() => {
          setIsSigning(true);
          write?.();
          setClaimStage(ClaimStage.Signing);
        }}
      >
        Claim
      </Button>
      {claimStage !== ClaimStage.Idle && (
        <div className={classes.statusContainer}>
          <p>{claimStage}</p>
        </div>
      )}
    </div>
  );
};

export default ClaimButton;
