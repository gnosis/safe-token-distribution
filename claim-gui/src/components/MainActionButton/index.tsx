import { useAccount } from "wagmi";

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
  const { refetch } = useAmountClaimed(address);
  const [showModal, setShowModal] = useState(false);

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
          {allocation && (
            <ClaimButton
              {...allocation}
              onSuccess={() => {
                alert(`Claimed ${allocation.amount}`);
                refetch?.(address);
              }}
              onError={(err) => {
                alert(`Error ${err}`);
              }}
            />
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
