import { useConnect } from "wagmi";
import Modal from "react-modal";
import classes from "./style.module.css";

interface Props {
  show: boolean;
  setShow: (show: boolean) => void;
}

const ConnectModal: React.FC<Props> = ({ show, setShow }) => {
  const { connect, connectors, error } = useConnect();
  return (
    <Modal
      isOpen={show}
      className={classes.container}
      ariaHideApp={false}
      onRequestClose={() => setShow(false)}
      shouldCloseOnOverlayClick={true}
    >
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
    </Modal>
  );
};

export default ConnectModal;
