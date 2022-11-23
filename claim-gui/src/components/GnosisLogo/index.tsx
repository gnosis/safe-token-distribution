import React from "react";

import classes from "./style.module.css";

const GnosisLogo: React.FC = () => (
  <div className={classes.container}>
    <img
      className={classes.logo}
      src="/gno.svg"
      alt="Gnosis Logo"
      height={36}
      width={36}
    />
  </div>
);

export default GnosisLogo;
