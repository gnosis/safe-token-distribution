import { useEffect, useState } from "react";
import { useAccount, useDisconnect } from "wagmi";

import useAllocation from "../../hooks/useAllocation";
import useAmountClaimed from "../../hooks/useAmountClaimed";

import Button from "../Button";
import ConnectModal from "../ConnectModal";
import Card from "../Card";
import ClaimButton from "./ClaimButton";

const MainActionButton: React.FC = () => {
  const { address } = useAccount();
  const allocation = useAllocation();
  const amountClaimed = useAmountClaimed(address);
  const [showModal, setShowModal] = useState(false);
  const { disconnect } = useDisconnect();

  useEffect(() => {
    if (address) {
      setShowModal(false);
    }
  }, [address]);

  return (
    <Card>
      {showModal && <ConnectModal />}
      {address ? (
        <>
          {allocation && allocation.amount.gt(amountClaimed) ? (
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
