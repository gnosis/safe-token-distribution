import { useConnect } from "wagmi";
import Modal from "react-modal";
import classes from "./style.module.css";

const ConnectModal: React.FC = () => {
  const { connect, connectors, error } = useConnect();
  return (
    <Modal isOpen className={classes.container} ariaHideApp={false}>
      <h2 className={classes.h2}>Select a Wallet</h2>
      <p className={classes.textSmall}>
        Please select a wallet to connect to lock your GNO.
      </p>
      {connectors.map((connector) => (
        <button
          className={classes.wallet}
          disabled={!connector.ready}
          key={connector.id}
          onClick={() => {
            connect({ connector });
          }}
        >
          <img
            src={`/connectors/${connector.name
              .split(" ")[0]
              .toLowerCase()}.svg`}
            alt={`${connector.name}`}
            height={32}
            width={32}
          />
          <strong className={classes.walletLabel}>{connector.name}</strong>
        </button>
      ))}

      {error && <div>{error?.message ?? "Failed to connect"}</div>}
    </Modal>
  );
};

export default ConnectModal;
