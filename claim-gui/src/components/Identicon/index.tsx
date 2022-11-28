import { useAccount } from "wagmi";
import makeBlockie from "ethereum-blockies-base64";
import clsx from "clsx";
import classes from "./style.module.css";
import { useMemo } from "react";

type Props = {
  large?: boolean;
};

const Identicon: React.FC<Props> = ({ large }) => {
  const { address } = useAccount();

  const blockie = useMemo(() => address && makeBlockie(address), [address]);

  const size = large ? { width: 60, height: 60 } : { width: 36, height: 36 };

  return (
    <div className={clsx(classes.identicon, large && classes.isLarge)}>
      {blockie && <img src={blockie} alt={address} {...size} />}
      {!blockie && (
        <img
          src="/identicon.svg"
          alt="Identicon keyhole"
          height={large ? 24 : 16}
          width={large ? 24 : 16}
        />
      )}
      <div
        className={clsx(
          classes.statusJewel,
          address && classes.isConnected,
          large && classes.isLarge,
        )}
      />
    </div>
  );
};

export default Identicon;
