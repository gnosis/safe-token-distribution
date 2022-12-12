import { useEffect, useState } from "react";
import { useAccount, useDisconnect } from "wagmi";

import { useAllocation } from "../../hooks/AllocationProvider";

import useAmountClaimed from "../../hooks/useAmountClaimed";
import ClaimButton from "./ClaimButton";
import Card from "../Card";
import Button from "../Button";
import ConnectModal from "../ConnectModal";

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
            <ClaimButton
              {...allocation}
              onSuccess={() => {
                console.info("success");
              }}
              onError={(err) => {
                console.log(err);
              }}
            />
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
