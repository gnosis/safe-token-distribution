import { useAccount, useDisconnect } from "wagmi";

import { useAllocation } from "../../utils/AllocationProvider";
import ClaimButton from "./ClaimButton";
import { useAmountClaimed } from "../../utils/hooks";
import Card from "../Card";
import Button from "../Button";
import ConnectModal from "../ConnectModal";
import { useEffect, useState } from "react";

const MainActionButton: React.FC = () => {
  const { address } = useAccount();
  const allocation = useAllocation();
  const { refetch, amountClaimed } = useAmountClaimed(address);
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
          {allocation &&
          allocation.amount.toNumber() > amountClaimed.toNumber() ? (
            <ClaimButton
              {...allocation}
              onSuccess={() => {
                refetch?.(address);
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
