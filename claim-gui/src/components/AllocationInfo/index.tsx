import { BigNumber } from "ethers";
import { useAccount } from "wagmi";
import clsx from "clsx";

import { useAllocation } from "../../utils/AllocationProvider";
import { useAmountClaimed } from "../../utils/hooks";
import Card from "../Card";

import classes from "./style.module.css";
import VestingInfo from "../VestingInfo";
import SafeTag from "../SafeTag";

const AllocationInfo: React.FC = () => {
  const { address } = useAccount();
  const allocation = useAllocation();
  const { amountClaimed } = useAmountClaimed(address);

  return (
    <Card>
      <VestingInfo />
      <div className={classes.allocation}>
        <dl className={classes.container}>
          <div className={classes.item}>
            <dt className={classes.label}>Claimed</dt>
            <dd className={classes.data}>{amountClaimed.toString()}</dd>
          </div>
          <div className={classes.item}>
            <dt className={classes.label}>Allocated</dt>
            <dd className={classes.data}>
              {allocation ? allocation.amount.toString() : "0"}
            </dd>
          </div>
        </dl>

        {allocation && allocation.amount > amountClaimed && (
          <div className={clsx(classes.status, classes.available)}>
            <p>
              You have <SafeTag /> tokens to claim
            </p>
          </div>
        )}

        {allocation && allocation.amount === amountClaimed && (
          <div className={clsx(classes.status, classes.fullClaim)}>
            <p>
              You've claimed all available <SafeTag /> tokens
            </p>
          </div>
        )}

        {!allocation && address && (
          <div className={clsx(classes.status, classes.notAvailable)}>
            <p>
              You have no <SafeTag /> tokens to claim
            </p>
          </div>
        )}

        {!address && (
          <div className={clsx(classes.status, classes.available)}>
            <p>
              You have <SafeTag /> tokens to claim
            </p>
          </div>
        )}

        {!address && (
          <div className={classes.obscure}>
            <p>Connect a wallet to view your claim.</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default AllocationInfo;
