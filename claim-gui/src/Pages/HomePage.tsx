import React from "react";
import AllocationInfo from "../components/AllocationInfo";
import Footer from "../components/Footer";
import MainActionButton from "../components/MainActionButton";

import classes from "./HomePage.module.css";
import Header from "../components/Header";
import CalendarReminder from "../components/CalendarReminder";
import { useNetwork } from "wagmi";
import { distroSetup } from "../config";

const HomePage = () => {
  const network = useNetwork();
  const { isDistroEnabled } = distroSetup(network);

  return (
    <div className={classes.container}>
      <Header />
      <main className={classes.main}>
        <AllocationInfo isDistroEnabled={isDistroEnabled} />

        {isDistroEnabled && (
          <>
            <MainActionButton />
            <CalendarReminder />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
