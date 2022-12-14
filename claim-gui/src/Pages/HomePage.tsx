import React from "react";

import AllocationInfo from "../components/AllocationInfo";
import CalendarReminder from "../components/CalendarReminder";
import MainActionButton from "../components/MainActionButton";

import classes from "./HomePage.module.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import useDistroSetup from "../hooks/useDistroSetup";

const HomePage = () => {
  const { isDistroEnabled, distroAddress } = useDistroSetup();

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
      <Footer isDistroEnabled={isDistroEnabled} distroAddress={distroAddress} />
    </div>
  );
};

export default HomePage;
