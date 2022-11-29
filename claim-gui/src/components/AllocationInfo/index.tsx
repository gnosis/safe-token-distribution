import { BigNumber } from "ethers";
import { useAccount } from "wagmi";
import clsx from "clsx";

import { useAllocation } from "../../utils/AllocationProvider";
import { useAmountClaimed } from "../../utils/hooks";
import Card from "../Card";

import classes from "./style.module.css";
import VestingInfo from "../VestingInfo";

const AllocationInfo: React.FC = () => {
  const { address } = useAccount();
  const allocation = useAllocation();
  const { amountClaimed } = useAmountClaimed(address);

  return (
    <Card>
      <VestingInfo />
      {allocation && (
        <div>
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

          {allocation.amount > amountClaimed && (
            <div className={clsx(classes.status, classes.available)}>
              You have SAFE tokens to claim
            </div>
          )}

          {allocation.amount === amountClaimed && (
            <div className={clsx(classes.status, classes.fullClaim)}>
              You've claimed all available SAFE tokens
            </div>
          )}

          {allocation.amount === BigNumber.from(0) && (
            <div className={clsx(classes.status, classes.notAvailable)}>
              You have no SAFE tokens to claim
            </div>
          )}
        </div>
      )}

      {address && !allocation && <p>{"No Allocation"}</p>}
    </Card>
  );
};

export default AllocationInfo;
