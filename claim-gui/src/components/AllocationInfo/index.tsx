import { useAccount } from "wagmi";

import { useAllocation } from "../../AllocationProvider";
import { useAmountClaimed } from "../../hooks";
import Card from "../Card";

import classes from "./style.module.css";

const AllocationInfo: React.FC = () => {
  const { address } = useAccount();
  const allocation = useAllocation();
  const { amountClaimed } = useAmountClaimed(address);
  return (
    <Card>
      {allocation && (
        <dl className={classes.container}>
          <div className={classes.item}>
            <dt className={classes.label}>Claimed</dt>
            <dd className={classes.data}>{amountClaimed.toString()}</dd>
          </div>
          <div className={classes.item}>
            <dt className={classes.label}>Allocated</dt>
            <dd className={classes.data}>{allocation.amount.toString()}</dd>
          </div>
        </dl>
      )}

      {address && !allocation && <p>{"No Allocation"}</p>}
    </Card>
  );
};

export default AllocationInfo;
