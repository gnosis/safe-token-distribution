import React from "react";
import AllocationInfo from "../components/AllocationInfo";
import Footer from "../components/Footer";
import MainActionButton from "../components/MainActionButton";

import classes from "./HomePage.module.css";
import Header from "../components/Header";
import CalendarReminder from "../components/CalendarReminder";
import { useContractRead } from "wagmi";
import safeTokenContract from "../utils/SafeTokenContract";

const HomePage = () => {
  const { data } = useContractRead({
    ...safeTokenContract,
    functionName: "paused",
  });

  const tokenPaused = data ? data : true;
  return (
    <div className={classes.container}>
      <Header />
      <main className={classes.main}>
        <AllocationInfo paused={tokenPaused} />

        {!tokenPaused && (
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
