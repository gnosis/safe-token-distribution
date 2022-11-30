import clsx from "clsx";

import classes from "./style.module.css";

interface Props {
  isError: boolean;
  className?: string;
}

const ConnectionStatus: React.FC<Props> = ({ isError, className }) => {
  return (
    <div className={clsx(className, classes.connectionStatus)}>
      <div className={clsx(classes.indicator, isError && classes.error)} />
      <div className={classes.indicatorLabel}>
        {isError ? "Connecting..." : "Live"}
      </div>
    </div>
  );
};

export default ConnectionStatus;
