import { useAccount } from "wagmi";

import { useAllocation } from "../../AllocationProvider";
import ClaimButton from "./ClaimButton";
import { useAmountClaimed } from "../../hooks";
import Card from "../Card";

const MainActionButton: React.FC = () => {
  const { address } = useAccount();
  const allocation = useAllocation();
  const {refetch} = useAmountClaimed(address)

  return (
    <Card>
      {address && allocation && (
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
    </Card>
  );
};

export default MainActionButton;
