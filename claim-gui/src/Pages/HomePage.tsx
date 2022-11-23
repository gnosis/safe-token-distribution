import React from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import AllocationInfo from "../components/AllocationInfo";
import Footer from "../components/Footer";
import MainActionButton from "../components/MainActionButton";

import classes from "./HomePage.module.css";
import GnosisLogo from "../components/GnosisLogo";

const HomePage = () => {
  return (
    <div className={classes.container}>
      <header className={classes.header}>
        <GnosisLogo />
        <ConnectButton showBalance={false} />
      </header>
      <main className={classes.main}>
        <AllocationInfo />
        <MainActionButton />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
