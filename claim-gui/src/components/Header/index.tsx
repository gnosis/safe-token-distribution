import ConnectButton from "../ConnectButton";
import GnosisLogo from "../GnosisLogo";
import SafeTag from "../SafeTag";
import classes from "./style.module.css";

const Header: React.FC = () => {
  return (
    <header className={classes.header}>
      <div className={classes.name}>
        <GnosisLogo />
        <h1>
          <span>Claim</span>
          <SafeTag />
        </h1>
      </div>
      <ConnectButton />
    </header>
  );
};

export default Header;
