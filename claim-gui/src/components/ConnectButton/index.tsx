import { ConnectButton as RainbowConnect } from "@rainbow-me/rainbowkit";
import Blockie from "../Blockie";

import Button from "../Button";

import classes from "./style.module.css";

const ConnectButton = () => {
  return (
    <RainbowConnect.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <Button onClick={openConnectModal} type="button">
                    Connect Wallet
                  </Button>
                );
              }

              if (chain.unsupported) {
                return (
                  <Button onClick={openChainModal} type="button">
                    Wrong network
                  </Button>
                );
              }

              return (
                <div className={classes.connection}>
                  <Button
                    onClick={openChainModal}
                    className={classes.networkButton}
                    type="button"
                  >
                    {chain.hasIcon && chain.iconUrl && (
                      <img
                        alt={chain.name ?? "Chain icon"}
                        src={chain.iconUrl}
                      />
                    )}
                  </Button>

                  <Button
                    onClick={openAccountModal}
                    type="button"
                    className={classes.accountButton}
                  >
                    <Blockie
                      address={account.address}
                      className={classes.blockie}
                    />
                    {account.displayName}
                  </Button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </RainbowConnect.Custom>
  );
};

export default ConnectButton;
