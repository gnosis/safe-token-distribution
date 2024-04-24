import { useEffect, useRef, useState } from "react";
import useOnClickOutside from "use-onclickoutside";
import copy from "copy-to-clipboard";
import { useAccount, useDisconnect, useChainId, useChains } from "wagmi";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import Identicon from "../Identicon";
import Button from "../Button";
import classes from "./style.module.css";
import IconButton, { IconLinkButton } from "../IconButton";

export const shortenAddress = (address: string): string => {
  const VISIBLE_START = 4;
  const VISIBLE_END = 4;
  const start = address.substring(0, VISIBLE_START + 2);
  const end = address.substring(42 - VISIBLE_END, 42);
  return `${start}...${end}`;
};

const ConnectButton: React.FC = () => {
  const chainId = useChainId();
  const chains = useChains();
  const chain = chains.find((c) => c.id === chainId);
  const { address, isConnected, connector } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useWeb3Modal();
  const [showDropdown, setShowDropdown] = useState(false);
  const ref = useRef(null);
  useOnClickOutside(ref, () => setShowDropdown(false));

  return (
    <>
      <div className={classes.container}>
        <button
          className={classes.button}
          onClick={() => setShowDropdown(true)}
        >
          <div className={classes.identiconWrapper}>
            <Identicon />
            <img
              className={classes.arrow}
              alt="Identicon arrow"
              src="/arrow.svg"
              height={12}
              width={12}
            />
          </div>
        </button>

        {showDropdown && (
          <div className={classes.dropdown} ref={ref}>
            {isConnected ? (
              <>
                <div className={classes.dropdownAccountDetails}>
                  <div className={classes.row}>
                    <Identicon large />
                  </div>
                  {address && (
                    <div className={classes.dropdownAddress}>
                      <div className={classes.address}>
                        {shortenAddress(address)}
                      </div>
                      <IconButton
                        onClick={() => {
                          copy(address);
                        }}
                        icon="copy"
                        title="Copy to clipboard"
                      />
                    </div>
                  )}
                </div>
                <div className={classes.dropdownDivider} />
                <div className={classes.dropdownSplitRow}>
                  Status
                  <div className={classes.dropdownListFlex}>
                    <div className={classes.dropdownConnectedJewel} />
                    <strong>Connected</strong>
                  </div>
                </div>
                <div className={classes.dropdownDivider} />
                <div className={classes.dropdownSplitRow}>
                  Network
                  <div className={classes.dropdownListFlex}>
                    <div className={classes.dropdownNetworkJewel} />
                    {chain?.name || "Unsupported network"}
                  </div>
                </div>
                {connector?.id !== "gnosisSafe" && (
                  <>
                    <div className={classes.dropdownDivider} />
                    <div className={classes.row}>
                      <Button
                        className={classes.dropdownButton}
                        primary
                        onClick={() => {
                          disconnect();
                          setShowDropdown(false);
                        }}
                      >
                        Disconnect
                      </Button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className={classes.wrapper}>
                Connect a Wallet
                <div className={classes.marginTop}>
                  <Identicon large />
                </div>
                <div className={classes.marginTop}>
                  <Button
                    className={classes.dropdownButton}
                    primary
                    onClick={() => open()}
                  >
                    Connect wallet
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default ConnectButton;
