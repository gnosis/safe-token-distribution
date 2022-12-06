import { useAccount } from "wagmi";
import clsx from "clsx";

import { useAllocation } from "../../utils/AllocationProvider";
import { useAmountClaimed } from "../../utils/hooks";
import Card from "../Card";

import classes from "./style.module.css";
import VestingInfo from "../VestingInfo";
import SafeTag from "../SafeTag";
import Identicon from "../Identicon";
import { shortenAddress } from "../ConnectButton";
import { useMemo } from "react";
import makeBlockie from "ethereum-blockies-base64";

const AllocationInfo: React.FC<{ paused: boolean }> = ({ paused }) => {
  const { address } = useAccount();
  const allocation = useAllocation();
  const { amountClaimed } = useAmountClaimed(address);

  const unloadedAddress = "0x0000000000000000000000000000000000000000";
  const blockie = useMemo(
    () => (address ? makeBlockie(address) : makeBlockie(unloadedAddress)),
    [address],
  );

  return (
    <Card>
      <VestingInfo />
      <div className={classes.allocation}>
        <div className={classes.addressLabel}>
          <img src={blockie} alt={address || unloadedAddress} />
          <p>{shortenAddress(address || unloadedAddress)}</p>
        </div>
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

        {allocation &&
          allocation.amount.toNumber() > amountClaimed.toNumber() && (
            <div className={clsx(classes.status, classes.available)}>
              <p>
                You have <SafeTag /> tokens to claim
              </p>
            </div>
          )}

        {allocation &&
          allocation.amount.toNumber() === amountClaimed.toNumber() && (
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

        {!address && !paused && (
          <div className={classes.obscure}>
            <p>Connect a wallet to view your claim.</p>
          </div>
        )}

        {paused && (
          <div className={classes.obscure}>
            <p>
              <SafeTag /> tokens cannot be transferred yet.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default AllocationInfo;
