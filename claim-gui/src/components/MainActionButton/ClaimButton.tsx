import { BigNumber } from "ethers";
import { useEffect, useState } from "react";

import { useTransaction, useWriteContract } from "wagmi";

import Button from "../Button";

import useDistroSetup from "../../hooks/useDistroSetup";
import MerkleDistroABI from "../../abis/MerkleDistro";

import classes from "./style.module.css";
import clsx from "clsx";

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

const ClaimStageMessages = [
  "",
  "Waiting for signature...",
  "Waiting for transaction...",
  "Tokens Claimed",
  "Transaction Rejected",
  "Transaction Error",
];

const ClaimButton: React.FC<Props> = ({ proof, amount }: Props) => {
  const { distroAddress } = useDistroSetup();
  const [claimStage, setClaimStage] = useState<ClaimStage>(ClaimStage.Idle);
  const { data: hash, writeContract } = useWriteContract();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | undefined;
    if (
      claimStage === ClaimStage.Error ||
      claimStage === ClaimStage.UserRejected
    ) {
      timeoutId = setTimeout(() => setClaimStage(ClaimStage.Idle), 3000);
    }
    return () => {
      clearTimeout(timeoutId);
    };
  }, [claimStage]);

  const { status } = useTransaction({
    hash: hash,
  });

  useEffect(() => {
    if (status === "error") {
      setClaimStage(ClaimStage.Error);
    } else if (status === "success") {
      setClaimStage(ClaimStage.Success);
    }
  }, [status]);

  useEffect(() => {
    if (claimStage === ClaimStage.Signing && hash) {
      setClaimStage(ClaimStage.Transacting);
    }
  }, [claimStage, hash]);

  return (
    <div className={classes.claimContainer}>
      <Button
        primary
        onClick={() => {
          if (claimStage === ClaimStage.Idle) {
            writeContract({
              address: distroAddress,
              abi: MerkleDistroABI,
              functionName: "claim",
              args: [proof, amount.toBigInt()],
            });
            setClaimStage(ClaimStage.Signing);
          }
        }}
      >
        Claim
      </Button>
      {claimStage !== ClaimStage.Idle && (
        <div
          className={clsx(
            classes.statusContainer,
            classes[ClaimStage[claimStage]],
          )}
        >
          <p>{ClaimStageMessages[claimStage]}</p>
        </div>
      )}
    </div>
  );
};

export default ClaimButton;
