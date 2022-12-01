import React from "react";
import AllocationInfo from "../components/AllocationInfo";
import Footer from "../components/Footer";
import MainActionButton from "../components/MainActionButton";

import classes from "./HomePage.module.css";
import GnosisLogo from "../components/GnosisLogo";
import ConnectButton from "../components/ConnectButton";
import Header from "../components/Header";

const HomePage = () => {
  return (
    <div className={classes.container}>
      <Header />
      <main className={classes.main}>
        <AllocationInfo />
        <MainActionButton />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
