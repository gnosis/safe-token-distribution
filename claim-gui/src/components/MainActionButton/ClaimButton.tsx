import { BigNumber } from "ethers";

import {
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction,
} from "wagmi";

import merkleDistroContract from "../../utils/merkleDistroContract";
import Button from "../Button";

type Props = {
  proof: string[];
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
  const { config } = usePrepareContractWrite({
    address: merkleDistroContract.address,
    abi: merkleDistroContract.abi,
    functionName: "claim",
    args: [proof, amount],
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
    confirmations: process.env.NODE_ENV === "development" ? 0 : 1,
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
