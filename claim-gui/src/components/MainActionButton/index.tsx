import { useEffect, useState } from "react";
import { useAccount, useDisconnect } from "wagmi";

import useAllocation from "../../hooks/useAllocation";
import useAmountClaimed from "../../hooks/useAmountClaimed";

import Button from "../Button";
import ConnectModal from "../ConnectModal";
import Card from "../Card";
import ClaimButton from "./ClaimButton";
import { BigNumber } from "ethers";

const Zero = BigNumber.from(0);

const MainActionButton: React.FC = () => {
  const { address } = useAccount();
  const allocation = useAllocation();
  const { disconnect } = useDisconnect();

  const amountClaimed = useAmountClaimed(address);
  const amountAllocated = allocation?.amount || Zero;
  const amountAvailable = amountAllocated.gt(amountClaimed)
    ? amountAllocated.sub(amountClaimed)
    : Zero;
  const amountAvailableRaw = amountAvailable.toString();

  const [showModal, setShowModal] = useState(false);
  const [showAction, setShowAction] = useState(amountAvailable.gt(0));

  useEffect(() => {
    if (address) {
      setShowModal(false);
    }
  }, [address]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | undefined;
    if (BigNumber.from(amountAvailableRaw).eq(0)) {
      timeoutId = setTimeout(() => setShowAction(false), 5000);
    }

    if (BigNumber.from(amountAvailableRaw).gt(0)) {
      setShowAction(true);
    }

    return () => {
      clearTimeout(timeoutId);
    };
  }, [amountAvailableRaw]);

  return (
    <Card>
      {showModal && <ConnectModal />}
      {address ? (
        <>
          {showAction && !!allocation ? (
            <ClaimButton proof={allocation.proof} amount={allocation.amount} />
          ) : (
            <Button primary onClick={() => disconnect()}>
              Disconnect
            </Button>
          )}
        </>
      ) : (
        <>
          <Button primary onClick={() => setShowModal(true)}>
            Connect
          </Button>
        </>
      )}
    </Card>
  );
};

export default MainActionButton;
