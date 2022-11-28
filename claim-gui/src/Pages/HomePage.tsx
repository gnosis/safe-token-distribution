import React from "react";
import AllocationInfo from "../components/AllocationInfo";
import Footer from "../components/Footer";
import MainActionButton from "../components/MainActionButton";

import classes from "./HomePage.module.css";
import GnosisLogo from "../components/GnosisLogo";
import ConnectButton from "../components/ConnectButton";

const HomePage = () => {
  return (
    <div className={classes.container}>
      <header className={classes.header}>
        <GnosisLogo />
        <ConnectButton />
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
