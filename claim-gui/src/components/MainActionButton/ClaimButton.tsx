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
  const { isDistroEnabled, distroAddress } = useDistroSetup();
  const [claimStage, setClaimStage] = useState<ClaimStage>(ClaimStage.Idle);

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
    if (claimStage === ClaimStage.Signing && !!data?.hash) {
      setClaimStage(ClaimStage.Transacting);
    }
  }, [claimStage, data?.hash]);

  return (
    <div className={classes.claimContainer}>
      <Button
        primary
        onClick={() => {
          if (claimStage === ClaimStage.Idle) {
            write?.();
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
