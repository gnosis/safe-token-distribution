import { useMemo } from "react";
import clsx from "clsx";
import { constants } from "ethers";
import { useAccount } from "wagmi";
import makeBlockie from "ethereum-blockies-base64";

import { useAllocation } from "../../hooks/AllocationProvider";
import useAmountClaimed from "../../hooks/useAmountClaimed";
import Card from "../Card";

import classes from "./style.module.css";
import VestingInfo from "../VestingInfo";
import SafeTag from "../SafeTag";
import { shortenAddress } from "../ConnectButton";
import { BNtoFloat } from "../../utils";

const AllocationInfo: React.FC<{ isDistroEnabled: boolean }> = ({
  isDistroEnabled,
}) => {
  const { address } = useAccount();

  const allocation = useAllocation();
  const amountClaimed = useAmountClaimed(address);

  const unloadedAddress = constants.AddressZero;
  const blockie = useMemo(
    () => (address ? makeBlockie(address) : makeBlockie(unloadedAddress)),
    [address, unloadedAddress],
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
            <dd className={classes.data}>
              {BNtoFloat(amountClaimed, 18).toLocaleString()}
            </dd>
          </div>
          <div className={classes.item}>
            <dt className={classes.label}>Available</dt>
            <dd className={classes.data}>
              {allocation
                ? BNtoFloat(
                    allocation.amount.sub(amountClaimed),
                    18,
                  ).toLocaleString()
                : "0"}
            </dd>
          </div>
        </dl>

        {allocation && allocation.amount.gt(amountClaimed) && (
          <div className={clsx(classes.status, classes.available)}>
            <p>
              You have <SafeTag /> tokens to claim
            </p>
          </div>
        )}

        {allocation && allocation.amount.eq(amountClaimed) && (
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

        {!address && isDistroEnabled && (
          <div className={classes.obscure}>
            <p>Connect a wallet to view your claim.</p>
          </div>
        )}

        {!isDistroEnabled && (
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
